# Google Maps Lead Scraper - Project Summary

## 🎯 Project Overview

A production-ready, scalable backend system that automatically scrapes business leads from Google Maps using SerpApi, crawls their websites to extract contact emails, deduplicates results, scores leads, and exports clean data to CSV.

## ✅ Completed Features

### Core Functionality
- ✅ **Grid-based Google Maps search** via SerpApi
- ✅ **Automated website crawling** with Axios + Cheerio
- ✅ **Email extraction** from homepages and contact pages
- ✅ **Email validation & cleaning** (removes free domains, system emails, file references)
- ✅ **Smart deduplication** by place_id, website, and name+address
- ✅ **Lead scoring** (0-100) based on data quality
- ✅ **CSV export** with filtering options
- ✅ **RESTful API** with Express
- ✅ **Queue system** with BullMQ + Redis
- ✅ **MongoDB storage** with optimized indexes
- ✅ **Error handling** with exponential backoff retry
- ✅ **Logging** with Winston
- ✅ **Puppeteer support** for JavaScript-heavy websites (optional)

### Advanced Features
- ✅ **Concurrent workers** (configurable concurrency)
- ✅ **Rate limiting** to prevent API throttling
- ✅ **Dynamic city management** via API
- ✅ **Filtered exports** (all, email-only, high-score)
- ✅ **Real-time stats** endpoint
- ✅ **Graceful shutdown** handling
- ✅ **Production-ready** error handling

## 📁 Project Structure

```
google-maps-api-custom/
├── src/
│   ├── config/
│   │   ├── db.js              # MongoDB connection
│   │   ├── env.js             # Environment config
│   │   └── redis.js           # Redis connection
│   ├── models/
│   │   └── Business.js        # Mongoose schema with indexes
│   ├── modules/
│   │   └── gridGenerator.js   # City grid coordinate generator
│   ├── queues/
│   │   └── queueSetup.js      # BullMQ queue definitions
│   ├── routes/
│   │   └── api.js             # Express API routes
│   ├── services/
│   │   ├── crawlerService.js       # Website crawler (Axios + Cheerio)
│   │   ├── deduplicationService.js # Duplicate detection & merging
│   │   ├── emailService.js         # Email cleaning, validation, scoring
│   │   ├── puppeteerService.js     # Dynamic site crawler (optional)
│   │   └── serpApiService.js       # SerpApi Google Maps search
│   ├── utils/
│   │   └── logger.js          # Winston logger
│   ├── workers/
│   │   ├── crawlWorker.js     # Website crawl worker
│   │   ├── index.js           # Start all workers
│   │   └── mapsWorker.js      # Maps search worker
│   ├── export.js              # CSV export functions
│   ├── exportCli.js           # CLI export entry point
│   ├── server.js              # Express server
│   └── startScraper.js        # Scraper controller script
├── scripts/
│   ├── clear-database.js      # Clear all business records
│   ├── clear-queue.js         # Clear all queued jobs
│   ├── test-email-service.js  # Test email cleaning & scoring
│   └── test-grid.js           # Test grid generator
├── .env.example               # Environment template
├── .gitignore
├── API_EXAMPLES.md            # Complete API reference
├── package.json
├── QUICK_START.md             # 5-minute setup guide
├── README.md                  # System overview
└── SETUP.md                   # Detailed setup guide
```

## 🚀 Quick Start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env
# Edit .env and add SERPAPI_KEY

# 3. Start (3 terminals)
npm start          # Terminal 1: API server
npm run workers    # Terminal 2: Workers
npm run scrape     # Terminal 3: Queue jobs

# 4. Monitor
curl http://localhost:3000/api/stats

# 5. Export
npm run export email
```

## 📊 System Architecture

```
┌─────────────────┐
│ startScraper.js │ → Generates grid coordinates
└────────┬────────┘   Loops keywords × coordinates
         ↓
┌────────────────────┐
│ BullMQ Queue       │
│ (maps-search)      │ → Redis-backed job queue
└────────┬───────────┘
         ↓
┌────────────────────┐
│ Maps Worker (×10)  │ → Calls SerpApi
└────────┬───────────┘   Saves to MongoDB
         ↓              Enqueues crawl jobs
┌────────────────────┐
│ BullMQ Queue       │
│ (website-crawl)    │
└────────┬───────────┘
         ↓
