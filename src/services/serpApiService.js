import axios from 'axios';
import env from '../config/env.js';
import logger from '../utils/logger.js';

/**
 * Search Google Maps via SerpApi.
 * @param {string} keyword - Search query (e.g. "travel agency")
 * @param {string} coords - Lat,Long string (e.g. "10.90,106.60")
 * @param {number} retries - Current retry count
 * @returns {Array<Object>} Parsed business results
 */
export const searchGoogleMaps = async (keyword, coords, retries = 0) => {
  const [lat, lon] = coords.split(',');
  const ll = `@${lat},${lon},14z`;

  try {
    const response = await axios.get('https://serpapi.com/search.json', {
      params: {
        engine: 'google_maps',
        q: keyword,
        ll,
        api_key: env.serpApiKey,
      },
      timeout: env.requestTimeout,
    });

    const localResults = response.data.local_results || [];

    const businesses = localResults.map((r) => ({
      title: r.title || '',
      address: r.address || '',
      phone: r.phone || '',
      website: r.website || '',
      rating: r.rating || 0,
      reviews: r.reviews || 0,
      place_id: r.place_id || '',
      gps_coordinates: r.gps_coordinates || null,
    }));

    logger.info(
      `SerpApi returned ${businesses.length} results for "${keyword}" at ${coords}`
    );
    return businesses;
  } catch (error) {
    if (retries < env.maxRetries) {
      const delay = Math.pow(2, retries) * 1000;
      logger.warn(
        `SerpApi request failed (attempt ${retries + 1}/${env.maxRetries}): ${error.message}. Retrying in ${delay}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return searchGoogleMaps(keyword, coords, retries + 1);
    }
    logger.error(`SerpApi request failed after ${env.maxRetries} retries: ${error.message}`);
    throw error;
  }
};
