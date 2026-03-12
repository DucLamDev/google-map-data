# API Examples

Complete API reference with curl and JavaScript examples.

Base URL: `http://localhost:3000`

---

## Health Check

```bash
curl http://localhost:3000/api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-12T09:00:00.000Z"
}
```

---

## Get System Stats

```bash
curl http://localhost:3000/api/stats
```

**Response:**
```json
{
  "queues": {
    "mapsSearch": {
      "waiting": 450,
      "active": 10,
      "completed": 40,
      "failed": 0
    },
    "websiteCrawl": {
      "waiting": 25,
      "active": 10,
      "completed": 15,
      "failed": 2
    }
  },
  "database": {
    "totalBusinesses": 55,
    "withEmail": 18,
    "crawled": 40,
    "withoutEmail": 37,
    "pendingCrawl": 15
  }
}
```

---

## Start Scraping

### Basic Scrape

```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["travel agency", "hotel"],
    "cities": ["Ho Chi Minh", "Ha Noi"]
  }'
```

### Custom Grid Resolution

```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["restaurant"],
    "cities": ["Da Lat"],
    "gridStep": 0.03
  }'
```

**Response:**
```json
{
  "message": "Scraping jobs queued",
  "jobCount": 72,
  "keywords": 2,
  "gridPoints": 36,
  "cities": ["Ho Chi Minh", "Ha Noi"]
}
```

---

## Get Leads

### All Leads (Paginated)

```bash
curl "http://localhost:3000/api/leads?page=1&limit=20"
```

### Filter by City

```bash
curl "http://localhost:3000/api/leads?city=Ho%20Chi%20Minh&limit=50"
```

### Filter by Keyword

```bash
curl "http://localhost:3000/api/leads?keyword=travel%20agency"
```

### Only Leads with Email

```bash
curl "http://localhost:3000/api/leads?hasEmail=true"
```

### High-Score Leads

```bash
curl "http://localhost:3000/api/leads?minScore=70&sortBy=leadScore&order=desc"
```

### Combined Filters

```bash
curl "http://localhost:3000/api/leads?city=Ha%20Noi&hasEmail=true&minScore=50&sortBy=rating&order=desc&limit=10"
```

**Response:**
```json
{
  "data": [
    {
      "_id": "65f1234567890abcdef12345",
      "name": "Hanoi Travel Agency",
      "address": "123 Hoan Kiem, Ha Noi",
      "phone": "+84 24 1234 5678",
      "website": "hanoitravel.vn",
      "email": "info@hanoitravel.vn",
      "rating": 4.8,
      "reviews": 250,
      "place_id": "ChIJ...",
      "city": "Ha Noi",
      "keyword": "travel agency",
      "leadScore": 95,
      "emailValid": true,
      "crawled": true,
      "createdAt": "2026-03-12T08:30:00.000Z",
      "updatedAt": "2026-03-12T08:35:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 45,
    "pages": 5
  }
}
```

---

## Get Single Lead

```bash
curl http://localhost:3000/api/leads/65f1234567890abcdef12345
```

**Response:**
```json
{
  "_id": "65f1234567890abcdef12345",
  "name": "Hanoi Travel Agency",
  "address": "123 Hoan Kiem, Ha Noi",
  "phone": "+84 24 1234 5678",
  "website": "hanoitravel.vn",
  "email": "info@hanoitravel.vn",
  "rating": 4.8,
  "reviews": 250,
  "place_id": "ChIJ...",
  "city": "Ha Noi",
  "keyword": "travel agency",
  "leadScore": 95,
  "emailValid": true,
  "crawled": true,
  "createdAt": "2026-03-12T08:30:00.000Z",
  "updatedAt": "2026-03-12T08:35:00.000Z"
}
```

---

## Delete Lead

```bash
curl -X DELETE http://localhost:3000/api/leads/65f1234567890abcdef12345
```

**Response:**
```json
{
  "message": "Lead deleted",
  "id": "65f1234567890abcdef12345"
}
```

---

## Export to CSV

### Export All Leads

```bash
curl -X POST http://localhost:3000/api/export \
  -H "Content-Type: application/json" \
  -d '{"type": "all"}'
```

### Export Email Leads Only

```bash
curl -X POST http://localhost:3000/api/export \
  -H "Content-Type: application/json" \
  -d '{"type": "email"}'
```

### Export High-Score Leads

```bash
curl -X POST http://localhost:3000/api/export \
  -H "Content-Type: application/json" \
  -d '{"type": "highscore", "minScore": 70}'
```

**Response:**
```json
{
  "message": "Export complete",
  "filePath": "C:\\Users\\Admin\\Desktop\\google-maps-api-custom\\exports\\leads_2026-03-12T09-15-30.csv"
}
```

