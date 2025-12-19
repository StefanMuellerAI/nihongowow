# Load Testing for NihongoWOW API

This directory contains load testing scripts using [k6](https://k6.io/).

## Installation

### macOS
```bash
brew install k6
```

### Linux (Debian/Ubuntu)
```bash
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

### Docker
```bash
docker pull grafana/k6
```

## Available Tests

### Main Load Test (`k6-load-test.js`)

Full load test with gradual ramp-up covering all main API endpoints.

```bash
# Run with default settings
k6 run backend/tests/load/k6-load-test.js

# Run with custom API URL
k6 run -e API_URL=http://localhost:8000 backend/tests/load/k6-load-test.js

# Run with custom virtual users and duration
k6 run --vus 100 --duration 5m backend/tests/load/k6-load-test.js
```

### Smoke Test (`k6-smoke-test.js`)

Quick test to verify the API is responsive.

```bash
k6 run backend/tests/load/k6-smoke-test.js
```

## Test Scenarios

### Default Load Test Stages

1. **Ramp-up** (30s): 0 → 10 users
2. **Increase** (1m): 10 → 20 users
3. **Steady state** (2m): 20 users
4. **Spike** (30s): 20 → 50 users
5. **High load** (1m): 50 users
6. **Ramp-down** (30s): 50 → 0 users

### Thresholds

- 95th percentile response time < 500ms
- Error rate < 1%
- Vocabulary API p95 < 300ms
- Kana API p95 < 100ms (cached data)
- Tags API p95 < 200ms

## Tested Endpoints

| Endpoint | Description | Expected Performance |
|----------|-------------|---------------------|
| GET /health | Health check | < 50ms |
| GET /api/kana | All kana (cached) | < 100ms |
| GET /api/vocabulary/tags | All tags (cached) | < 200ms |
| GET /api/vocabulary | Paginated list | < 300ms |
| GET /api/vocabulary/random | Random items | < 300ms |
| GET /api/quiz/random | Quiz question | < 300ms |
| GET /api/kana/random | Random kana | < 100ms |
| GET /api/settings | App settings | < 100ms |

## Output

k6 provides detailed metrics including:

- **http_req_duration**: Response time statistics
- **http_req_failed**: Failure rate
- **http_reqs**: Requests per second
- **vus**: Virtual users over time

## Interpreting Results

### Good Results
- p95 response time < 500ms
- Error rate < 1%
- Requests per second > 100

### Warning Signs
- p95 response time > 1s
- Error rate > 5%
- High response time variance

### Action Items if Performance Degrades
1. Check database query performance with `EXPLAIN ANALYZE`
2. Review connection pool settings
3. Check for N+1 query problems
4. Consider adding Redis caching for frequently accessed data

## Integration with CI/CD

Add to your CI pipeline:

```yaml
load-test:
  stage: test
  image: grafana/k6
  script:
    - k6 run --out json=results.json backend/tests/load/k6-smoke-test.js
  artifacts:
    paths:
      - results.json
```
