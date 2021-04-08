#!/usr/bin/env python3
# CueStack triggers

#    Copyright (C) 2021 James Bishop (james@bishopdynamics.com)

# ignore rules:
#   docstring
#   too-broad-exception
#   line-too-long
#   too-many-branches
#   too-many-statements
#   too-many-public-methods
#   too-many-lines
#   too-many-nested-blocks
#   toddos (annotations linter handling this)
# pylint: disable=C0111,W0703,C0301,R0912,R0915,R0904,C0302,R1702,W0511

import time
import json
import asyncio
import logging
import websockets

from CSJanus import CSSafeQueue
import paho.mqtt.client as mqtt

from threading import Thread
from aiohttp import web
from urllib.parse import urlparse, parse_qs


# A "trigger" class must take a receive handler function as argument to __init__, and call that whenever a trigger event is received
#       config - a dict holding config as given in config.json
#       receive_handler - a function to call, passing message as a single json-encoded string
#       loop - asyncio loop, this will need to cooperate with other triggers
#   that message will have one or more keys, they must be passed along to the handler; remember to pass all keys, let the handler decide what is valid
#   the handler will return a dictionary containing a key named 'status' which will be OK, or describe the error encountered
#   the triger class is responsible for json-serializing that dictionary, and returning it to the requester, IF possible
#

class CSTriggerGenericWebsocket:
    # wraps asyncio websockets library into a simpler callback interface
    # pass port and receive handler to constructor
    # only two methods: send(msg), stop()
    # you dont really need to stop() since the thread is daemonized
    inbound_worker = None
    queue_ws_inbound = None
    queue_ws_outbound = None

    def __init__(self, config_obj):
        self.config = config_obj['config']
        self.receive_handler = config_obj['handler']
        self.loop = config_obj['loop']
        self.name = config_obj['name']
        self.queue = config_obj['queue']
        self.host = ''
        self.port = int(self.config['port'])
        self.clients = set()
        logging.info('Starting Websocket Trigger Source on port %s', self.port)
        self.queue_ws_inbound = CSSafeQueue(loop=self.loop)
        self.queue_ws_outbound = CSSafeQueue(loop=self.loop)
        # TODO dont know why the linter hates _websocket_handler right now, but it works just fine
        _ws_instance = websockets.serve(self._websocket_handler, host=self.host, port=self.port, loop=self.loop)
        self.loop.run_until_complete(_ws_instance)
        logging.debug('Starting worker thread to process inbound websocket message queue')
        self.inbound_worker = Thread(target=self._process_queue_inbound_ws)
        self.inbound_worker.setDaemon(True)
        self.inbound_worker.start()

    def stop(self):
        logging.info('shutting down Websocket Server')
        logging.debug('websocket shutdown does nothing at the moment')

    def _process_queue_inbound_ws(self):
        _queue = self.queue_ws_inbound
        while True:
            if _queue:
                while not _queue.empty():
                    try:
                        _item = _queue.get()
                        self._websocket_receive(_item)
                    except Exception:
                        logging.exception('Error while processing an inbound websocket message queue')
                time.sleep(0.1)  # lets the outbound task do something

    async def _websocket_handler(self, websocket, path):
        # this is the handler given to the websocket server to handle in/out
        try:
            outbound_task = asyncio.ensure_future(self._websocket_outbound_handler(websocket, path))
            inbound_task = asyncio.ensure_future(self._websocket_inbound_handler(websocket, path))
            done, pending = await asyncio.wait(
                [inbound_task, outbound_task],
                return_when=asyncio.FIRST_COMPLETED,
            )
            for task in pending:
                task.cancel()
        except Exception:
            logging.exception('Unexpected exception in websocket_handler')

    async def _websocket_inbound_handler(self, websocket, path):
        try:
            self.clients.add(websocket)  # clients is a set, so no duplicates will be allowed
            async for message in websocket:
                self.queue_ws_inbound.put(message)
        except:
            pass  # TODO dont particularly care about errors here

    async def _websocket_outbound_handler(self, websocket, path):
        while True:
            while not self.queue_ws_outbound.empty():
                # note: all messages go to all clients, up to clients to filter by target
                # if a client has disconnected, they get removed from the list
                message = self.queue_ws_outbound.get()
                logging.debug('Sending trigger source reply message')
                try:
                    _bad_clients = set()
                    for _this_client in self.clients:
                        try:
                            await _this_client.send(message)
                        except Exception as exa:
                            _bad_clients.add(_this_client)
                            logging.debug('removing client that failed to send')
                            logging.debug('exception was: %s', exa)
                    for _this_client in _bad_clients:
                        try:
                            self.clients.remove(_this_client)
                        except Exception:
                            logging.exception('Unexpected exception while trying to remove a bad client from list')
                except Exception:
                    logging.exception('Unexpected exception while trying to send ws msg to all clients')
            await asyncio.sleep(0)  # lets the inbound task do something

    def _websocket_receive(self, msg):
        # Do something with a received message
        # logging.debug('Received websocket message: %s', msg)
        result = self.receive_handler(msg)
        self.send(json.dumps(result))

    def send(self, msg):
        # queue message to be sent async later
        # logging.debug('Queueing trigger source reply')
        self.queue_ws_outbound.put(msg)


