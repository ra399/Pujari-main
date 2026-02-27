import ProviderAvailability from '../models/providerAvailability.model.js';

export async function getProviderAvailability(req, res, next) {
  try {
    const slots = await ProviderAvailability.find({
      providerId: req.params.id,
      isActive: true,
    });

    res.json(slots);
  } catch (err) {
    next(err);
  }
}

