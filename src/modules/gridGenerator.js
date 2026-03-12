import logger from '../utils/logger.js';

const CITY_BOUNDS = {
  'Ho Chi Minh': {
    latMin: 10.45,
    latMax: 11.15,
    lonMin: 106.35,
    lonMax: 107.05,
  },
  'Ha Noi': {
    latMin: 20.95,
    latMax: 21.10,
    lonMin: 105.75,
    lonMax: 105.90,
  },
  'Nha Trang': {
    latMin: 12.20,
    latMax: 12.30,
    lonMin: 109.15,
    lonMax: 109.25,
  },
  'Da Lat': {
    latMin: 11.92,
    latMax: 11.98,
    lonMin: 108.42,
    lonMax: 108.48,
  },
};

/**
 * Generate grid coordinates for a given city.
 * @param {string} cityName - Name of the city
 * @param {number} step - Grid step in degrees (default 0.05 ≈ ~5km)
 * @returns {{ coords: string[], city: string }}
 */
export const generateCityGrid = (cityName, step = 0.05) => {
  const bounds = CITY_BOUNDS[cityName];
  if (!bounds) {
    logger.warn(`No bounds defined for city: ${cityName}`);
    return { coords: [], city: cityName };
  }

  const coords = [];
  for (let lat = bounds.latMin; lat <= bounds.latMax; lat += step) {
    for (let lon = bounds.lonMin; lon <= bounds.lonMax; lon += step) {
      coords.push(`${lat.toFixed(2)},${lon.toFixed(2)}`);
    }
  }

  logger.info(`Generated ${coords.length} grid points for ${cityName}`);
  return { coords, city: cityName };
};

/**
 * Generate grid coordinates for multiple cities.
 * @param {string[]} cities - Array of city names
 * @param {number} step - Grid step in degrees
 * @returns {Array<{ coord: string, city: string }>}
 */
export const generateAllGrids = (cities, step = 0.05) => {
  const allCoords = [];
  for (const city of cities) {
    const { coords } = generateCityGrid(city, step);
    for (const coord of coords) {
      allCoords.push({ coord, city });
    }
  }
  logger.info(`Total grid points across all cities: ${allCoords.length}`);
  return allCoords;
};

/**
 * Add a custom city bounding box at runtime.
 * @param {string} cityName
 * @param {{ latMin: number, latMax: number, lonMin: number, lonMax: number }} bounds
 */
export const addCity = (cityName, bounds) => {
  CITY_BOUNDS[cityName] = bounds;
  logger.info(`Added custom city bounds for: ${cityName}`);
};

export { CITY_BOUNDS };
