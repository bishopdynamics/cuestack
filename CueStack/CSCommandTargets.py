#!/usr/bin/env python3
# CueStack Targets

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

import json
import logging
import socket
import websocket

import paho.mqtt.client as mqtt

from obswebsocket import obsws as obs_client
from obswebsocket import requests as obs_requests
from pythonosc import udp_client
from urllib.request import urlopen
from urllib.parse import urlencode

# Target classes must implement three methods:
#   __init__
#       must take a single argument "config" which is a dictionary holding target config exactly as defined in config.json
#   send
#       must take a single argument "command" which is a dictionary holding the command exactly as defined in config.json
#   stop
#       must take zero args, must handle proper shutdown of this target


class CSTargetOBS:
    # Control OBS Studio using the obs-websocket plugin
    def __init__(self, config):
        self.config = config
        self.obs = obs_client(self.config['host'], self.config['port'], self.config['password'])
        self.obs.connect()

    def send(self, command):
        try:
            method_to_call = getattr(obs_requests, command['request'])
        except AttributeError:
            logging.error('request type not available in obs-websocket library: %s' % command['request'])
        except Exception as ex:
            logging.error('unexpected exception while looking up obs request method: %s' % ex)
        else:
            try:
                self.send_command(command, method_to_call)
            except Exception as ex:
                logging.error('failure while trying to call obs request type: %s' % command['request'])
                logging.error('exception was: %s' % ex)
                logging.error('will reconnect and retry')
                self.retry(command, method_to_call)

    def send_command(self, command, method_to_call):
        logging.info('sending obs-websocket command: %s' % json.dumps(command))
        self.obs.call(method_to_call(**command['args']))

    def retry(self, command, method_to_call):
        try:
            self.reconnect()
            self.send_command(command, method_to_call)
        except Exception as ex:
            logging.error('failed a second time to send obs-websocket command. will not retry again.')
            raise ex

    def reconnect(self):
        logging.debug('reconnecting obs-websocket')
        self.obs.disconnect()
        self.obs = obs_client(self.config['host'], self.config['port'], self.config['password'])
        self.obs.connect()

    def stop(self):
        logging.info('shutting down a connection to obs')
        self.obs.disconnect()


class CSTargetGenericOSC:
    # generic OSC target
    def __init__(self, config):
        try:
            self.osc = udp_client.SimpleUDPClient(config['host'], config['port'])
            self.host = (config['host'], config['port'])
        except Exception as ex:
            logging.error('exception while trying to setup Generic OSC connection: %s' % ex)
            raise ex

    def send(self, command):
        if 'value' in command:
            realvalue = command['value']
        else:
            logging.debug('no value in command, using default of 1')
            realvalue = 1
        logging.info('sending Generic OSC message %s: %s %s' % (self.host, command['address'], realvalue))
        try:
            self.osc.send_message(command['address'], realvalue)
        except Exception as ex:
            logging.error('exception while trying to send Generic OSC message: %s' % ex)
            raise ex

    def stop(self):
        logging.info('shutting down an Generic OSC connection')


class CSTargetGenericTCP:
    # generic TCP target
    def __init__(self, config):
        self.config = config
        try:
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.host = (self.config['host'], self.config['port'])
            self.sock.connect(self.host)
        except Exception as ex:
            logging.error('exception while trying to setup Generic TCP connection: %s' % ex)
            raise ex

    def send(self, command):
        try:
            actual_message = self.conv_msg_type(command)
            self.send_message(actual_message)
        except Exception as ex:
            logging.error('exception while trying to send Generic TCP message: %s, will reconnect and retry' % ex)
            self.retry(command)

    def send_message(self, message):
        logging.info('sending Generic TCP message to %s: %s' % (self.host, message))
        self.sock.sendall(bytes(message, "utf-8"))

    def retry(self, command):
        try:
            self.reconnect()
            actual_message = self.conv_msg_type(command)
            self.send_message(actual_message)
        except Exception as ex:
            logging.error('exception while trying to send Generic TCP message: %s, will not retry' % ex)
            raise ex

    def reconnect(self):
        self.sock.close()
        self.sock.connect(self.host)

    def conv_msg_type(self, command):
        actual_message = command['message']
        if 'message_type' in command:
            if command['message_type'] == 'dict':
                logging.debug('converting outbound message type "dict" to a json-encoded string')
                actual_message = json.dumps(command['message'])
        return actual_message

    def stop(self):
        logging.info('shutting down a Generic TCP connection')
        self.sock.close()


class CSTargetGenericUDP:
    # generic UDP target
    def __init__(self, config):
        try:
            self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            self.host = (config['host'], config['port'])
        except Exception as ex:
            logging.error('exception while trying to setup Generic UDP connection: %s' % ex)
            raise ex

    def send(self, command):
        logging.debug('sending Generic UDP message to %s: %s' % (self.host, command['message']))
        try:
            actual_message = self.conv_msg_type(command)
            self.sock.sendto(bytes(actual_message, "utf-8"), self.host)
        except Exception as ex:
            logging.error('exception while trying to send Generic UDP message: %s' % ex)
            raise ex

    def conv_msg_type(self, command):
        actual_message = command['message']
        if 'message_type' in command:
            if command['message_type'] == 'dict':
                logging.debug('converting outbound message type "dict" to a json-encoded string')
                actual_message = json.dumps(command['message'])
        return actual_message

    def stop(self):
        logging.info('shutting down a Generic UDP connection')
        self.sock.close()