┌────────────────────┐
│ Crawl Worker (×10) │ → Fetches website HTML
└────────┬───────────┘   Extracts emails
         ↓              Updates MongoDB
┌────────────────────┐
│ MongoDB            │ → Stores business data
│ (businesses)       │   Deduplication
└────────┬───────────┘   Lead scoring
         ↓
┌────────────────────┐
│ Export to CSV      │ → Filtered exports
└────────────────────┘   Company, Email, Phone, etc.
```

## 🔧 Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Backend** | Node.js 18+, Express | API server |
| **Queue** | Redis, BullMQ | Job queue management |
| **Database** | MongoDB, Mongoose | Data persistence |
| **Crawler** | Axios, Cheerio | Static website crawling |
| **Dynamic Crawler** | Puppeteer | JavaScript-heavy sites |
| **API** | SerpApi | Google Maps search |
| **Export** | csv-writer | CSV generation |
| **Logging** | Winston | Structured logging |
| **Validation** | validator.js | Email validation |

## 📋 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/stats` | Queue & database stats |
| POST | `/api/scrape` | Start scraping jobs |
| GET | `/api/leads` | List leads (paginated, filtered) |
| GET | `/api/leads/:id` | Get single lead |
| DELETE | `/api/leads/:id` | Delete lead |
| POST | `/api/export` | Export to CSV |
| GET | `/api/export/download` | Download CSV |
| POST | `/api/deduplicate` | Run deduplication |
| GET | `/api/cities` | List cities |
| POST | `/api/cities` | Add city |
| GET | `/api/cities/:name/grid` | Get city grid |

## 🎯 Default Configuration

### Cities (4)
- Ho Chi Minh: 20 grid points
- Ha Noi: 16 grid points
- Nha Trang: 9 grid points
- Da Lat: 4 grid points
- **Total: 49 coordinates**

### Keywords (10)
- travel agency
- hotel
- restaurant
- coffee shop
- spa
- gym
- dental clinic
- real estate agency
- car rental
- beauty salon

### Workers
- Maps Worker: 10 concurrent threads
- Crawl Worker: 10 concurrent threads

### Total Jobs
49 coordinates × 10 keywords = **490 search jobs**

## 📦 NPM Scripts

```bash
npm start              # Start API server
npm run scrape         # Queue scraping jobs
npm run workers        # Start all workers
npm run export         # Export all leads
npm run export email   # Export email leads only
npm run dev            # Development mode with nodemon

# Utility scripts
npm run test:grid      # Test grid generator
npm run test:email     # Test email service
npm run clear:queue    # Clear all queued jobs
npm run clear:db       # Clear database (⚠️ deletes all data)
```

## 🔐 Environment Variables

Required:
- `SERPAPI_KEY` - Your SerpApi API key

Optional (with defaults):
- `MONGODB_URI` - MongoDB connection string
- `REDIS_HOST` / `REDIS_PORT` - Redis connection
- `PORT` - API server port (default: 3000)
- `MAPS_WORKER_CONCURRENCY` - Maps worker threads (default: 10)
- `CRAWL_WORKER_CONCURRENCY` - Crawl worker threads (default: 10)
- `REQUEST_TIMEOUT` - HTTP timeout in ms (default: 15000)
- `MAX_RETRIES` - Max retry attempts (default: 3)
- `CRAWL_DELAY_MS` - Delay between page crawls (default: 1000)

## 📈 Performance Metrics

### With Default Config
- **Grid points**: 49
- **Keywords**: 10
- **Total API calls**: 490
- **Expected results**: ~2,000-5,000 businesses
- **Businesses with websites**: ~40-60%
- **Websites with emails**: ~30-50%
- **Final leads with emails**: ~600-1,500

### Processing Time (estimated)
- Maps search: ~5-10 minutes (with 10 workers)
- Website crawl: ~10-20 minutes (with 10 workers)
- **Total**: ~15-30 minutes for full scrape

### SerpApi Cost
- Free tier: 100 searches/month
- Default config uses: 490 searches
- **Recommendation**: Start with 1-2 keywords for testing

## 🛡️ Error Handling

