# NihongoWOW - Japanese Vocabulary Trainer

A modern Japanese vocabulary learning application with quiz functionality.

## Tech Stack

- **Frontend**: Next.js 14 with Tailwind CSS
- **Backend**: FastAPI with SQLAlchemy
- **Database**: PostgreSQL 15
- **Deployment**: Docker Compose

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- Node.js 20+ (for local development)
- Python 3.11+ (for local development)

### Running with Docker

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Features

### User Dashboard
- Quiz mode with random vocabulary
- Japanese input with automatic Romaji → Hiragana conversion
- Multiple choice and text input modes
- Tag-based filtering for focused learning

### Admin Dashboard
- Secure login with JWT authentication
- Full CRUD operations for vocabulary
- CSV import functionality
- Tag management

## Environment Variables

### Backend
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret key for JWT token signing
- `CORS_ORIGINS`: Allowed CORS origins

### Frontend
- `NEXT_PUBLIC_API_URL`: Backend API URL

## Development

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## CSV Import Format

```csv
expression,reading,meaning,tags,guid
会う,あう,"to meet, to see",JLPT_N5 Genki_Ln.3,unique-guid
```

## License

MIT

