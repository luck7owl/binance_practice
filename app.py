import os
import dotenv
import asyncio
import threading
import ccxt.pro as ccxtpro

from flask import Flask, render_template
from flask_socketio import SocketIO

dotenv.load_dotenv()

API_KEY = os.getenv("API_KEY")
SECRET_KEY = os.getenv("SECRET_KEY")

app = Flask(__name__)
socketio = SocketIO(app)

symbol = "BTC/USDT"


async def future_trades_socket():
    bs = ccxtpro.binance({
        'apiKey': API_KEY,
        'secret': SECRET_KEY,
        'options': {
            'defaultType': 'future'
        }
    })

    while True:
        try:
            trades = await bs.watch_trades(symbol=symbol)
            time = trades[-1]['datetime']
            count = len(trades)
            price = trades[-1]['price']
            amount = 0
            net = 0

            for trade in trades:
                amount += trade['cost']
                if trade['side'] == 'buy':
                    net += trade['cost']
                else:
                    net -= trade['cost']

            socketio.emit('trades', {
                'time': time,
                'count': count,
                'price': price,
                'amount': amount,
                'net': net,
            })
            await asyncio.sleep(0.25)

        except Exception as e:
            print("An error occurred:", e)
            break


@app.route('/')
def index():
    return render_template('index.html')


if __name__ == '__main__':
    websocket_thread = threading.Thread(
        target=lambda: asyncio.run(future_trades_socket()))
    websocket_thread.start()
    socketio.run(app, debug=True)