---

## Download CSV

### Download All Leads

```bash
curl -O -J "http://localhost:3000/api/export/download?type=all"
```

### Download Email Leads

```bash
curl -O -J "http://localhost:3000/api/export/download?type=email"
```

### Download High-Score Leads

```bash
curl -O -J "http://localhost:3000/api/export/download?type=highscore&minScore=80"
```

This will download the CSV file directly to your current directory.

---

## Run Deduplication

```bash
curl -X POST http://localhost:3000/api/deduplicate
```

**Response:**
```json
{
  "message": "Deduplication complete",
  "merged": 12,
  "removed": 8
}
```

---

## City Management

### List All Cities

```bash
curl http://localhost:3000/api/cities
```

**Response:**
```json
[
  {
    "name": "Ho Chi Minh",
    "latMin": 10.7,
    "latMax": 10.9,
    "lonMin": 106.6,
    "lonMax": 106.8
  },
  {
    "name": "Ha Noi",
    "latMin": 20.95,
    "latMax": 21.1,
    "lonMin": 105.75,
    "lonMax": 105.9
  }
]
```

### Add New City

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

**Response:**
```json
{
  "message": "City \"Da Nang\" added",
  "gridPoints": 8
}
```

### Get City Grid

```bash
curl "http://localhost:3000/api/cities/Ho%20Chi%20Minh/grid?step=0.05"
```

**Response:**
```json
{
  "coords": [
    "10.70,106.60",
    "10.70,106.65",
    "10.70,106.70",
    "10.75,106.60",
    "10.75,106.65"
  ],
  "city": "Ho Chi Minh"
}
```

---

## JavaScript/Node.js Examples

### Using Axios

```javascript
import axios from 'axios';

const API_BASE = 'http://localhost:3000/api';

// Start scraping
const startScrape = async () => {
  const response = await axios.post(`${API_BASE}/scrape`, {
    keywords: ['hotel', 'restaurant'],
    cities: ['Ho Chi Minh']
  });
  console.log(response.data);
};

// Get leads with filters
const getLeads = async () => {
  const response = await axios.get(`${API_BASE}/leads`, {
    params: {
      hasEmail: true,
      minScore: 60,
      sortBy: 'leadScore',
      order: 'desc',
      limit: 50
    }
  });
  console.log(response.data);
};

// Export and download
const exportLeads = async () => {
  const response = await axios.post(`${API_BASE}/export`, {
    type: 'email'
  });
  console.log('Exported to:', response.data.filePath);
};

// Monitor progress
const checkStats = async () => {
  const response = await axios.get(`${API_BASE}/stats`);
  console.log('Queue stats:', response.data.queues);
  console.log('Database stats:', response.data.database);
};
```

### Using Fetch (Browser)

```javascript
// Start scraping
fetch('http://localhost:3000/api/scrape', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    keywords: ['spa', 'gym'],
    cities: ['Ha Noi', 'Da Lat']
  })
})
  .then(res => res.json())
  .then(data => console.log(data));

// Get leads
fetch('http://localhost:3000/api/leads?hasEmail=true&limit=20')
  .then(res => res.json())
  .then(data => console.log(data.data));

// Download CSV
fetch('http://localhost:3000/api/export/download?type=email')
  .then(res => res.blob())
  .then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leads.csv';
    a.click();
  });
```

---

## Postman Collection

Import this JSON into Postman:

```json
{
  "info": {
    "name": "Google Maps Lead Scraper",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/health"
      }
    },
    {
      "name": "Get Stats",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/stats"
      }
    },
    {
      "name": "Start Scraping",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/scrape",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"keywords\": [\"travel agency\"],\n  \"cities\": [\"Ho Chi Minh\"]\n}"
        }
      }
    },
    {
      "name": "Get Leads",
      "request": {
        "method": "GET",
        "url": "{{base_url}}/api/leads?hasEmail=true&limit=20"
      }
    },
    {
      "name": "Export CSV",
      "request": {
        "method": "POST",
        "url": "{{base_url}}/api/export",
        "header": [{"key": "Content-Type", "value": "application/json"}],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"type\": \"email\"\n}"
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:3000"
    }
  ]
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "keywords array is required"
}
```

### 404 Not Found

```json
{
  "error": "Lead not found"
}
```

### 500 Internal Server Error

```json
{
  "error": "MongoDB connection error"
}
```

---

## Rate Limiting

The API has no built-in rate limiting, but BullMQ queues have limiters:

- **Maps Search Queue**: Max 10 jobs per second
- **Website Crawl Queue**: Max 5 jobs per second

To avoid SerpApi rate limits, adjust worker concurrency in `.env`.