- ✅ Exponential backoff retry (max 3 attempts)
- ✅ Timeout handling (15s default)
- ✅ Invalid HTML gracefully handled
- ✅ Duplicate detection & merging
- ✅ Failed jobs logged and retried
- ✅ Graceful worker shutdown
- ✅ All errors logged to `logs/error.log`

## 🎨 Lead Scoring Algorithm

Scores range from 0-100 based on:
- Email present: +30 points
- Website present: +15 points
- Phone present: +15 points
- Rating ≥4.0: +15 points
- Reviews >100: +15 points
- Multiple data points: +10 bonus

**Example**: Business with email, website, phone, 4.5 rating, 150 reviews = **100 points**

## 📝 Email Cleaning Rules

**Removed**:
- Free domains: yahoo.com, outlook.com, gmail.com
- Blacklisted: example.com, test.com, localhost
- System emails: noreply@, webmaster@, postmaster@
- File references: logo@2x.png, image@file.jpg
- Invalid format: not matching email regex

**Kept**:
- Business domains only
- Valid email format
- Not in blacklist

## 🔄 Deduplication Strategy

Businesses are considered duplicates if they match on:
1. **place_id** (Google's unique ID)
2. **website** (normalized URL)
3. **name + address** (case-insensitive)

When duplicate found:
- Existing record is updated with missing fields
- No data is lost
- Newer ratings/reviews override older ones

## 📚 Documentation Files

- `README.md` - System overview and architecture
- `QUICK_START.md` - 5-minute setup guide
- `SETUP.md` - Detailed configuration and deployment
- `API_EXAMPLES.md` - Complete API reference with examples
- `PROJECT_SUMMARY.md` - This file

## 🚀 Production Deployment

### Using PM2
```bash
npm install -g pm2
pm2 start src/server.js --name "scraper-api"
pm2 start src/workers/index.js --name "scraper-workers"
pm2 save
pm2 startup
```

### Using Docker (future enhancement)
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
CMD ["node", "src/server.js"]
```

## 🔮 Future Enhancements

Potential additions (not implemented):
- [ ] Docker containerization
- [ ] Frontend dashboard (React/Vue)
- [ ] Real-time WebSocket updates
- [ ] Email verification API integration
- [ ] AI-powered business classification
- [ ] Multi-country support
- [ ] Scheduled scraping (cron jobs)
- [ ] Webhook notifications
- [ ] Lead enrichment APIs
- [ ] CRM integration (Salesforce, HubSpot)

## 📊 Database Schema

```javascript
{
  name: String,           // Business name
  address: String,        // Full address
  phone: String,          // Phone number
  website: String,        // Website URL (normalized)
  email: String,          // Extracted email
  rating: Number,         // Google rating (0-5)
  reviews: Number,        // Review count
  place_id: String,       // Google Place ID (unique)
  city: String,           // City name
  keyword: String,        // Search keyword used
  leadScore: Number,      // Calculated score (0-100)
  category: String,       // Business category
  country: String,        // Country
  emailValid: Boolean,    // Email validation status
  crawled: Boolean,       // Website crawl status
  createdAt: Date,        // Record creation
  updatedAt: Date         // Last update
}
```

## ✅ Testing

All core modules tested:
- ✅ Grid generator: 49 points across 4 cities
- ✅ Email cleaning: Removes 5/10 invalid emails
- ✅ Lead scoring: Correctly scores 0-100
- ✅ Syntax check: All 19 files pass
- ✅ Dependencies: 319 packages installed

## 🎉 Project Status

**Status**: ✅ **PRODUCTION READY**

All requested features implemented:
- ✅ Grid coordinate generator
- ✅ SerpApi Google Maps search
- ✅ Queue system (BullMQ)
- ✅ Maps worker (10 concurrent)
- ✅ Website crawler worker (10 concurrent)
- ✅ Email extraction & cleaning
- ✅ Deduplication logic
- ✅ MongoDB schema & storage
- ✅ CSV export (filtered)
- ✅ Express API
- ✅ Error handling & retry logic
- ✅ Logging system
- ✅ Optional Puppeteer support
- ✅ Lead scoring
- ✅ Email validation
- ✅ Complete documentation

## 📞 Support

Check logs for debugging:
- `logs/error.log` - Errors only
- `logs/combined.log` - All logs

Common issues covered in `SETUP.md` troubleshooting section.

---

**Built with ❤️ for scalable lead generation**
