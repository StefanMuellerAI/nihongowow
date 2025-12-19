# Async SQLAlchemy Migration Evaluation

## Current State

The backend uses synchronous SQLAlchemy with psycopg2-binary:

```python
# Current implementation
@router.get("")
async def get_vocabulary(...):  # async route
    query = db.query(Vocabulary)  # synchronous - blocks event loop!
```

**Problem**: All FastAPI routes are declared as `async def` but use synchronous database operations. This blocks the event loop during DB queries, limiting concurrency.

## Recommended Migration Path

### Phase 1: Keep sync, but don't use async routes (Low effort)

Change routes that only do DB operations from `async def` to regular `def`:

```python
@router.get("")
def get_vocabulary(...):  # Not async - runs in thread pool
    query = db.query(Vocabulary)  # OK in thread pool
```

This prevents blocking the event loop because FastAPI will run sync routes in a thread pool.

### Phase 2: Full Async Migration (High effort)

Migrate to async SQLAlchemy with asyncpg:

1. **Update requirements.txt**:
   ```
   asyncpg==0.29.0
   sqlalchemy[asyncio]==2.0.25
   ```

2. **Update database.py**:
   ```python
   from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
   from sqlalchemy.orm import sessionmaker
   
   engine = create_async_engine(
       settings.database_url.replace('postgresql://', 'postgresql+asyncpg://'),
       pool_size=5,
       max_overflow=10,
   )
   
   AsyncSessionLocal = sessionmaker(
       engine, class_=AsyncSession, expire_on_commit=False
   )
   
   async def get_db():
       async with AsyncSessionLocal() as session:
           yield session
   ```

3. **Update all router queries**:
   ```python
   # Before
   vocab = db.query(Vocabulary).filter(Vocabulary.id == vocab_id).first()
   
   # After
   result = await db.execute(select(Vocabulary).where(Vocabulary.id == vocab_id))
   vocab = result.scalar_one_or_none()
   ```

### Impact Assessment

| Metric | Current | After Phase 1 | After Phase 2 |
|--------|---------|---------------|---------------|
| Concurrent requests | Limited by thread pool | Better | Best |
| Code changes | None | Minimal | Significant |
| Testing effort | None | Low | High |
| Risk | N/A | Low | Medium |

## Recommendation

**For now**: Implement Phase 1 (use `def` instead of `async def` for DB-only routes).

**Future**: Consider Phase 2 when scaling becomes necessary or during a major refactoring.

## Files Affected by Full Migration

- `backend/app/database.py`
- `backend/app/routers/auth.py`
- `backend/app/routers/vocabulary.py`
- `backend/app/routers/quiz.py`
- `backend/app/routers/kana.py`
- `backend/app/routers/scores.py`
- `backend/app/routers/admin.py`
- `backend/app/routers/settings.py`
- `backend/app/routers/user_preferences.py`
- `backend/app/main.py` (startup tasks)
