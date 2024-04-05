import os
import dotenv
import asyncio

import ccxt.pro as ccxtpro


# .env 파일 로드
dotenv.load_dotenv()

# 환경 변수 가져오기
API_KEY = os.getenv("API_KEY")
SECRET_KEY = os.getenv("SECRET_KEY")


symbol = "BTC/USDT"


async def future_trades_socket():
    bs = ccxtpro.binance({
        'apiKey': API_KEY,
        'secret': SECRET_KEY,
        'enableRateLimit': True,
        'options': {
            'defaultType': 'future'
        }
    })
    while True:
        trades = await bs.watch_trades(symbol=symbol)
        print(len(trades))
        print(trades)
        await asyncio.sleep(0.1)

asyncio.run(future_trades_socket())
