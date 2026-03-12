import validator from 'validator';
import logger from '../utils/logger.js';

const BLACKLISTED_DOMAINS = [
  'yahoo.com',
  'outlook.com',
  'example.com',
  'test.com',
  'localhost',
  'sentry.io',
  'wixpress.com',
  'mailinator.com',
  'tempmail.com',
  'guerrillamail.com',
  'sharklasers.com',
];

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.bmp', '.ico'];

/**
 * Check if an email belongs to a blacklisted / free-email domain.
 * @param {string} email
 * @returns {boolean}
 */
const isBlacklistedDomain = (email) => {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return true;
  return BLACKLISTED_DOMAINS.some((d) => domain === d || domain.endsWith(`.${d}`));
};

/**
 * Check if the email is actually a filename (image, css, etc).
 * @param {string} email
 * @returns {boolean}
 */
const isFileReference = (email) => {
  const lower = email.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
};

/**
 * Clean and validate a list of emails.
 * Returns only valid business emails.
 * @param {string[]} emails
 * @returns {string[]}
 */
export const cleanEmails = (emails) => {
  const cleaned = [];

  for (const raw of emails) {
    const email = raw.trim().toLowerCase();

    // Basic format check
    if (!validator.isEmail(email)) {
      logger.debug(`Invalid email format: ${email}`);
      continue;
    }

    // Skip file-like references
    if (isFileReference(email)) {
      logger.debug(`Skipping file reference: ${email}`);
      continue;
    }

    // Skip blacklisted domains
    if (isBlacklistedDomain(email)) {
      logger.debug(`Skipping blacklisted domain: ${email}`);
      continue;
    }

    // Skip noreply / system emails
    const localPart = email.split('@')[0];
    if (['noreply', 'no-reply', 'mailer-daemon', 'postmaster', 'webmaster'].includes(localPart)) {
      logger.debug(`Skipping system email: ${email}`);
      continue;
    }

    cleaned.push(email);
  }

  return [...new Set(cleaned)];
};

/**
 * Validate email with DNS MX check (basic heuristic).
 * For production, integrate a real email validation API.
 * @param {string} email
 * @returns {boolean}
 */
export const validateEmail = (email) => {
  if (!validator.isEmail(email)) return false;
  if (isBlacklistedDomain(email)) return false;
  if (isFileReference(email)) return false;
  return true;
};

/**
 * Score a lead (0-100) based on available information.
 * @param {{ email: string, website: string, phone: string, rating: number, reviews: number }} lead
 * @returns {number}
 */
export const scoreLead = (lead) => {
  let score = 0;

  if (lead.email) score += 30;
  if (lead.website) score += 15;
  if (lead.phone) score += 15;
  if (lead.rating >= 4.0) score += 15;
  else if (lead.rating >= 3.0) score += 10;
  else if (lead.rating > 0) score += 5;
  if (lead.reviews > 100) score += 15;
  else if (lead.reviews > 20) score += 10;
  else if (lead.reviews > 0) score += 5;

  // Bonus for having multiple data points
  const dataPoints = [lead.email, lead.website, lead.phone, lead.rating, lead.reviews].filter(Boolean).length;
  if (dataPoints >= 4) score += 10;

  return Math.min(score, 100);
};
