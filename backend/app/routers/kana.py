from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.orm import Session
from typing import Optional
import random

from app.database import get_db
from app.models import Setting
from app.schemas import KanaListResponse, KanaItem

router = APIRouter(prefix="/api/kana", tags=["Kana"])

# Cache duration constants
STATIC_CACHE_MAX_AGE = 86400  # 24 hours for static kana data

# Complete Hiragana list
HIRAGANA = [
    # Vowels
    {"romaji": "a", "kana": "あ"},
    {"romaji": "i", "kana": "い"},
    {"romaji": "u", "kana": "う"},
    {"romaji": "e", "kana": "え"},
    {"romaji": "o", "kana": "お"},
    # K-row
    {"romaji": "ka", "kana": "か"},
    {"romaji": "ki", "kana": "き"},
    {"romaji": "ku", "kana": "く"},
    {"romaji": "ke", "kana": "け"},
    {"romaji": "ko", "kana": "こ"},
    # S-row
    {"romaji": "sa", "kana": "さ"},
    {"romaji": "shi", "kana": "し"},
    {"romaji": "su", "kana": "す"},
    {"romaji": "se", "kana": "せ"},
    {"romaji": "so", "kana": "そ"},
    # T-row
    {"romaji": "ta", "kana": "た"},
    {"romaji": "chi", "kana": "ち"},
    {"romaji": "tsu", "kana": "つ"},
    {"romaji": "te", "kana": "て"},
    {"romaji": "to", "kana": "と"},
    # N-row
    {"romaji": "na", "kana": "な"},
    {"romaji": "ni", "kana": "に"},
    {"romaji": "nu", "kana": "ぬ"},
    {"romaji": "ne", "kana": "ね"},
    {"romaji": "no", "kana": "の"},
    # H-row
    {"romaji": "ha", "kana": "は"},
    {"romaji": "hi", "kana": "ひ"},
    {"romaji": "fu", "kana": "ふ"},
    {"romaji": "he", "kana": "へ"},
    {"romaji": "ho", "kana": "ほ"},
    # M-row
    {"romaji": "ma", "kana": "ま"},
    {"romaji": "mi", "kana": "み"},
    {"romaji": "mu", "kana": "む"},
    {"romaji": "me", "kana": "め"},
    {"romaji": "mo", "kana": "も"},
    # Y-row
    {"romaji": "ya", "kana": "や"},
    {"romaji": "yu", "kana": "ゆ"},
    {"romaji": "yo", "kana": "よ"},
    # R-row
    {"romaji": "ra", "kana": "ら"},
    {"romaji": "ri", "kana": "り"},
    {"romaji": "ru", "kana": "る"},
    {"romaji": "re", "kana": "れ"},
    {"romaji": "ro", "kana": "ろ"},
    # W-row + N
    {"romaji": "wa", "kana": "わ"},
    {"romaji": "wo", "kana": "を"},
    {"romaji": "n", "kana": "ん"},
    # Dakuten (G, Z, D, B)
    {"romaji": "ga", "kana": "が"},
    {"romaji": "gi", "kana": "ぎ"},
    {"romaji": "gu", "kana": "ぐ"},
    {"romaji": "ge", "kana": "げ"},
    {"romaji": "go", "kana": "ご"},
    {"romaji": "za", "kana": "ざ"},
    {"romaji": "ji", "kana": "じ"},
    {"romaji": "zu", "kana": "ず"},
    {"romaji": "ze", "kana": "ぜ"},
    {"romaji": "zo", "kana": "ぞ"},
    {"romaji": "da", "kana": "だ"},
    {"romaji": "di", "kana": "ぢ"},
    {"romaji": "du", "kana": "づ"},
    {"romaji": "de", "kana": "で"},
    {"romaji": "do", "kana": "ど"},
    {"romaji": "ba", "kana": "ば"},
    {"romaji": "bi", "kana": "び"},
    {"romaji": "bu", "kana": "ぶ"},
    {"romaji": "be", "kana": "べ"},
    {"romaji": "bo", "kana": "ぼ"},
    # Handakuten (P)
    {"romaji": "pa", "kana": "ぱ"},
    {"romaji": "pi", "kana": "ぴ"},
    {"romaji": "pu", "kana": "ぷ"},
    {"romaji": "pe", "kana": "ぺ"},
    {"romaji": "po", "kana": "ぽ"},
    # Combinations (Yōon)
    {"romaji": "kya", "kana": "きゃ"},
    {"romaji": "kyu", "kana": "きゅ"},
    {"romaji": "kyo", "kana": "きょ"},
    {"romaji": "sha", "kana": "しゃ"},
    {"romaji": "shu", "kana": "しゅ"},
    {"romaji": "sho", "kana": "しょ"},
    {"romaji": "cha", "kana": "ちゃ"},
    {"romaji": "chu", "kana": "ちゅ"},
    {"romaji": "cho", "kana": "ちょ"},
    {"romaji": "nya", "kana": "にゃ"},
    {"romaji": "nyu", "kana": "にゅ"},
    {"romaji": "nyo", "kana": "にょ"},
    {"romaji": "hya", "kana": "ひゃ"},
    {"romaji": "hyu", "kana": "ひゅ"},
    {"romaji": "hyo", "kana": "ひょ"},
    {"romaji": "mya", "kana": "みゃ"},
    {"romaji": "myu", "kana": "みゅ"},
    {"romaji": "myo", "kana": "みょ"},
    {"romaji": "rya", "kana": "りゃ"},
    {"romaji": "ryu", "kana": "りゅ"},
    {"romaji": "ryo", "kana": "りょ"},
    {"romaji": "gya", "kana": "ぎゃ"},
    {"romaji": "gyu", "kana": "ぎゅ"},
    {"romaji": "gyo", "kana": "ぎょ"},
    {"romaji": "ja", "kana": "じゃ"},
    {"romaji": "ju", "kana": "じゅ"},
    {"romaji": "jo", "kana": "じょ"},
    {"romaji": "bya", "kana": "びゃ"},
    {"romaji": "byu", "kana": "びゅ"},
    {"romaji": "byo", "kana": "びょ"},
    {"romaji": "pya", "kana": "ぴゃ"},
    {"romaji": "pyu", "kana": "ぴゅ"},
    {"romaji": "pyo", "kana": "ぴょ"},
]

