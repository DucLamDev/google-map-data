import { createObjectCsvWriter } from 'csv-writer';
import path from 'path';
import fs from 'fs';
import Business from './models/Business.js';
import logger from './utils/logger.js';

const EXPORT_DIR = path.resolve('exports');

/**
 * Export leads to CSV file.
 * @param {Object} filters - Optional MongoDB query filters
 * @param {string} filename - Output filename (without extension)
 * @returns {string} Path to the exported file
 */
export const exportToCSV = async (filters = {}, filename = 'leads') => {
  if (!fs.existsSync(EXPORT_DIR)) {
    fs.mkdirSync(EXPORT_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filePath = path.join(EXPORT_DIR, `${filename}_${timestamp}.csv`);

  // Write UTF-8 BOM first so Excel recognizes Vietnamese characters
  fs.writeFileSync(filePath, '\uFEFF', 'utf8');

  const csvWriter = createObjectCsvWriter({
    path: filePath,
    append: true,
    header: [
      { id: 'name', title: 'Company Name' },
      { id: 'website', title: 'Website' },
      { id: 'email', title: 'Email' },
      { id: 'phone', title: 'Phone' },
      { id: 'address', title: 'Address' },
      { id: 'rating', title: 'Rating' },
      { id: 'reviews', title: 'Reviews' },
      { id: 'city', title: 'City' },
      { id: 'keyword', title: 'Keyword' },
      { id: 'leadScore', title: 'Lead Score' },
      { id: 'emailValid', title: 'Email Valid' },
    ],
    encoding: 'utf8',
  });

  const businesses = await Business.find(filters)
    .sort({ leadScore: -1, createdAt: -1 })
    .lean();

  const records = businesses.map((b) => ({
    name: b.name || '',
    website: b.website || '',
    email: b.email || '',
    phone: b.phone || '',
    address: b.address || '',
    rating: b.rating || 0,
    reviews: b.reviews || 0,
    city: b.city || '',
    keyword: b.keyword || '',
    leadScore: b.leadScore || 0,
    emailValid: b.emailValid ? 'Yes' : 'No',
  }));

  await csvWriter.writeRecords(records);
  logger.info(`Exported ${records.length} leads to ${filePath}`);

  return filePath;
};

/**
 * Export only leads that have emails.
 */
export const exportEmailLeads = async (filename = 'email_leads') => {
  return exportToCSV({ email: { $ne: '' } }, filename);
};

/**
 * Export high-score leads (score >= threshold).
 */
export const exportHighScoreLeads = async (threshold = 50, filename = 'high_score_leads') => {
  return exportToCSV({ leadScore: { $gte: threshold } }, filename);
};