class CSTriggerGenericHTTP:
    # This handles API calls only, it does not serve any pages or resources
    app = None
    http_thread = None
    site = None

    def __init__(self, config_obj):
        self.config = config_obj['config']
        self.receive_handler = config_obj['handler']
        self.loop = config_obj['loop']
        self.name = config_obj['name']
        self.queue = config_obj['queue']
        self.host = ''
        self.port = int(self.config['port'])
        try:
            logging.info('Starting HTTP Server on port %s' % self.port)
            self.app = web.Application()
            self.app.add_routes([web.get('/trigger', self.handle_trigger)])
            self.runner = web.AppRunner(self.app, access_log=None)  # access_log can be set to logging.Logger instance, or None to mute logging
            self.loop.run_until_complete(self.runner.setup())
            self.site = web.TCPSite(self.runner, self.host, self.port)
            self.loop.run_until_complete(self.site.start())
        except Exception as ex:
            logging.error('Unexpected Exception while setting up HTTP Server: %s', ex)

    def handle_trigger(self, request):
        parsed_url = urlparse(str(request.url))
        parsed_query = parse_qs(parsed_url.query)
        msg = {}
        # since query params can be repeated with different values, parse_qs gives a dictionary of arrays
        # we must throw an error if there are any duplicates, since that behavior is undefined
        # otherwise, we just take the 0th element of the array of values
        for keyname in parsed_query:
            if len(parsed_query[keyname]) > 1:
                result = {'status': 'HTTP Query Error: duplicate query param: \'%s\'' % keyname}
                return web.Response(text=json.dumps(result), status=400)
            msg[keyname] = parsed_query[keyname][0]
        actual_message = json.dumps(msg)
        result = self.receive_handler(actual_message)
        if result['status'] == 'OK':
            return web.Response(text=json.dumps(result), status=200)
        else:
            return web.Response(text=json.dumps(result), status=400)

    def stop(self):
        logging.info('shutting down HTTP Server...')
        # self.loop.run_until_complete(self.site.stop())
        # self.loop.run_until_complete(self.app.shutdown())
        logging.debug('shutdown of http server currently does nothing')


class CSTriggerGenericMQTT:
    # Listens on a given mqtt topic for triggers

    def __init__(self, config_obj):
        self.config = config_obj['config']
        self.receive_handler = config_obj['handler']
        self.loop = config_obj['loop']
        self.name = config_obj['name']
        self.queue = config_obj['queue']
        try:
            self.host = self.config['host']
            self.port = int(self.config['port'])
            self.topic = self.config['topic']
            logging.info('Starting MQTT Trigger Client connected to %s:%s' % (self.host, self.port))
            self.client = mqtt.Client('CueStackTrigger')
            self.client.on_message = self.on_message
            self.client.connect(self.host, self.port)
            self.loop.run_until_complete(self.do_client())
        except Exception as ex:
            logging.error('Unexpected Exception while setting up MQTT Trigger Client: %s', ex)

    async def do_client(self):
        self.client.loop_start()
        self.client.subscribe(self.topic)

    def on_message(self, client, userdata, message):
        msg = message.payload.decode('utf-8')
        self.receive_handler(msg)

    def stop(self):
        logging.info('shutting down MQTT Trigger Client...')
        self.client.loop_stop()
