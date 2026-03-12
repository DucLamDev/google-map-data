# Quick Start Guide

Get your lead scraper running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Setup Environment

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` and add your SerpApi key:
```
SERPAPI_KEY=your_api_key_here
```

Get your free API key at: https://serpapi.com (100 searches/month free)

## Step 3: Start Services

Make sure MongoDB and Redis are running on your system.

**Windows:**
```powershell
# MongoDB (if installed as service, it's already running)
# Redis - download from https://github.com/microsoftarchive/redis/releases

# Start Redis
redis-server
```

**Mac/Linux:**
```bash
# MongoDB
brew services start mongodb-community
# or
sudo systemctl start mongod

# Redis
brew services start redis
# or
sudo systemctl start redis
```

## Step 4: Start the System

Open **3 terminals**:

**Terminal 1 - API Server:**
```bash
npm start
```

**Terminal 2 - Workers:**
```bash
npm run workers
```

**Terminal 3 - Start Scraping:**
```bash
npm run scrape
```

## Step 5: Monitor Progress

Visit: http://localhost:3000/api/stats

Or use curl:
```bash
curl http://localhost:3000/api/stats
```

## Step 6: Export Results

Wait for scraping to complete (check stats), then:

```bash
# Export all leads
npm run export

# Export only leads with emails
npm run export email

# Export high-score leads
npm run export highscore 70
```

Files saved to `exports/` folder.

---

## What's Happening?

1. **Scraper** generates 49 grid coordinates across 4 Vietnamese cities
2. **Scraper** queues 490 jobs (10 keywords × 49 coordinates) to Redis
3. **Maps Worker** (10 concurrent) calls SerpApi to search Google Maps
4. **Maps Worker** saves businesses to MongoDB
5. **Maps Worker** queues website crawl jobs for businesses with websites
6. **Crawl Worker** (10 concurrent) visits websites and extracts emails
7. **Crawl Worker** updates MongoDB with emails and lead scores
8. **Export** generates CSV with all collected data

---

## Customize Your Scrape

Edit `src/startScraper.js`:

```javascript
// Change cities
const CITIES = ['Ho Chi Minh', 'Ha Noi']; // Add/remove cities

// Change keywords
const KEYWORDS = [
  'travel agency',
  'hotel',
  // Add your keywords here
];
```

Then run:
```bash
npm run scrape
```

---

## Troubleshooting

### "MongoDB connection error"
→ Start MongoDB: `mongod` or check if service is running

### "Redis connection refused"
→ Start Redis: `redis-server`

### "Invalid API key"
→ Check `.env` file has correct `SERPAPI_KEY`

### Workers not processing
→ Make sure you ran `npm run workers`

---

## Next Steps

- Read `SETUP.md` for detailed configuration
- Read `API_EXAMPLES.md` for API usage
- Customize cities and keywords in `src/startScraper.js`
- Adjust worker concurrency in `.env`

---

## Useful Commands

```bash
# Test grid generator
npm run test:grid

# Test email service
npm run test:email

# Clear all queued jobs
npm run clear:queue

# Clear database (⚠️ deletes all data)
npm run clear:db

# Check system stats
curl http://localhost:3000/api/stats

# Get leads with emails
curl "http://localhost:3000/api/leads?hasEmail=true&limit=20"
```

---

## Production Deployment

Use PM2 for process management:

```bash
npm install -g pm2

pm2 start src/server.js --name "scraper-api"
pm2 start src/workers/index.js --name "scraper-workers"

pm2 save
pm2 startup
```

Monitor:
```bash
pm2 monit
pm2 logs
```

---

## Support

For detailed documentation:
- `README.md` - System overview
- `SETUP.md` - Complete setup guide
- `API_EXAMPLES.md` - API reference

Check logs:
- `logs/error.log` - Errors only
- `logs/combined.log` - All logs
