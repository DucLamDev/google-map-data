import Business from '../models/Business.js';
import logger from '../utils/logger.js';

/**
 * Check if a business already exists using multiple criteria:
 * 1. place_id match
 * 2. website match
 * 3. name + address match
 * @param {Object} businessData
 * @returns {Object|null} Existing business document or null
 */
export const findDuplicate = async (businessData) => {
  const conditions = [];

  if (businessData.place_id) {
    conditions.push({ place_id: businessData.place_id });
  }

  if (businessData.website) {
    const normalizedWebsite = normalizeUrl(businessData.website);
    conditions.push({ website: normalizedWebsite });
  }

  if (businessData.name && businessData.address) {
    conditions.push({
      name: { $regex: new RegExp(`^${escapeRegex(businessData.name)}$`, 'i') },
      address: { $regex: new RegExp(`^${escapeRegex(businessData.address)}$`, 'i') },
    });
  }

  if (conditions.length === 0) return null;

  try {
    const existing = await Business.findOne({ $or: conditions });
    return existing;
  } catch (error) {
    logger.error(`Deduplication check error: ${error.message}`);
    return null;
  }
};

/**
 * Upsert a business — insert if new, update if duplicate.
 * @param {Object} businessData
 * @returns {{ doc: Object, isNew: boolean }}
 */
export const upsertBusiness = async (businessData) => {
  const existing = await findDuplicate(businessData);

  if (existing) {
    // Merge: update fields that are empty in existing but present in new data
    const updates = {};
    for (const key of ['phone', 'email', 'website', 'address', 'rating', 'reviews']) {
      if (businessData[key] && !existing[key]) {
        updates[key] = businessData[key];
      }
    }

    // Always update rating/reviews if new data is more recent
    if (businessData.rating && businessData.rating > 0) {
      updates.rating = businessData.rating;
    }
    if (businessData.reviews && businessData.reviews > existing.reviews) {
      updates.reviews = businessData.reviews;
    }

    if (Object.keys(updates).length > 0) {
      await Business.updateOne({ _id: existing._id }, { $set: updates });
      logger.debug(`Updated existing business: ${existing.name}`);
    } else {
      logger.debug(`Duplicate skipped (no new data): ${existing.name}`);
    }

    return { doc: existing, isNew: false };
  }

  // Normalize website before insert
  if (businessData.website) {
    businessData.website = normalizeUrl(businessData.website);
  }

  const doc = await Business.create(businessData);
  logger.debug(`New business created: ${doc.name}`);
  return { doc, isNew: true };
};

/**
 * Normalize a URL for consistent deduplication.
 * @param {string} url
 * @returns {string}
 */
const normalizeUrl = (url) => {
  if (!url) return '';
  let normalized = url.toLowerCase().trim();
  // Remove protocol
  normalized = normalized.replace(/^https?:\/\//, '');
  // Remove www.
  normalized = normalized.replace(/^www\./, '');
  // Remove trailing slash
  normalized = normalized.replace(/\/+$/, '');
  return normalized;
};

/**
 * Escape special regex characters in a string.
 * @param {string} str
 * @returns {string}
 */
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Run a full deduplication pass on all existing records.
 * Merges duplicates and removes extras.
 * @returns {{ merged: number, removed: number }}
 */
export const runFullDeduplication = async () => {
  let merged = 0;
  let removed = 0;

  // Deduplicate by place_id
  const placeIdDupes = await Business.aggregate([
    { $match: { place_id: { $ne: '', $exists: true } } },
    { $group: { _id: '$place_id', count: { $sum: 1 }, ids: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } },
  ]);

  for (const group of placeIdDupes) {
    const docs = await Business.find({ _id: { $in: group.ids } }).sort({ createdAt: 1 });
    const primary = docs[0];

    for (let i = 1; i < docs.length; i++) {
      // Merge any missing fields into primary
      const updates = {};
      for (const key of ['phone', 'email', 'website', 'address']) {
        if (docs[i][key] && !primary[key]) {
          updates[key] = docs[i][key];
        }
      }
      if (Object.keys(updates).length > 0) {
        await Business.updateOne({ _id: primary._id }, { $set: updates });
        merged++;
      }
      await Business.deleteOne({ _id: docs[i]._id });
      removed++;
    }
  }

  logger.info(`Deduplication complete: ${merged} merged, ${removed} removed`);
  return { merged, removed };
};
