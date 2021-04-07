#!/usr/bin/env python

# simple thing ot receive websocket messages, print them, and respond OK
# will respond OK regardless of message content
# response includes received_timestamp

import json
import sys
import asyncio
import websockets
import argparse
from datetime import datetime

WS_PORT = 8113


async def ws_server(websocket, path):
    while True:
        try:
            message = await websocket.recv()
            timestamp = str(datetime.now())
            print('%s  received message: %s' % (timestamp, message))
            reply = {'status': 'OK', 'received_timestamp': timestamp}
            await websocket.send(json.dumps(reply))
        except websockets.ConnectionClosed:
            # print(f"Terminated")
            # break
            continue


if __name__ == "__main__":
    # this is the main entry point
    print('Websocket Test Server')
    ARG_PARSER = argparse.ArgumentParser(description='Test Websocket Server', formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    ARG_PARSER.add_argument('-p', dest='port', action='store',
                            type=int, default=8113,
                            help='port on which to run websocket server')
    ARGS = ARG_PARSER.parse_args()

    start_server = websockets.serve(ws_server, 'localhost', ARGS.port)
    print('websocket server running on port: %s' % ARGS.port)

    try:
        asyncio.get_event_loop().run_until_complete(start_server)
        asyncio.get_event_loop().run_forever()
    except KeyboardInterrupt:
        pass
    except Exception as ex:
        print('Unexpected Exception while running event loop forever: %s', ex)
    print('shutting down websocket server')
    sys.exit()