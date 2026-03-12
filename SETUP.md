# Setup Guide

## Quick Start (5 minutes)

### 1. Prerequisites

Install the following on your system:

- **Node.js** >= 18 ([nodejs.org](https://nodejs.org))
- **MongoDB** ([mongodb.com/try/download/community](https://www.mongodb.com/try/download/community))
- **Redis** ([redis.io/download](https://redis.io/download))
- **SerpApi Key** ([serpapi.com](https://serpapi.com) - Free tier: 100 searches/month)

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
# Copy the example env file
cp .env.example .env

# Edit .env and add your SerpApi key
# Minimum required: SERPAPI_KEY
```

**Important**: You MUST set `SERPAPI_KEY` in `.env` or the scraper will fail.

### 4. Start Services

**Terminal 1** - Start MongoDB (if not running as service):
```bash
mongod
```

**Terminal 2** - Start Redis (if not running as service):
```bash
redis-server
```

**Terminal 3** - Start the API server:
```bash
npm start
```

**Terminal 4** - Start the workers:
```bash
npm run workers
```

### 5. Run Your First Scrape

**Terminal 5** - Queue scraping jobs:
```bash
npm run scrape
```

This will:
- Generate 49 grid coordinates across 4 Vietnamese cities
- Queue 490 search jobs (10 keywords × 49 coordinates)
- Workers will process them automatically

### 6. Monitor Progress

Visit: http://localhost:3000/api/stats

Or use curl:
```bash
curl http://localhost:3000/api/stats
```

### 7. Export Results

```bash
# Export all leads
npm run export

# Export only leads with emails
npm run export email

# Export high-score leads (score >= 70)
npm run export highscore 70
```

CSV files are saved to `exports/` folder.

---

## Detailed Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `SERPAPI_KEY` | **Yes** | - | Your SerpApi API key |
| `MONGODB_URI` | No | `mongodb://localhost:27017/leads_scraper` | MongoDB connection string |
| `REDIS_HOST` | No | `127.0.0.1` | Redis host |
| `REDIS_PORT` | No | `6379` | Redis port |
| `REDIS_PASSWORD` | No | - | Redis password (if auth enabled) |
| `PORT` | No | `3000` | API server port |
| `MAPS_WORKER_CONCURRENCY` | No | `10` | Maps search worker threads |
| `CRAWL_WORKER_CONCURRENCY` | No | `10` | Website crawl worker threads |
| `REQUEST_TIMEOUT` | No | `15000` | HTTP request timeout (ms) |
| `MAX_RETRIES` | No | `3` | Max retry attempts for failed requests |
| `CRAWL_DELAY_MS` | No | `1000` | Delay between page crawls (ms) |

### Customizing Cities

Edit `src/startScraper.js`:

```javascript
const CITIES = ['Ho Chi Minh', 'Ha Noi', 'Nha Trang', 'Da Lat'];
```

Or add cities dynamically via API:

```bash
curl -X POST http://localhost:3000/api/cities \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Da Nang",
    "latMin": 16.03,
    "latMax": 16.10,
    "lonMin": 108.15,
    "lonMax": 108.25
  }'
```

### Customizing Keywords

Edit `src/startScraper.js`:

```javascript
const KEYWORDS = [
  'travel agency',
  'hotel',
  'restaurant',
  // Add your keywords here
];
```

### Grid Resolution

Smaller step = more grid points = more API calls = better coverage but higher cost.

Default: `0.05` degrees (~5km)

To change, edit `src/startScraper.js`:

```javascript
const gridPoints = generateAllGrids(CITIES, 0.03); // ~3km resolution
```

---

## Production Deployment

### 1. Use Process Manager

```bash
npm install -g pm2

# Start API server
pm2 start src/server.js --name "lead-scraper-api"

# Start workers
pm2 start src/workers/index.js --name "lead-scraper-workers"

# Save configuration
pm2 save
pm2 startup
```

### 2. Use Remote MongoDB

Update `.env`:
```
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/leads_scraper
```

### 3. Use Remote Redis

Update `.env`:
```
REDIS_HOST=your-redis-host.com
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

### 4. Secure the API

Add authentication middleware in `src/server.js`:

```javascript
app.use('/api', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

### 5. Rate Limiting

SerpApi free tier: 100 searches/month

To avoid hitting limits:
- Reduce `MAPS_WORKER_CONCURRENCY` to 1-2
- Reduce grid resolution (use 0.1 instead of 0.05)
- Limit keywords to high-value searches

### 6. Monitoring

Use PM2 dashboard:
```bash
pm2 monit
```

Check logs:
```bash
pm2 logs lead-scraper-api
pm2 logs lead-scraper-workers
```

---

## Troubleshooting

### "MongoDB connection error"

**Solution**: Ensure MongoDB is running
```bash
# Check if MongoDB is running
mongosh

# Or start it
mongod
```

### "Redis connection refused"

**Solution**: Ensure Redis is running
```bash
# Check if Redis is running
redis-cli ping

# Or start it
redis-server
```

### "SerpApi error: Invalid API key"

**Solution**: Check your `.env` file has correct `SERPAPI_KEY`

### "No emails found"

**Possible causes**:
- Website blocks crawlers (use Puppeteer fallback)
- Website uses JavaScript to render emails (use Puppeteer)
- Email is in image format (cannot extract)

**Solution**: Enable Puppeteer for specific sites in `src/workers/crawlWorker.js`

### Workers not processing jobs

**Solution**: Check Redis connection and ensure workers are running
```bash
npm run workers
```

### High memory usage

**Solution**: Reduce worker concurrency in `.env`:
```
MAPS_WORKER_CONCURRENCY=5
CRAWL_WORKER_CONCURRENCY=5
```

---

## Advanced Features

### Using Puppeteer for Dynamic Sites

Import and use in `src/workers/crawlWorker.js`:

```javascript
import { crawlDynamicWebsite } from '../services/puppeteerService.js';

// Replace crawlWebsite with crawlDynamicWebsite for specific domains
if (website.includes('angular-site.com')) {
  rawEmails = await crawlDynamicWebsite(website);
} else {
  rawEmails = await crawlWebsite(website);
}
```

### Email Validation with External API

Integrate a service like [hunter.io](https://hunter.io) or [zerobounce.net](https://zerobounce.net) in `src/services/emailService.js`

### AI-Powered Business Classification

Add OpenAI integration to categorize businesses:

```javascript
import OpenAI from 'openai';

const classifyBusiness = async (name, address, website) => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{
      role: 'user',
      content: `Classify this business into a category: ${name}, ${address}`
    }]
  });
  return response.choices[0].message.content;
};
```

### Webhook Notifications

Add webhook support when scraping completes:

```javascript
import axios from 'axios';

const notifyComplete = async (stats) => {
  await axios.post(process.env.WEBHOOK_URL, {
    event: 'scrape_complete',
    stats
  });
};
```

---

## API Usage Examples

See `API_EXAMPLES.md` for detailed API documentation.

---

## Performance Tips

1. **Optimize grid resolution**: Use 0.1 for large cities, 0.05 for medium, 0.03 for small
2. **Batch exports**: Export periodically instead of after each scrape
3. **Run deduplication**: `curl -X POST http://localhost:3000/api/deduplicate`
4. **Index MongoDB**: Already configured in `Business.js` schema
5. **Use Redis persistence**: Enable AOF in `redis.conf`

---

## Cost Estimation

**SerpApi Free Tier**: 100 searches/month

With default config:
- 4 cities × 49 grid points = 196 coordinates
- 10 keywords × 196 coords = **1,960 API calls**

**Recommendation**: Start with 1-2 keywords and 1 city for testing.

**Paid Plans**:
- Standard: $50/month = 5,000 searches
- Business: $250/month = 30,000 searches

---

## Support

For issues or questions:
1. Check logs: `logs/error.log` and `logs/combined.log`
2. Review this guide
3. Check MongoDB and Redis are running
4. Verify `.env` configuration
