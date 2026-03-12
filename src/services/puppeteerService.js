import puppeteer from 'puppeteer';
import env from '../config/env.js';
import logger from '../utils/logger.js';

const EMAIL_REGEX = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;

/**
 * Crawl a dynamic website using Puppeteer to render JavaScript.
 * Use this as a fallback when Axios/Cheerio cannot extract emails.
 * @param {string} url
 * @returns {string[]} Extracted emails
 */
export const crawlDynamicWebsite = async (url) => {
  let browser;
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: env.requestTimeout,
    });

    // Wait for potential lazy-loaded content
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Extract page text content
    const textContent = await page.evaluate(() => document.body.innerText);
    const htmlContent = await page.content();

    const allEmails = new Set();

    // Extract from visible text
    const textMatches = textContent.match(EMAIL_REGEX) || [];
    textMatches.forEach((e) => allEmails.add(e.toLowerCase()));

    // Extract from HTML source
    const htmlMatches = htmlContent.match(EMAIL_REGEX) || [];
    htmlMatches.forEach((e) => allEmails.add(e.toLowerCase()));

    // Extract mailto: links
    const mailtoEmails = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href^="mailto:"]');
      return Array.from(links).map((a) =>
        a.getAttribute('href').replace('mailto:', '').split('?')[0].toLowerCase()
      );
    });
    mailtoEmails.forEach((e) => allEmails.add(e));

    // Crawl contact page if it exists
    const contactPaths = ['/contact', '/contact-us', '/about'];
    for (const path of contactPaths) {
      try {
        const contactUrl = new URL(path, url).href;
        await page.goto(contactUrl, { waitUntil: 'networkidle2', timeout: 10000 });
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const contactHtml = await page.content();
        const contactMatches = contactHtml.match(EMAIL_REGEX) || [];
        contactMatches.forEach((e) => allEmails.add(e.toLowerCase()));
      } catch {
        // Contact page may not exist
      }
    }

    logger.info(`[Puppeteer] Found ${allEmails.size} email(s) from ${url}`);
    return [...allEmails];
  } catch (error) {
    logger.error(`[Puppeteer] Error crawling ${url}: ${error.message}`);
    return [];
  } finally {
    if (browser) await browser.close();
  }
};
