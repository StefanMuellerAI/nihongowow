import csv
import io
from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Query, Response
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Vocabulary, User
from app.schemas import (
    VocabularyCreate, 
    VocabularyUpdate, 
    VocabularyResponse, 
    VocabularyListResponse,
    CSVImportResult
)
from app.auth import get_current_user, require_admin

router = APIRouter(prefix="/api/vocabulary", tags=["Vocabulary"])

# Cache duration for tags endpoint (5 minutes) - can change with vocabulary updates
TAGS_CACHE_MAX_AGE = 300

# Security limits for CSV import
MAX_CSV_FILE_SIZE = 5 * 1024 * 1024  # 5 MB
MAX_CSV_ROWS = 10000


def escape_like_pattern(value: str) -> str:
    """Escape special characters in LIKE patterns to prevent SQL injection."""
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


@router.get("", response_model=VocabularyListResponse)
async def get_vocabulary(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    tags: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get paginated vocabulary list with optional filtering."""
    query = db.query(Vocabulary)
    
    # Search filter with escaped pattern to prevent SQL injection
    if search:
        escaped_search = escape_like_pattern(search)
        search_pattern = f"%{escaped_search}%"
        query = query.filter(
            (Vocabulary.expression.ilike(search_pattern)) |
            (Vocabulary.reading.ilike(search_pattern)) |
            (Vocabulary.meaning.ilike(search_pattern))
        )
    
    # Tag filter with escaped pattern
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        for tag in tag_list:
            escaped_tag = escape_like_pattern(tag)
            query = query.filter(Vocabulary.tags.ilike(f"%{escaped_tag}%"))
    
    # Get total count
    total = query.count()
    
    # Pagination
    offset = (page - 1) * page_size
    items = query.order_by(Vocabulary.created_at.desc()).offset(offset).limit(page_size).all()
    
    total_pages = (total + page_size - 1) // page_size
    
    return VocabularyListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages
    )


@router.get("/tags", response_model=List[str])
async def get_all_tags(response: Response, db: Session = Depends(get_db)):
    """Get all unique tags from vocabulary.
    
    Cached for 5 minutes as tags change infrequently.
    """
    # Set cache headers - cache for 5 minutes
    response.headers["Cache-Control"] = f"public, max-age={TAGS_CACHE_MAX_AGE}"
    
    all_tags = db.query(Vocabulary.tags).filter(Vocabulary.tags.isnot(None)).all()
    
    # Extract and deduplicate tags
    tag_set = set()
    for (tags_str,) in all_tags:
        if tags_str:
            for tag in tags_str.split():
                tag = tag.strip()
                if tag:
                    tag_set.add(tag)
    
    return sorted(list(tag_set))


@router.get("/random", response_model=List[VocabularyResponse])
async def get_random_vocabulary(
    count: int = Query(10, ge=1, le=50),
    tags: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get random vocabulary items for games, optionally filtered by tags."""
    query = db.query(Vocabulary)
    
    # Tag filter with escaped pattern
    if tags:
        tag_list = [t.strip() for t in tags.split(",") if t.strip()]
        for tag in tag_list:
            escaped_tag = escape_like_pattern(tag)
            query = query.filter(Vocabulary.tags.ilike(f"%{escaped_tag}%"))
    
    total = query.count()
    if total == 0:
        return []
    
    items = query.order_by(func.random()).limit(count).all()
    return items


@router.get("/{vocab_id}", response_model=VocabularyResponse)
async def get_vocabulary_by_id(vocab_id: UUID, db: Session = Depends(get_db)):
    """Get a specific vocabulary entry by ID."""
    vocab = db.query(Vocabulary).filter(Vocabulary.id == vocab_id).first()
    if not vocab:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vocabulary not found"
        )
    return vocab


@router.post("", response_model=VocabularyResponse, status_code=status.HTTP_201_CREATED)
async def create_vocabulary(
    vocab_data: VocabularyCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new vocabulary entry (requires admin privileges)."""
    new_vocab = Vocabulary(
        expression=vocab_data.expression,
        reading=vocab_data.reading,
        meaning=vocab_data.meaning,
        tags=vocab_data.tags or ""
    )
    
    db.add(new_vocab)
    db.commit()
    db.refresh(new_vocab)
    
    return new_vocab


@router.put("/{vocab_id}", response_model=VocabularyResponse)
async def update_vocabulary(
    vocab_id: UUID,
    vocab_data: VocabularyUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update a vocabulary entry (requires admin privileges)."""
    vocab = db.query(Vocabulary).filter(Vocabulary.id == vocab_id).first()
    if not vocab:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vocabulary not found"
        )
    
    update_data = vocab_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(vocab, field, value)
    
    db.commit()
    db.refresh(vocab)
    
    return vocab


@router.delete("/{vocab_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_vocabulary(
    vocab_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a vocabulary entry (requires admin privileges)."""
    vocab = db.query(Vocabulary).filter(Vocabulary.id == vocab_id).first()
    if not vocab:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vocabulary not found"
        )
    
    db.delete(vocab)
    db.commit()


@router.post("/import", response_model=CSVImportResult)
async def import_csv(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Import vocabulary from CSV file (requires admin privileges)."""
    if not file.filename or not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be a CSV"
        )
    
    # Check file size before reading
    content = await file.read()
    if len(content) > MAX_CSV_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large. Maximum size is {MAX_CSV_FILE_SIZE // (1024 * 1024)} MB"
        )
    
    try:
        decoded = content.decode('utf-8')
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be UTF-8 encoded"
        )
    
    imported = 0
    skipped = 0
    errors = []
    
    reader = csv.DictReader(io.StringIO(decoded))
    
    for row_num, row in enumerate(reader, start=2):
        # Enforce row limit
        if row_num > MAX_CSV_ROWS + 1:
            errors.append(f"Row limit exceeded. Maximum {MAX_CSV_ROWS} rows allowed.")
            break
            
        try:
            expression = row.get('expression', '').strip()
            reading = row.get('reading', '').strip()
            meaning = row.get('meaning', '').strip()
            tags = row.get('tags', '').strip()
            
            if not expression or not reading or not meaning:
                errors.append(f"Row {row_num}: Missing required fields (expression, reading, or meaning)")
                skipped += 1
                continue
            
            # Check for duplicate
            existing = db.query(Vocabulary).filter(
                Vocabulary.expression == expression,
                Vocabulary.reading == reading
            ).first()
            
            if existing:
                skipped += 1
                continue
            
            new_vocab = Vocabulary(
                expression=expression,
                reading=reading,
                meaning=meaning,
                tags=tags
            )
            db.add(new_vocab)
            imported += 1
            
        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")
            skipped += 1
    
    db.commit()
    
    return CSVImportResult(imported=imported, skipped=skipped, errors=errors[:10])

