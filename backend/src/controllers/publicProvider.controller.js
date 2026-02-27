import ProviderProfile from '../models/provider.model.js';
import ProviderAvailability from '../models/providerAvailability.model.js';

function normalizeKey(name) {
  return name.toLowerCase().trim().replace(/\s+/g, "_");
}

export async function listProviders(req, res, next) {
  try {
    const { serviceType, service, city, lat, long, radius, minRating, limit = 10 } = req.query;

    const filter = {
      status: 'APPROVED',
      isActive: true,
    };

    if (minRating) {
      filter.rating = { $gte: Number(minRating) };
    }

    const serviceQuery = service ?? serviceType;
    if (serviceQuery) {
      // Use case-insensitive regex for partial/prefix matching
      // Search in both service name and key
      filter.$or = [
        { "services.name": { $regex: new RegExp(serviceQuery, 'i') } },
        { "services.key": { $regex: new RegExp(serviceQuery, 'i') } }
      ];
    }

    if (city) {
      filter["location.city"] = { $regex: new RegExp(String(city), 'i') }; // Case insensitive city match
    }

    const hasLat = lat !== undefined;
    const hasLong = long !== undefined;
    const hasRadius = radius !== undefined;

    if (hasLat || hasLong || hasRadius) {
      if (!hasLat || !hasLong || !hasRadius) {
        return res.status(400).json({
          message: "lat, long, and radius are required together",
        });
      }

      const latitude = Number(lat);
      const longitude = Number(long);
      const radiusKm = Number(radius);

      if (
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude) ||
        !Number.isFinite(radiusKm) ||
        radiusKm <= 0
      ) {
        return res.status(400).json({
          message: "lat, long, and radius must be valid numbers (radius > 0)",
        });
      }

      const EARTH_RADIUS_KM = 6378.1;
      filter["location.geo"] = {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], radiusKm / EARTH_RADIUS_KM],
        },
      };
    }

    const providers = await ProviderProfile.find(filter)
      .populate('user', 'name profile_pic')
      .select('services location rating ratingCount experienceYears user profile_pic')
      .sort({ rating: -1 }) // Sort by rating descending
      .limit(Number(limit));

    const response = providers.map((p) => ({
      id: p._id,
      name: p.user?.name || 'Provider',
      location: p.location?.city,
      experience: p.experienceYears ? `${p.experienceYears} years exp` : "New Profile",
      rating: p.rating ? p.rating.toFixed(1) : "0.0",
      reviews: `${p.ratingCount || 0} reviews`,
      price: p.services?.[0] ? `₹${p.services[0].price}+` : "Price on request",
      tags: p.services?.slice(0, 2).map(s => s.name) || [],
      image: p.profile_pic || p.user?.profile_pic || 'https://images.unsplash.com/photo-1589182397057-b82d519703f7?q=80&w=200&auto=format&fit=crop',
      fullServices: Array.isArray(p.services) ? p.services : []
    }));

    res.json(response);
  } catch (err) {
    next(err);
  }
}

export async function getAllServices(req, res, next) {
  try {
    // Aggregation to get unique services across all providers
    const services = await ProviderProfile.aggregate([
      { $match: { status: 'APPROVED', isActive: true } },
      { $unwind: "$services" },
      {
        $group: {
          _id: "$services.key",
          name: { $first: "$services.name" },
          key: { $first: "$services.key" }
        }
      },
      { $limit: 10 }
    ]);

    // Map icons (hardcoded icons for standard keys)
    const iconMap = {
      puja: '📿',
      havan: '🔥',
      griha_pravesh: '🏠',
      vivah: '💍',
      yagna: '🕯️'
    };

    const response = services.map(s => ({
      id: s.key,
      name: s.name,
      icon: iconMap[s.key] || '✨'
    }));

    res.json(response);
  } catch (err) {
    next(err);
  }
}


export async function getProviderDetails(req, res, next) {
  try {
    const provider = await ProviderProfile.findOne({
      _id: req.params.id,
      status: 'APPROVED',
      isActive: true,
    })
      .populate('user', 'name phone profile_pic') // Added profile_pic
      .select('bio services location experienceYears rating ratingCount user languages profile_pic');

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    const availability = await ProviderAvailability.find({
      providerId: provider._id,
      isActive: true,
    }).select('dayOfWeek startTime endTime');

    const services = Array.isArray(provider.services)
      ? provider.services
          .filter((s) => {
            const hasName = typeof s?.name === 'string' && s.name.trim().length > 0;
            const hasKey = typeof s?.key === 'string' && s.key.trim().length > 0;
            const hasPrice = typeof s?.price === 'number' && Number.isFinite(s.price);
            return hasName && hasKey && hasPrice;
          })
          // Map only required fields for response
          .map((s) => ({
            _id: s._id,
            name: s.name,
            key: s.key,
            price: s.price,
            duration: s.duration,
            description: s.description
          }))
      : [];

    // Only return location.city (do not expose geo/lat/long)
    const location = { city: provider.location?.city || "Unknown Location" };

    res.json({
      providerId: provider._id,
      name: provider.user?.name || 'Provider',
      phone: provider.user?.phone, // Optional: if you want to allow direct contact
      bio: provider.bio ?? "",
      experienceYears: provider.experienceYears ?? 0,
      rating: provider.rating ?? 0,
      ratingCount: provider.ratingCount ?? 0,
      location,
      services,
      image: provider.profile_pic || provider.user?.profile_pic || 'https://images.unsplash.com/photo-1589182397057-b82d519703f7?q=80&w=200&auto=format&fit=crop',
      languages: provider.languages || ['Hindi'],
      availability: Array.isArray(availability) ? availability : [],
    });
  } catch (err) {
    next(err);
  }
}

export async function getSearchSuggestions(req, res, next) {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json([]);
    }

    const start = Date.now();
    
    // Aggregation to find services matching the prefix
    const result = await ProviderProfile.aggregate([
      // 1. Only look at active/approved providers
      {
        $match: {
          status: 'APPROVED',
          isActive: true
        }
      },
      // 2. Unwind services to filter them individually
      { $unwind: "$services" },
      // 3. Match services where name starts with 'q' (case-insensitive)
      {
        $match: {
          "services.name": { $regex: new RegExp(q, 'i') }
        }
      },
      // 4. Group by service name to get unique services
      {
        $group: {
          _id: "$services.name"
        }
      },
      // 5. Sort alphabetically
      { $sort: { _id: 1 } },
      // 6. Limit to 3 suggestions
      { $limit: 3 }
    ]);

    const suggestions = result.map(s => s._id);
    console.log(`[getSearchSuggestions] Query: "${q}" -> Found: ${suggestions.length} in ${Date.now() - start}ms`);
    
    res.json(suggestions);
  } catch (err) {
    next(err);
  }
}
