# Google Maps Lead Scraper

A scalable backend system that searches businesses from Google Maps via SerpApi, crawls websites, extracts emails, deduplicates results, and exports clean leads to CSV.

## Architecture

```
startScraper.js → BullMQ Queue (maps-search) → MapsWorker → MongoDB
                                                    ↓
                                          BullMQ Queue (website-crawl) → CrawlWorker → Email Extraction → MongoDB
                                                                                                             ↓
                                                                                                    Export CSV / API
```

## Tech Stack

- **Backend**: Node.js, Express, ES6 Modules
- **Queue**: Redis + BullMQ
- **Crawler**: Axios + Cheerio (Puppeteer optional for dynamic sites)
- **Database**: MongoDB + Mongoose
- **Export**: CSV

## Prerequisites

- Node.js >= 18
- MongoDB running locally or remote
- Redis running locally or remote
- SerpApi API key ([serpapi.com](https://serpapi.com))

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env from example
cp .env.example .env

# 3. Edit .env with your credentials
#    - SERPAPI_KEY (required)
#    - MONGODB_URI
#    - REDIS_HOST / REDIS_PORT
```

## Usage

### Step 1: Start the API server
```bash
npm start
```

### Step 2: Queue scraping jobs (CLI)
```bash
npm run scrape
```
This loads city grids, loops through keywords, and pushes jobs to the Redis queue.

### Step 3: Start workers
```bash
npm run workers
```
Workers process maps-search and website-crawl queues concurrently.

### Step 4: Export leads
```bash
# Export all leads
npm run export

# Export only leads with emails
npm run export email

# Export high-score leads (score >= 50)
npm run export highscore 50
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/stats` | Queue and database stats |
| POST | `/api/scrape` | Start scraping jobs |
| GET | `/api/leads` | List leads (paginated, filterable) |
| GET | `/api/leads/:id` | Get single lead |
| DELETE | `/api/leads/:id` | Delete a lead |
| POST | `/api/export` | Export leads to CSV |
| GET | `/api/export/download` | Download CSV file |
| POST | `/api/deduplicate` | Run full deduplication |
| GET | `/api/cities` | List configured cities |
| POST | `/api/cities` | Add a new city |
| GET | `/api/cities/:name/grid` | Get grid coordinates for a city |

### Example: Start scraping via API

```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["travel agency", "hotel", "restaurant"],
    "cities": ["Ho Chi Minh", "Ha Noi"]
  }'
```

### Example: Get leads with filters

```bash
# Get leads with email, sorted by score
curl "http://localhost:3000/api/leads?hasEmail=true&minScore=50&sortBy=leadScore&order=desc&limit=20"
```

## Configuration

Edit keywords and cities in `src/startScraper.js` or use the API.

### Default Cities
- Ho Chi Minh
- Ha Noi
- Nha Trang
- Da Lat

### Adding Custom Cities via API

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

## Project Structure

```
src/
├── config/
│   ├── db.js            # MongoDB connection
│   ├── env.js           # Environment variables
│   └── redis.js         # Redis connection config
├── models/
│   └── Business.js      # Mongoose schema
├── modules/
│   └── gridGenerator.js # City grid coordinate generator
├── queues/
│   └── queueSetup.js    # BullMQ queue definitions
├── routes/
│   └── api.js           # Express API routes
├── services/
│   ├── crawlerService.js       # Website crawler (Axios + Cheerio)
│   ├── deduplicationService.js # Duplicate detection & merging
│   ├── emailService.js         # Email cleaning, validation, scoring
│   ├── puppeteerService.js     # Dynamic site crawler (optional)
│   └── serpApiService.js       # SerpApi Google Maps search
├── utils/
│   └── logger.js        # Winston logger
├── workers/
│   ├── crawlWorker.js   # Website crawl worker
│   ├── index.js         # Start all workers
│   └── mapsWorker.js    # Maps search worker
├── export.js            # CSV export functions
├── exportCli.js         # CLI export entry point
├── server.js            # Express server entry point
└── startScraper.js      # Scraper controller script
```

## Features

- **Grid-based search**: Generates coordinate grids to cover entire cities
- **Deduplication**: By place_id, website URL, and name+address
- **Email extraction**: Regex-based from homepage + /contact, /about pages
- **Email cleaning**: Filters out free/blacklisted domains, file references, system emails
- **Lead scoring**: 0-100 score based on available data quality
- **Retry logic**: Exponential backoff, max 3 retries for API and crawl failures
- **Rate limiting**: BullMQ limiter prevents API throttling
- **CSV export**: Filtered exports (all, email-only, high-score)
- **Puppeteer fallback**: For JavaScript-heavy websites

## Error Handling

- API timeouts with exponential backoff retry
- Website fetch failures with 3 retry attempts
- Invalid HTML gracefully handled
- Duplicate results merged (not discarded — missing fields filled in)
- All errors logged to `logs/error.log`
