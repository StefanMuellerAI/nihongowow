import re
import random
import unicodedata
from typing import Optional, List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy.sql.expression import func

from app.database import get_db
from app.models import Vocabulary, VocabularyHintCache, VocabularyTTSCache
from app.schemas import QuizQuestion, QuizAnswer, QuizResult, HintRequest, HintResponse, TTSRequest
from app.openai_client import generate_hint, generate_tts, get_openai_client


def normalize_japanese(text: str) -> str:
    """Normalize Japanese text for comparison."""
    # Normalize Unicode (NFC form)
    normalized = unicodedata.normalize('NFC', text)
    # Remove whitespace and convert to lowercase (for any romaji)
    normalized = normalized.strip().lower()
    # Replace fullwidth characters with halfwidth equivalents
    normalized = normalized.replace('　', ' ')  # fullwidth space
    return normalized

router = APIRouter(prefix="/api/quiz", tags=["Quiz"])

# Fullwidth underscore for Japanese gap display
GAP_CHAR = "＿"


def _get_gap_count(word_length: int) -> int:
    """Determine how many gaps based on word length.
    
    Rules:
    - 3-4 characters: 1 gap
    - 5-6 characters: 2 gaps
    - 7+ characters: 3 gaps
    """
    if word_length <= 4:
        return 1
    elif word_length <= 6:
        return 2
    else:
        return 3


def _create_fill_in_blank(reading: str) -> tuple[str, List[int]]:
    """Create a fill-in-blank display text from a Japanese reading.
    
    Returns:
        tuple: (display_text with gaps, list of gap indices)
    """
    chars = list(reading)
    word_length = len(chars)
    gap_count = _get_gap_count(word_length)
    
    # Select random positions for gaps (avoiding duplicates)
    all_positions = list(range(word_length))
    gap_indices = sorted(random.sample(all_positions, gap_count))
    
    # Create display text with gaps
    display_chars = chars.copy()
    for idx in gap_indices:
        display_chars[idx] = GAP_CHAR
    
    display_text = "".join(display_chars)
    return display_text, gap_indices


@router.get("/random", response_model=QuizQuestion)
async def get_random_question(
    tags: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Get a random vocabulary question for the quiz."""
    query = db.query(Vocabulary)
    
    # Filter by tags if provided
    if tags:
        tag_list = [t.strip() for t in tags.split(",")]
        for tag in tag_list:
            query = query.filter(Vocabulary.tags.ilike(f"%{tag}%"))
    
    # Randomly choose mode: to_japanese, to_english, or fill_in_blank
    mode = random.choice(["to_japanese", "to_english", "fill_in_blank"])
    
    # For fill_in_blank mode, we need words with at least 3 characters
    if mode == "fill_in_blank":
        query = query.filter(func.length(Vocabulary.reading) >= 3)
    
    # Get random vocabulary
    vocab = query.order_by(func.random()).first()
    
    # If no vocab found for fill_in_blank, fall back to other modes
    if not vocab and mode == "fill_in_blank":
        mode = random.choice(["to_japanese", "to_english"])
        query = db.query(Vocabulary)
        if tags:
            tag_list = [t.strip() for t in tags.split(",")]
            for tag in tag_list:
                query = query.filter(Vocabulary.tags.ilike(f"%{tag}%"))
        vocab = query.order_by(func.random()).first()
    
    if not vocab:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No vocabulary found matching the criteria"
        )
    
    # Initialize fill_in_blank specific fields
    display_text = None
    gap_indices = None
    gap_count = None
    tts_text = None
    options = None
    
    if mode == "fill_in_blank":
        # Create the fill-in-blank question
        display_text, gap_indices = _create_fill_in_blank(vocab.reading)
        gap_count = len(gap_indices)
        question = vocab.meaning  # Show the meaning as the hint
        question_type = "text"
        tts_text = vocab.reading  # Full word for audio hint
    else:
        # Randomly choose question type: text or multiple_choice
        question_type = random.choice(["text", "multiple_choice"])
        
        # Set question based on mode
        if mode == "to_japanese":
            question = vocab.meaning
        else:
            question = f"{vocab.expression} ({vocab.reading})"
        
        if question_type == "multiple_choice":
            options = await _get_multiple_choice_options(vocab, mode, db)
    
    return QuizQuestion(
        vocabulary_id=vocab.id,
        question=question,
        mode=mode,
        question_type=question_type,
        options=options,
        display_text=display_text,
        gap_indices=gap_indices,
        gap_count=gap_count,
        tts_text=tts_text
    )


async def _get_multiple_choice_options(
    correct_vocab: Vocabulary, 
    mode: str, 
    db: Session
) -> List[str]:
    """Generate multiple choice options including the correct answer."""
    # Get 3 random wrong answers
    wrong_vocabs = db.query(Vocabulary).filter(
        Vocabulary.id != correct_vocab.id
    ).order_by(func.random()).limit(3).all()
    
    if mode == "to_japanese":
        correct_answer = correct_vocab.reading
        wrong_answers = [v.reading for v in wrong_vocabs]
    else:
        correct_answer = correct_vocab.meaning.split(",")[0].strip()
        wrong_answers = [v.meaning.split(",")[0].strip() for v in wrong_vocabs]
    
    # Combine and shuffle
    all_options = [correct_answer] + wrong_answers
    random.shuffle(all_options)
    
    return all_options


@router.get("/options")
async def get_wrong_options(
    exclude_id: UUID,
    mode: str = Query(..., regex="^(to_japanese|to_english)$"),
    count: int = Query(3, ge=1, le=5),
    db: Session = Depends(get_db)
) -> List[str]:
    """Get random wrong options for multiple choice."""
    wrong_vocabs = db.query(Vocabulary).filter(
        Vocabulary.id != exclude_id
    ).order_by(func.random()).limit(count).all()
    
    if mode == "to_japanese":
        return [v.reading for v in wrong_vocabs]
    else:
        return [v.meaning.split(",")[0].strip() for v in wrong_vocabs]


@router.post("/check", response_model=QuizResult)
async def check_answer(
    answer_data: QuizAnswer,
    db: Session = Depends(get_db)
):
    """Check if the user's answer is correct."""
    vocab = db.query(Vocabulary).filter(Vocabulary.id == answer_data.vocabulary_id).first()
    
    if not vocab:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vocabulary not found"
        )
    
    user_answer = normalize_japanese(answer_data.answer)
    correct = False
    
    if answer_data.mode == "fill_in_blank":
        # For fill_in_blank, the user submits only the gap characters
        # We check if the complete word matches when gaps are filled
        correct_reading = normalize_japanese(vocab.reading)
        
        # The user's answer should be the missing characters concatenated
        # We need to check if filling in these characters produces the correct reading
        # The frontend sends the full reconstructed word
        correct = user_answer == correct_reading
        
        return QuizResult(
            correct=correct,
            correct_answer=vocab.reading,
            user_answer=answer_data.answer
        )
    elif answer_data.mode == "to_japanese":
        # Exact match for Japanese reading
        correct_answer = normalize_japanese(vocab.reading)
        correct = user_answer == correct_answer
    else:
        # Check if user's answer is contained in the meaning (word boundary check)
        correct_answer = vocab.meaning
        meaning_lower = correct_answer.lower()
        
        # Split meaning by common separators and check each part
        meaning_parts = re.split(r'[,;]', meaning_lower)
        meaning_parts = [part.strip() for part in meaning_parts]
        
        # Check if user answer matches any part or is contained as a word
        for part in meaning_parts:
            if user_answer == part:
                correct = True
                break
            # Also check for word-level match within the part
            words = re.findall(r'\b\w+\b', part)
            if user_answer in words:
                correct = True
                break
        
        # Additional check: if user typed a phrase that's in the meaning
        if not correct and user_answer in meaning_lower:
            # Make sure it's a word boundary match
            pattern = r'\b' + re.escape(user_answer) + r'\b'
            if re.search(pattern, meaning_lower):
                correct = True
    
    return QuizResult(
        correct=correct,
        correct_answer=vocab.reading if answer_data.mode == "to_japanese" else vocab.meaning,
        user_answer=answer_data.answer
    )


