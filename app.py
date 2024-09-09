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

            socketio.emit('message', {
                'type': 'trades',
                'payload': {
                    'time': time,
                    'count': count,
                    'price': price,
                    'amount': amount,
                    'net': net,
                }
            })
            await asyncio.sleep(0.25)

        except Exception as e:
            print("An error occurred:", e)
            break


async def future_orderbook_socket():
    bs = ccxtpro.binance({
        'apiKey': API_KEY,
        'secret': SECRET_KEY,
        'options': {
            'defaultType': 'future'
        }
    })

    while True:
        try:
            orderbook = await bs.watch_order_book(symbol=symbol)
            asks = orderbook['asks']
            bids = orderbook['bids']
            asks_group = group_by(asks, 5, "asks")
            bids_group = group_by(bids, 5, "bids")
            socketio.emit('message', {
                "type": "orderbook",
                "payload": {
                    'asks': asks_group,
                    'bids': bids_group,
                }
            })
            await asyncio.sleep(0.25)

        except Exception as e:
            print("An error occurred:", e)
            break


def group_by(data, size, type):
    idx = 0
    price = 0
    amount = 0
    group_by_data = []

    while idx + 1 < len(data):
        if price == 0:
            price = data[idx][0] // size
        if data[idx][0] // size == price:
            amount += data[idx][0] * data[idx][1]
            idx += 1
        else:
            if type == "asks":
                group_by_data.append([int((1 + price) * size), amount])
            if type == "bids":
                group_by_data.append([int(price * size), amount])
            price = 0
            amount = 0

    return group_by_data


async def sockets():
    await asyncio.gather(
        future_trades_socket(),
        future_orderbook_socket(),
    )


@app.route('/')
def index():
    return render_template('index.html')


if __name__ == '__main__':
    websocket_thread = threading.Thread(
        target=lambda: asyncio.run(sockets()))
    websocket_thread.start()
    socketio.run(app, debug=True)
