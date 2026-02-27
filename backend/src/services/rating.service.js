import ProviderProfile from "../models/provider.model.js";

/**
 * Updates provider rating by recalculating the average rating
 * @param {string} providerId - The provider's MongoDB ObjectId
 * @param {number} newRating - The new rating value (1-5)
 * @returns {Promise<Object>} The updated provider document
 */
export async function updateProviderRating(providerId, newRating) {
  // Fetch provider
  const provider = await ProviderProfile.findById(providerId);
  
  if (!provider) {
    const err = new Error("Provider not found");
    err.statusCode = 404;
    throw err;
  }

  // Get current values (default to 0 if not set)
  const currentRating = provider.rating || 0;
  const currentCount = provider.ratingCount || 0;

  // Recalculate average rating: (rating * ratingCount + newRating) / (ratingCount + 1)
  const newAverageRating = (currentRating * currentCount + newRating) / (currentCount + 1);

  // Update provider
  provider.rating = newAverageRating;
  provider.ratingCount = currentCount + 1;

  // Save provider
  await provider.save();

  return provider;
}
