"""
@scsn777_bot 급등 스캐너 → COINCOPY 서버 연동
------------------------------------------------
메시지 형식 예시:
  🪙 ASTEROID_USDT
    현재가: 0.0001319 USDT
    급등률: +72.5%  (저점 ... → 고점)

사용법:
  pip install python-telegram-bot requests
  python bot/pump_bot.py
"""

import os, re, logging, requests
from telegram import Update
from telegram.ext import ApplicationBuilder, MessageHandler, filters, ContextTypes

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    datefmt="%H:%M:%S",
)

BOT_TOKEN    = os.environ.get("TELEGRAM_BOT_TOKEN", "8858417256:AAGGn1lD0ihSAb8SF6uY3WLFM6TCf5YYNiY")
CHAT_ID      = int(os.environ.get("TELEGRAM_CHAT_ID", "519064532"))
COINCOPY_URL = os.environ.get("COINCOPY_URL", "http://localhost:3000")
BOT_SECRET   = os.environ.get("BOT_SECRET", "changeme")

# 거래소 이름 추출 (첫 줄에서)
RE_EXCHANGE = re.compile(r'(Gate\.io|Binance|Bybit|Upbit|Bithumb|OKX|Bitget)', re.IGNORECASE)

# 코인 블록 파싱: 🪙 심볼_USDT + 현재가 + 급등률
RE_BLOCK = re.compile(
    r'🪙\s*(.+?)_USDT.*?'
    r'현재가[:\s]+([\d.e+-]+)\s*USDT.*?'
    r'급등률[:\s]+\+([\d.]+)%',
    re.DOTALL
)

def send_to_server(sym: str, chg: float, price: float, ex: str):
    try:
        resp = requests.post(
            f"{COINCOPY_URL}/api/pump",
            json={"sym": sym, "chg": chg, "price": price, "ex": ex},
            headers={"Authorization": f"Bearer {BOT_SECRET}"},
            timeout=5,
        )
        logging.info(f"📤 {sym} +{chg}% → {resp.status_code}")
    except Exception as e:
        logging.error(f"전송 실패: {e}")

async def on_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    msg = update.message or update.channel_post
    if not msg or not msg.text:
        return

    # 지정 채팅만 처리
    if msg.chat_id != CHAT_ID:
        return

    text = msg.text

    # 거래소 이름
    ex_match = RE_EXCHANGE.search(text)
    ex = ex_match.group(1) if ex_match else "Gate.io"

    # 코인 블록 전체 파싱
    blocks = RE_BLOCK.findall(text)
    if not blocks:
        return

    for sym_raw, price_str, chg_str in blocks:
        sym = sym_raw.strip()
        try:
            price = float(price_str)
            chg   = float(chg_str)
        except ValueError:
            continue

        logging.info(f"🚀 {sym} +{chg}% @ {price} ({ex})")
        send_to_server(sym, chg, price, ex)

if __name__ == "__main__":
    logging.info(f"봇 시작: @scsn777_bot → {COINCOPY_URL}/api/pump")
    app = ApplicationBuilder().token(BOT_TOKEN).build()
    app.add_handler(MessageHandler(filters.TEXT, on_message))
    app.run_polling()