# Complete Katakana list (same structure, different characters)
KATAKANA = [
    # Vowels
    {"romaji": "a", "kana": "ア"},
    {"romaji": "i", "kana": "イ"},
    {"romaji": "u", "kana": "ウ"},
    {"romaji": "e", "kana": "エ"},
    {"romaji": "o", "kana": "オ"},
    # K-row
    {"romaji": "ka", "kana": "カ"},
    {"romaji": "ki", "kana": "キ"},
    {"romaji": "ku", "kana": "ク"},
    {"romaji": "ke", "kana": "ケ"},
    {"romaji": "ko", "kana": "コ"},
    # S-row
    {"romaji": "sa", "kana": "サ"},
    {"romaji": "shi", "kana": "シ"},
    {"romaji": "su", "kana": "ス"},
    {"romaji": "se", "kana": "セ"},
    {"romaji": "so", "kana": "ソ"},
    # T-row
    {"romaji": "ta", "kana": "タ"},
    {"romaji": "chi", "kana": "チ"},
    {"romaji": "tsu", "kana": "ツ"},
    {"romaji": "te", "kana": "テ"},
    {"romaji": "to", "kana": "ト"},
    # N-row
    {"romaji": "na", "kana": "ナ"},
    {"romaji": "ni", "kana": "ニ"},
    {"romaji": "nu", "kana": "ヌ"},
    {"romaji": "ne", "kana": "ネ"},
    {"romaji": "no", "kana": "ノ"},
    # H-row
    {"romaji": "ha", "kana": "ハ"},
    {"romaji": "hi", "kana": "ヒ"},
    {"romaji": "fu", "kana": "フ"},
    {"romaji": "he", "kana": "ヘ"},
    {"romaji": "ho", "kana": "ホ"},
    # M-row
    {"romaji": "ma", "kana": "マ"},
    {"romaji": "mi", "kana": "ミ"},
    {"romaji": "mu", "kana": "ム"},
    {"romaji": "me", "kana": "メ"},
    {"romaji": "mo", "kana": "モ"},
    # Y-row
    {"romaji": "ya", "kana": "ヤ"},
    {"romaji": "yu", "kana": "ユ"},
    {"romaji": "yo", "kana": "ヨ"},
    # R-row
    {"romaji": "ra", "kana": "ラ"},
    {"romaji": "ri", "kana": "リ"},
    {"romaji": "ru", "kana": "ル"},
    {"romaji": "re", "kana": "レ"},
    {"romaji": "ro", "kana": "ロ"},
    # W-row + N
    {"romaji": "wa", "kana": "ワ"},
    {"romaji": "wo", "kana": "ヲ"},
    {"romaji": "n", "kana": "ン"},
    # Dakuten (G, Z, D, B)
    {"romaji": "ga", "kana": "ガ"},
    {"romaji": "gi", "kana": "ギ"},
    {"romaji": "gu", "kana": "グ"},
    {"romaji": "ge", "kana": "ゲ"},
    {"romaji": "go", "kana": "ゴ"},
    {"romaji": "za", "kana": "ザ"},
    {"romaji": "ji", "kana": "ジ"},
    {"romaji": "zu", "kana": "ズ"},
    {"romaji": "ze", "kana": "ゼ"},
    {"romaji": "zo", "kana": "ゾ"},
    {"romaji": "da", "kana": "ダ"},
    {"romaji": "di", "kana": "ヂ"},
    {"romaji": "du", "kana": "ヅ"},
    {"romaji": "de", "kana": "デ"},
    {"romaji": "do", "kana": "ド"},
    {"romaji": "ba", "kana": "バ"},
    {"romaji": "bi", "kana": "ビ"},
    {"romaji": "bu", "kana": "ブ"},
    {"romaji": "be", "kana": "ベ"},
    {"romaji": "bo", "kana": "ボ"},
    # Handakuten (P)
    {"romaji": "pa", "kana": "パ"},
    {"romaji": "pi", "kana": "ピ"},
    {"romaji": "pu", "kana": "プ"},
    {"romaji": "pe", "kana": "ペ"},
    {"romaji": "po", "kana": "ポ"},
    # Combinations (Yōon)
    {"romaji": "kya", "kana": "キャ"},
    {"romaji": "kyu", "kana": "キュ"},
    {"romaji": "kyo", "kana": "キョ"},
    {"romaji": "sha", "kana": "シャ"},
    {"romaji": "shu", "kana": "シュ"},
    {"romaji": "sho", "kana": "ショ"},
    {"romaji": "cha", "kana": "チャ"},
    {"romaji": "chu", "kana": "チュ"},
    {"romaji": "cho", "kana": "チョ"},
    {"romaji": "nya", "kana": "ニャ"},
    {"romaji": "nyu", "kana": "ニュ"},
    {"romaji": "nyo", "kana": "ニョ"},
    {"romaji": "hya", "kana": "ヒャ"},
    {"romaji": "hyu", "kana": "ヒュ"},
    {"romaji": "hyo", "kana": "ヒョ"},
    {"romaji": "mya", "kana": "ミャ"},
    {"romaji": "myu", "kana": "ミュ"},
    {"romaji": "myo", "kana": "ミョ"},
    {"romaji": "rya", "kana": "リャ"},
    {"romaji": "ryu", "kana": "リュ"},
    {"romaji": "ryo", "kana": "リョ"},
    {"romaji": "gya", "kana": "ギャ"},
    {"romaji": "gyu", "kana": "ギュ"},
    {"romaji": "gyo", "kana": "ギョ"},
    {"romaji": "ja", "kana": "ジャ"},
    {"romaji": "ju", "kana": "ジュ"},
    {"romaji": "jo", "kana": "ジョ"},
    {"romaji": "bya", "kana": "ビャ"},
    {"romaji": "byu", "kana": "ビュ"},
    {"romaji": "byo", "kana": "ビョ"},
    {"romaji": "pya", "kana": "ピャ"},
    {"romaji": "pyu", "kana": "ピュ"},
    {"romaji": "pyo", "kana": "ピョ"},
]