class CSTargetGenericHTTP:
    # generic HTTP target
    def __init__(self, config):
        self.host = 'http://%s:%s' % (config['host'], config['port'])

    def send(self, command):
        # command['mesage'] = '/endpoint?foo=bar&beef=dead'
        fullurl = self.conv_msg_type(command)
        logging.info('sending Generic HTTP message: %s' % fullurl)
        try:
            response = urlopen(url=fullurl)
            result = response.read()
            logging.debug(result)
        except Exception as ex:
            logging.error('exception while trying to send Generic HTTP message: %s' % ex)

    def conv_msg_type(self, command):
        fullurl = '%s%s' % (self.host, command['message'])
        if 'message_type' in command:
            if command['message_type'] == 'dict':
                params = urlencode(command['message']['params'])
                fullurl = '%s/%s?%s' % (self.host, command['message']['path'], params)
        return fullurl

    def stop(self):
        logging.info('shutting down a Generic HTTP connection')
        logging.debug('generic HTTP target has no need to shutdown')


class CSTargetGenericWebsocket:
    # generic Websocket target

    # Opcode,Meaning,Reference
    # 0,Continuation Frame,[RFC6455]
    # 1,Text Frame,[RFC6455]
    # 2,Binary Frame,[RFC6455]
    # 3-7,Unassigned,
    # 8,Connection Close Frame,[RFC6455]
    # 9,Ping Frame,[RFC6455]
    # 10,Pong Frame,[RFC6455]
    # 11-15,Unassigned,

    ok_opcodes = [0, 1, 2]
    bad_opcodes = [8, 9, 10]

    def __init__(self, config):
        try:
            self.host = 'ws://%s:%s' % (config['host'], config['port'])
            self.ws = websocket.WebSocket()
        except Exception as ex:
            logging.error('exception while setting up websocket target')
            raise ex

    def send(self, command):
        actual_message = self.conv_msg_type(command)
        try:
            logging.info('sending Generic Websocket message (%s): %s' % (self.host, actual_message))
            self.ws.connect(self.host)
            self.ws.send(actual_message)
            reply = self.ws.recv_frame()
            if reply.opcode not in self.ok_opcodes:
                logging.error('reply from Generic Websocket: %s' % reply)
                raise Exception('reply opcode was not in ok_opcodes, was %s' % reply.opcode)
            logging.debug('reply from Generic Websocket: %s' % reply)
            self.ws.close()
        except Exception as ex:
            logging.error('exception while trying to send Generic Websocket message: (%s), will reconnect and retry' % ex)
            self.retry(actual_message)

    def retry(self, message):
        try:
            self.reconnect()
            logging.info('sending Generic Websocket message (%s): %s' % (self.host, message))
            self.ws.send(message)
            reply = self.ws.recv_frame()
            if reply.opcode not in self.ok_opcodes:
                logging.error('reply from Generic Websocket: %s' % reply)
                raise Exception('reply opcode was not in ok_opcodes, was %s' % reply.opcode)
            logging.debug('reply from Generic Websocket (second attempt): %s' % reply)
            self.ws.close()
        except Exception as ex:
            logging.error('Generic Websocket send failed (%s) on second attempt, giving up' % ex)

    def reconnect(self):
        logging.debug('reconnecting websocket: %s' % self.host)
        self.ws.close()
        self.ws.connect(self.host)

    def conv_msg_type(self, command):
        actual_message = command['message']
        if 'message_type' in command:
            if command['message_type'] == 'dict':
                logging.debug('converting outbound message type "dict" to a json-encoded string')
                actual_message = json.dumps(command['message'])
        return actual_message

    def stop(self):
        logging.info('shutting down a Generic Websocket connection')
        self.ws.close()


class CSTargetGenericMQTT:
    # generic MQTT target
    def __init__(self, config):
        try:
            self.host = (config['host'], config['port'])
            self.client = mqtt.Client('CueStack')
            self.client.connect(config['host'], config['port'])
        except Exception as ex:
            logging.error('exception while setting up MQTT target')
            raise ex

    def send(self, command):
        logging.info('sending Generic MQTT message: server: %s, topic: %s, message: %s' % (self.host, command['topic'], command['message']))
        try:
            actual_message = self.conv_msg_type(command)
            self.client.publish(command['topic'], actual_message)
        except Exception as ex:
            logging.error('exception while trying to send Generic MQTT message: %s' % ex)

    def conv_msg_type(self, command):
        actual_message = command['message']
        if 'message_type' in command:
            if command['message_type'] == 'dict':
                logging.debug('converting outbound message type "dict" to a json-encoded string')
                actual_message = json.dumps(command['message'])
        return actual_message

    def stop(self):
        logging.info('shutting down a Generic MQTT connection')
        self.client.disconnect()
