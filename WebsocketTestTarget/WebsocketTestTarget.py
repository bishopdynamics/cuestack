#!/usr/bin/env python

# simple thing ot receive websocket messages, print them, and respond OK
# will respond OK regardless of message content
# response includes received_timestamp

import json
import sys
import asyncio
import pathlib
import websockets
import argparse
import platform
from datetime import datetime

if platform.system() == 'Windows':
    import win32api


async def ws_server(websocket, path):
    try:
        message = await websocket.recv()
        timestamp = str(datetime.now())
        print('%s  received message: %s' % (timestamp, message))
        reply = {'status': 'OK', 'received_timestamp': timestamp}
        await websocket.send(json.dumps(reply))
    except websockets.ConnectionClosed:
        print(f"warning: got websockets.ConnectionClosed")


def handle_windows_signal(a, b=None):
    print('caught windows idea of a signal, you probably need to press ctrl+c again')
    sys.exit()


def get_version(path_base):
    try:
        _version_string = 'development'
        v_file = pathlib.Path(path_base).joinpath('VERSION')
        b_file = pathlib.Path(path_base).joinpath('BUILD')
        if os.path.exists(v_file) and os.path.exists(b_file):
            with open(v_file, 'r') as file:
                _version = file.read().replace('\n', '')
            with open(b_file, 'r') as file:
                _build = file.read().replace('\n', '')
            _version_string = '%s-%s' % (_version, _build)
    except:
        _version_string = 'development'
        pass
    return _version_string


if __name__ == "__main__":
    # this is the main entry point
    assert sys.version_info >= (3, 8), "Script requires Python 3.8+."
    path_file = pathlib.Path(__file__).parent.absolute()  # this is where this .py file is located
    version = get_version(path_file)
    print('Starting CueStackClient %s ' % version)
    if platform.system() == 'Windows':
        win32api.SetConsoleCtrlHandler(handle_windows_signal, True)
    ARG_PARSER = argparse.ArgumentParser(description='Test Websocket Server', formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    ARG_PARSER.add_argument('-p', dest='port', action='store',
                            type=int, default=8001,
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
