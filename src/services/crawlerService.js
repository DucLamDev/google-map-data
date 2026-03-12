import axios from 'axios';
import * as cheerio from 'cheerio';
import env from '../config/env.js';
import logger from '../utils/logger.js';

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

const ADDITIONAL_PATHS = ['/contact', '/contact-us', '/about', '/about-us', '/imprint'];

/**
 * Extract emails from HTML string.
 * @param {string} html
 * @returns {string[]}
 */
const extractEmailsFromHtml = (html) => {
  if (!html) return [];
  const decoded = html.replace(/&#64;/g, '@').replace(/\[at\]/gi, '@').replace(/\(at\)/gi, '@');
  const matches = decoded.match(EMAIL_REGEX) || [];
  return [...new Set(matches.map((e) => e.toLowerCase()))];
};

/**
 * Extract links from footer or contact sections.
 * @param {string} html
 * @param {string} baseUrl
 * @returns {string[]}
 */
const extractFooterLinks = (html, baseUrl) => {
  const $ = cheerio.load(html);
  const links = new Set();

  $('footer a, .footer a, #footer a, [class*="contact"] a, [id*="contact"] a').each((_, el) => {
    const href = $(el).attr('href');
    if (href && !href.startsWith('mailto:') && !href.startsWith('tel:') && !href.startsWith('#')) {
      try {
        const url = new URL(href, baseUrl);
        if (url.origin === new URL(baseUrl).origin) {
          links.add(url.href);
        }
      } catch {
        // ignore invalid URLs
      }
    }
  });

  return [...links];
};

/**
 * Fetch a single page HTML with retry.
 * @param {string} url
 * @param {number} retries
 * @returns {string|null}
 */
const fetchPage = async (url, retries = 0) => {
  try {
    const response = await axios.get(url, {
      timeout: env.requestTimeout,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      maxRedirects: 5,
      validateStatus: (status) => status < 400,
    });
    return typeof response.data === 'string' ? response.data : '';
  } catch (error) {
    if (retries < env.maxRetries) {
      const delay = Math.pow(2, retries) * 1000;
      logger.debug(`Fetch failed for ${url} (attempt ${retries + 1}): ${error.message}. Retrying...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchPage(url, retries + 1);
    }
    logger.warn(`Failed to fetch ${url} after ${env.maxRetries} retries: ${error.message}`);
    return null;
  }
};

/**
 * Crawl a website and extract emails.
 * @param {string} websiteUrl - The business website URL
 * @returns {string[]} Array of extracted emails
 */
export const crawlWebsite = async (websiteUrl) => {
  const allEmails = new Set();
  const crawledUrls = new Set();
  const extraPaths = [...ADDITIONAL_PATHS];

  // Normalize URL
  let baseUrl = websiteUrl;
  if (!baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`;
  }
  // Remove trailing slash
  baseUrl = baseUrl.replace(/\/+$/, '');

  try {
    // 1. Crawl homepage
    logger.info(`Crawling homepage: ${baseUrl}`);
    const homepageHtml = await fetchPage(baseUrl);
    crawledUrls.add(baseUrl);

    if (homepageHtml) {
      const emails = extractEmailsFromHtml(homepageHtml);
      emails.forEach((e) => allEmails.add(e));

      // Extract mailto: links
      const $ = cheerio.load(homepageHtml);
      $('a[href^="mailto:"]').each((_, el) => {
        const mailto = $(el).attr('href')?.replace('mailto:', '').split('?')[0]?.toLowerCase();
        if (mailto && EMAIL_REGEX.test(mailto)) {
          allEmails.add(mailto);
        }
        EMAIL_REGEX.lastIndex = 0;
      });

      // Extract footer links
      const footerLinks = extractFooterLinks(homepageHtml, baseUrl);
      for (const link of footerLinks) {
        if (!crawledUrls.has(link)) {
          extraPaths.push(new URL(link).pathname);
        }
      }
    }

    // 2. Crawl additional pages
    const uniquePaths = [...new Set(extraPaths)];
    for (const path of uniquePaths) {
      const fullUrl = `${baseUrl}${path}`;
      if (crawledUrls.has(fullUrl)) continue;
      crawledUrls.add(fullUrl);

      await new Promise((resolve) => setTimeout(resolve, env.crawlDelayMs));

      logger.debug(`Crawling sub-page: ${fullUrl}`);
      const html = await fetchPage(fullUrl);
      if (html) {
        const emails = extractEmailsFromHtml(html);
        emails.forEach((e) => allEmails.add(e));
      }
    }

    logger.info(`Found ${allEmails.size} email(s) from ${websiteUrl}`);
    return [...allEmails];
  } catch (error) {
    logger.error(`Crawler error for ${websiteUrl}: ${error.message}`);
    return [...allEmails];
  }
};