@router.post("/hint", response_model=HintResponse)
async def get_hint(
    hint_request: HintRequest,
    db: Session = Depends(get_db)
):
    """Get an AI-generated hint for the current question."""
    # Get the vocabulary
    vocab = db.query(Vocabulary).filter(Vocabulary.id == hint_request.vocabulary_id).first()
    if not vocab:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Vocabulary not found"
        )
    
    # Check cache first
    cached_hint = db.query(VocabularyHintCache).filter(
        VocabularyHintCache.vocabulary_id == hint_request.vocabulary_id,
        VocabularyHintCache.mode == hint_request.mode
    ).first()
    
    if cached_hint:
        return HintResponse(hint=cached_hint.hint, available=True)
    
    # Check if OpenAI is configured
    if not get_openai_client():
        return HintResponse(
            hint="AI hints are not available. Please configure OPENAI_API_KEY.",
            available=False
        )
    
    # Generate hint via OpenAI
    hint = await generate_hint(
        expression=vocab.expression,
        reading=vocab.reading,
        meaning=vocab.meaning,
        mode=hint_request.mode
    )
    
    # Save to cache (only if generation was successful)
    if not hint.startswith("Could not generate hint"):
        cache_entry = VocabularyHintCache(
            vocabulary_id=hint_request.vocabulary_id,
            mode=hint_request.mode,
            hint=hint
        )
        db.add(cache_entry)
        db.commit()
    
    return HintResponse(hint=hint, available=True)


@router.post("/tts")
async def get_text_to_speech(
    tts_request: TTSRequest,
    db: Session = Depends(get_db)
):
    """Generate Japanese text-to-speech audio."""
    # Check cache first
    cached_tts = db.query(VocabularyTTSCache).filter(
        VocabularyTTSCache.text == tts_request.text
    ).first()
    
    if cached_tts:
        return Response(
            content=cached_tts.audio_data,
            media_type="audio/mpeg",
            headers={"Content-Disposition": "inline; filename=tts.mp3"}
        )
    
    # Check if OpenAI is configured
    if not get_openai_client():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="TTS is not available. Please configure OPENAI_API_KEY."
        )
    
    # Generate audio via OpenAI
    audio_bytes = await generate_tts(tts_request.text)
    
    if not audio_bytes:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate audio"
        )
    
    # Save to cache
    cache_entry = VocabularyTTSCache(
        text=tts_request.text,
        audio_data=audio_bytes
    )
    db.add(cache_entry)
    db.commit()
    
    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={"Content-Disposition": "inline; filename=tts.mp3"}
    )