@router.get("", response_model=KanaListResponse)
async def get_all_kana(response: Response):
    """Get all hiragana and katakana characters.
    
    This endpoint returns static data, so we cache it aggressively.
    """
    # Set cache headers for static data - cache for 24 hours
    response.headers["Cache-Control"] = f"public, max-age={STATIC_CACHE_MAX_AGE}"
    
    return KanaListResponse(
        hiragana=[KanaItem(**k) for k in HIRAGANA],
        katakana=[KanaItem(**k) for k in KATAKANA]
    )


@router.get("/random")
async def get_random_kana(
    type: str = Query("hiragana", regex="^(hiragana|katakana|mixed)$"),
    count: Optional[int] = Query(None, ge=1, le=109),
    db: Session = Depends(get_db)
):
    """Get random kana for the Salad game."""
    # Get count from settings if not provided
    if count is None:
        setting = db.query(Setting).filter(Setting.key == "salad_kana_per_round").first()
        count = int(setting.value) if setting else 20
    
    if type == "mixed":
        # For mixed mode: select random romaji values, then randomly pick hiragana or katakana for each
        # This ensures no duplicate romaji values (which would cause multiple valid matches)
        hiragana_dict = {k["romaji"]: k["kana"] for k in HIRAGANA}
        katakana_dict = {k["romaji"]: k["kana"] for k in KATAKANA}
        
        # Get all unique romaji values
        all_romaji = list(hiragana_dict.keys())
        
        # Select random romaji values
        selected_romaji = random.sample(all_romaji, min(count, len(all_romaji)))
        
        # For each romaji, randomly choose hiragana or katakana
        selected = []
        for romaji in selected_romaji:
            if random.choice([True, False]):
                selected.append({"romaji": romaji, "kana": hiragana_dict[romaji]})
            else:
                selected.append({"romaji": romaji, "kana": katakana_dict[romaji]})
    else:
        kana_list = HIRAGANA if type == "hiragana" else KATAKANA
        selected = random.sample(kana_list, min(count, len(kana_list)))
    
    return {
        "kana": [KanaItem(**k) for k in selected],
        "count": len(selected)
    }

