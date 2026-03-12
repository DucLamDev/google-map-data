import { Router } from 'express';
import Business from '../models/Business.js';
import { addMapsSearchJob } from '../queues/queueSetup.js';
import { getQueueStats } from '../queues/queueSetup.js';
import { generateAllGrids, generateCityGrid, addCity, CITY_BOUNDS } from '../modules/gridGenerator.js';
import { exportToCSV, exportEmailLeads, exportHighScoreLeads } from '../export.js';
import { runFullDeduplication } from '../services/deduplicationService.js';
import logger from '../utils/logger.js';

const router = Router();

// ─── Health Check ────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── Queue Stats ─────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const queueStats = await getQueueStats();
    const totalBusinesses = await Business.countDocuments();
    const withEmail = await Business.countDocuments({ email: { $ne: '' } });
    const crawled = await Business.countDocuments({ crawled: true });

    res.json({
      queues: queueStats,
      database: {
        totalBusinesses,
        withEmail,
        crawled,
        withoutEmail: totalBusinesses - withEmail,
        pendingCrawl: totalBusinesses - crawled,
      },
    });
  } catch (error) {
    logger.error(`Stats error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// ─── Start Scraping ──────────────────────────────────────────────────
router.post('/scrape', async (req, res) => {
  try {
    const { keywords, cities, gridStep } = req.body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({ error: 'keywords array is required' });
    }

    const targetCities = cities && Array.isArray(cities) ? cities : Object.keys(CITY_BOUNDS);
    const gridPoints = generateAllGrids(targetCities, gridStep || 0.05);

    let jobCount = 0;
    for (const keyword of keywords) {
      for (const { coord, city } of gridPoints) {
        await addMapsSearchJob(keyword, coord, city);
        jobCount++;
      }
    }

    res.json({
      message: 'Scraping jobs queued',
      jobCount,
      keywords: keywords.length,
      gridPoints: gridPoints.length,
      cities: targetCities,
    });
  } catch (error) {
    logger.error(`Scrape start error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// ─── Get Leads ───────────────────────────────────────────────────────
router.get('/leads', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      city,
      keyword,
      hasEmail,
      minScore,
      sortBy = 'leadScore',
      order = 'desc',
    } = req.query;

    const filter = {};
    if (city) filter.city = city;
    if (keyword) filter.keyword = keyword;
    if (hasEmail === 'true') filter.email = { $ne: '' };
    if (minScore) filter.leadScore = { $gte: parseInt(minScore, 10) };

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const sort = { [sortBy]: order === 'asc' ? 1 : -1 };

    const [leads, total] = await Promise.all([
      Business.find(filter).sort(sort).skip(skip).limit(parseInt(limit, 10)).lean(),
      Business.countDocuments(filter),
    ]);

    res.json({
      data: leads,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    logger.error(`Get leads error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// ─── Get Single Lead ─────────────────────────────────────────────────
router.get('/leads/:id', async (req, res) => {
  try {
    const lead = await Business.findById(req.params.id).lean();
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Delete Lead ─────────────────────────────────────────────────────
router.delete('/leads/:id', async (req, res) => {
  try {
    const result = await Business.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Lead not found' });
    res.json({ message: 'Lead deleted', id: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Export CSV ──────────────────────────────────────────────────────
router.post('/export', async (req, res) => {
  try {
    const { type = 'all', minScore = 50 } = req.body;

    let filePath;
    switch (type) {
      case 'email':
        filePath = await exportEmailLeads();
        break;
      case 'highscore':
        filePath = await exportHighScoreLeads(minScore);
        break;
      default:
        filePath = await exportToCSV();
    }

    res.json({ message: 'Export complete', filePath });
  } catch (error) {
    logger.error(`Export error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// ─── Download CSV ────────────────────────────────────────────────────
router.get('/export/download', async (req, res) => {
  try {
    const { type = 'all', minScore = 50 } = req.query;

    let filePath;
    switch (type) {
      case 'email':
        filePath = await exportEmailLeads();
        break;
      case 'highscore':
        filePath = await exportHighScoreLeads(parseInt(minScore, 10));
        break;
      default:
        filePath = await exportToCSV();
    }

    res.download(filePath);
  } catch (error) {
    logger.error(`Download error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// ─── Run Deduplication ───────────────────────────────────────────────
router.post('/deduplicate', async (req, res) => {
  try {
    const result = await runFullDeduplication();
    res.json({ message: 'Deduplication complete', ...result });
  } catch (error) {
    logger.error(`Deduplication error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

// ─── City Grid Management ────────────────────────────────────────────
router.get('/cities', (req, res) => {
  const cities = Object.entries(CITY_BOUNDS).map(([name, bounds]) => ({
    name,
    ...bounds,
  }));
  res.json(cities);
});

router.post('/cities', (req, res) => {
  const { name, latMin, latMax, lonMin, lonMax } = req.body;
  if (!name || latMin == null || latMax == null || lonMin == null || lonMax == null) {
    return res.status(400).json({ error: 'name, latMin, latMax, lonMin, lonMax are required' });
  }
  addCity(name, { latMin, latMax, lonMin, lonMax });
  const grid = generateCityGrid(name);
  res.json({ message: `City "${name}" added`, gridPoints: grid.coords.length });
});

router.get('/cities/:name/grid', (req, res) => {
  const step = parseFloat(req.query.step) || 0.05;
  const grid = generateCityGrid(req.params.name, step);
  res.json(grid);
});

export default router;
