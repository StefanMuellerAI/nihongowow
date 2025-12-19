from openai import AsyncOpenAI
from typing import Optional
import io
import logging

from app.config import get_settings

settings = get_settings()
logger = logging.getLogger(__name__)

# Singleton async client instance
_async_client: Optional[AsyncOpenAI] = None


def get_openai_client() -> Optional[AsyncOpenAI]:
    """Get async OpenAI client if API key is configured.
    
    Returns a singleton instance to reuse connections.
    """
    global _async_client
    
    if not settings.openai_api_key:
        return None
    
    if _async_client is None:
        _async_client = AsyncOpenAI(
            api_key=settings.openai_api_key,
            timeout=30.0,  # 30 second timeout
            max_retries=2,  # Retry failed requests up to 2 times
        )
    
    return _async_client


async def generate_hint(expression: str, reading: str, meaning: str, mode: str) -> str:
    """Generate a learning hint for a vocabulary word using ChatGPT.
    
    Uses async OpenAI client to avoid blocking the event loop.
    """
    client = get_openai_client()
    if not client:
        return "AI hints are not available. Please configure OPENAI_API_KEY."
    
    if mode == "to_japanese":
        # User needs to translate English to Japanese - give hints about how to WRITE it
        prompt = f"""You are a helpful Japanese language learning assistant. 
The student needs to type "{meaning}" in Japanese hiragana.
The correct answer is: {reading} (kanji: {expression})

Give a SHORT hint (max 2 sentences) to help them TYPE the word correctly in hiragana.
Focus on HOW TO WRITE/SPELL it, not just the meaning. You can:
- Tell them the first 1-2 syllables (e.g. "It starts with 'た'..." or "Begins with 'ta'...")
- Tell them how many syllables/characters it has
- Give a phonetic clue (e.g. "Sounds like..." or "Rhymes with...")
- Mention if it contains common patterns like っ (small tsu) or ん

Do NOT reveal the full answer. Respond in English only."""
    else:
        # User needs to translate Japanese to English
        prompt = f"""You are a helpful Japanese language learning assistant.
The student sees the Japanese word: {expression} ({reading})
They need to translate it to English. The correct meaning is: {meaning}

Give a SHORT, helpful hint (max 2 sentences) to help them remember or guess the English meaning.
Do NOT reveal the exact answer. You can:
- Describe a situation where this word is used
- Give a related word or category
- Mention what type of word it is (verb, noun, adjective)
- Give a contextual clue

Respond in English only."""

    try:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a concise Japanese language tutor. Keep hints short and helpful."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=100,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Hint generation failed: {e}")
        return f"Could not generate hint: {str(e)}"


async def generate_tts(text: str) -> Optional[bytes]:
    """Generate Japanese speech audio using OpenAI TTS.
    
    Uses async OpenAI client to avoid blocking the event loop.
    Prefixes short Japanese words with an English intro to prevent
    audio clipping at the start of the recording.
    """
    client = get_openai_client()
    if not client:
        return None
    
    # Prefix with English intro to prevent audio clipping on short words
    tts_input = f"It sounds like: {text}"
    
    try:
        response = await client.audio.speech.create(
            model="tts-1",
            voice="nova",  # Good for Japanese pronunciation
            input=tts_input,
            response_format="mp3"
        )
        
        # Read the audio content asynchronously
        audio_bytes = io.BytesIO()
        async for chunk in response.iter_bytes():
            audio_bytes.write(chunk)
        audio_bytes.seek(0)
        return audio_bytes.getvalue()
    except Exception as e:
        logger.error(f"TTS generation failed: {e}")
        return None
