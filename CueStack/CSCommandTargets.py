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
from abc import abstractmethod

from obswebsocket import obsws as obs_client
from obswebsocket import requests as obs_requests
from pythonosc import udp_client
from urllib.request import urlopen
from urllib.parse import urlencode
from CSLogger import get_mplogger


class CSCommandTarget:
    # base implementation of a command target
    data = {}

    def __init__(self, config_obj):
        self.config_obj = config_obj
        self.should_run = True
        self.description = 'Unnamed Target'
        try:
            self.name = self.config_obj['name']
            self.config = self.config_obj['config']
            self.queue = self.config_obj['queue']
            self.logger = get_mplogger(name=self.name, level=logging.DEBUG)
            self.setup()
        except Exception as ex:
            self.logger.error('unexpected exception while setting up command target: %s' % ex)
            self.stop()
        else:
            self.logger.info('Starting %s command target: %s' % (self.description, self.name))
            self.process_queue()

    def process_queue(self):
        try:
            while self.should_run:
                if not self.queue.empty():
                    command = self.queue.get()
                    self.send(command)
        except KeyboardInterrupt:
            pass
        except Exception as ex:
            self.logger.error('unexpected exception while process_queue: %s' % ex)
        self.stop()

    def stop(self):
        self.logger.info('Shutting down %s command target: %s' % (self.description, self.name))
        self.should_run = False
        self.shutdown()

    def conv_msg_type(self, command):
        # convert messages with message_type key in them
        actual_message = command['message']
        if 'message_type' in command:
            if command['message_type'] == 'dict':
                self.logger.debug('converting outbound message type "dict" to a json-encoded string')
                actual_message = json.dumps(command['message'])
        return actual_message

    @abstractmethod
    def setup(self):
        pass

    @abstractmethod
    def send(self, command):
        pass

    @abstractmethod
    def shutdown(self):
        pass


class CSTargetOBS(CSCommandTarget):
    # Control OBS Studio using the obs-websocket plugin
    def setup(self):
        self.description = 'OBS Studio (via obs-websocket)'
        self.data['client'] = obs_client(self.config['host'], self.config['port'], self.config['password'])
        self.data['client'].connect()

    def send(self, command):
        try:
            method_to_call = getattr(obs_requests, command['request'])
        except AttributeError:
            self.logger.error('request type not available in obs-websocket library: %s' % command['request'])
        except Exception as ex:
            self.logger.error('unexpected exception while looking up obs request method: %s' % ex)
        else:
            try:
                self.send_command(command, method_to_call)
            except Exception as ex:
                self.logger.error('failure while trying to call obs request type: %s' % command['request'])
                self.logger.error('exception was: %s' % ex)
                self.logger.error('will reconnect and retry')
                self.retry(command, method_to_call)

    def send_command(self, command, method_to_call):
        self.logger.info('sending obs-websocket command: %s' % json.dumps(command))
        self.data['client'].call(method_to_call(**command['args']))

    def retry(self, command, method_to_call):
        try:
            self.reconnect()
            self.send_command(command, method_to_call)
        except Exception as ex:
            self.logger.error('failed a second time to send obs-websocket command. will not retry again.')

    def reconnect(self):
        self.logger.debug('reconnecting obs-websocket')
        self.data['client'].disconnect()
        self.data['client'] = obs_client(self.config['host'], self.config['port'], self.config['password'])
        self.data['client'].connect()

    def shutdown(self):
        self.data['client'].disconnect()


class CSTargetGenericOSC(CSCommandTarget):
    # generic OSC target
    def setup(self):
        self.description = 'Generic OSC'
        try:
            self.data['client'] = udp_client.SimpleUDPClient(self.config['host'], self.config['port'])
            self.data['host'] = (self.config['host'], self.config['port'])
        except Exception as ex:
            self.logger.error('exception while trying to setup Generic OSC connection: %s' % ex)
            raise ex

    def shutdown(self):
        pass

    def send(self, command):
        if 'value' in command:
            realvalue = command['value']
        else:
            self.logger.debug('no value in command, using default of 1')
            realvalue = 1
        self.logger.info('sending Generic OSC message %s: %s %s' % (self.data['host'], command['address'], realvalue))
        try:
            self.data['client'].send_message(command['address'], realvalue)
        except Exception as ex:
            self.logger.error('exception while trying to send Generic OSC message: %s' % ex)


class CSTargetGenericTCP(CSCommandTarget):
    # generic TCP target
    def setup(self):
        self.description = 'Generic TCP'
        try:
            self.data['sock'] = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            self.data['host'] = (self.config['host'], self.config['port'])
            self.data['sock'].connect(self.data['host'])
        except Exception as ex:
            self.logger.error('exception while trying to setup Generic TCP connection: %s' % ex)
            raise ex

    def shutdown(self):
        self.data['sock'].close()

    def send(self, command):
        try:
            actual_message = self.conv_msg_type(command)
            self.send_message(actual_message)
        except Exception as ex:
            self.logger.error('exception while trying to send Generic TCP message: %s, will reconnect and retry' % ex)
            self.retry(command)

    def send_message(self, message):
        self.logger.info('sending Generic TCP message to %s: %s' % (self.data['host'], message))
        self.data['sock'].sendall(bytes(message, 'utf-8'))

    def retry(self, command):
        try:
            self.reconnect()
            actual_message = self.conv_msg_type(command)
            self.send_message(actual_message)
        except Exception as ex:
            self.logger.error('exception while trying to send Generic TCP message: %s, will not retry' % ex)
            raise ex

    def reconnect(self):
        self.data['sock'].close()
        self.data['sock'].connect(self.data['host'])


class CSTargetGenericUDP(CSCommandTarget):
    # generic UDP target
    def setup(self):
        self.description = 'Generic UDP'
        try:
            self.data['sock'] = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            self.data['host'] = (self.config['host'], self.config['port'])
        except Exception as ex:
            self.logger.error('exception while trying to setup Generic UDP connection: %s' % ex)
            raise ex

    def shutdown(self):
        self.data['sock'].close()

    def send(self, command):
        self.logger.debug('sending Generic UDP message to %s: %s' % (self.data['host'], command['message']))
        try:
            actual_message = self.conv_msg_type(command)
            self.data['sock'].sendto(bytes(actual_message, 'utf-8'), self.data['host'])
        except Exception as ex:
            self.logger.error('exception while trying to send Generic UDP message: %s' % ex)


class CSTargetGenericHTTP(CSCommandTarget):
    # generic HTTP target
    def setup(self):
        self.description = 'Generic HTTP'
        self.data['host'] = 'http://%s:%s' % (self.config['host'], self.config['port'])

    def shutdown(self):
        # no need
        pass

    def send(self, command):
        # command['mesage'] = '/endpoint?foo=bar&beef=dead'
        fullurl = self.conv_msg_type(command)
        self.logger.info('sending Generic HTTP message: %s' % fullurl)
        try:
            response = urlopen(url=fullurl)
            result = response.read()
            self.logger.debug(result)
        except Exception as ex:
            self.logger.error('exception while trying to send Generic HTTP message: %s' % ex)

    def conv_msg_type(self, command):
        fullurl = '%s%s' % (self.data['host'], command['message'])
        if 'message_type' in command:
            if command['message_type'] == 'dict':
                params = urlencode(command['message']['params'])
                fullurl = '%s/%s?%s' % (self.data['host'], command['message']['path'], params)
        return fullurl


class CSTargetGenericWebsocket(CSCommandTarget):
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

    def setup(self):
        self.description = 'Generic Websocket'
        self.data['host'] = 'ws://%s:%s' % (self.config['host'], self.config['port'])
        self.data['client'] = websocket.WebSocket()

    def shutdown(self):
        self.data['client'].close()

    def send(self, command):
        actual_message = self.conv_msg_type(command)
        try:
            self.logger.info('sending Generic Websocket message (%s): %s' % (self.data['host'], actual_message))
            self.data['client'].connect(self.data['host'])
            self.data['client'].send(actual_message)
            reply = self.data['client'].recv_frame()
            if reply.opcode not in self.ok_opcodes:
                self.logger.error('reply from Generic Websocket: %s' % reply)
                raise Exception('reply opcode was not in ok_opcodes, was %s' % reply.opcode)
            self.logger.debug('reply from Generic Websocket: %s' % reply)
            self.data['client'].close()
        except Exception as ex:
            self.logger.error('exception while trying to send Generic Websocket message: (%s), will reconnect and retry' % ex)
            self.retry(actual_message)

    def retry(self, message):
        try:
            self.reconnect()
            self.logger.info('sending Generic Websocket message (%s): %s' % (self.data['host'], message))
            self.data['client'].send(message)
            reply = self.data['client'].recv_frame()
            if reply.opcode not in self.ok_opcodes:
                self.logger.error('reply from Generic Websocket: %s' % reply)
                raise Exception('reply opcode was not in ok_opcodes, was %s' % reply.opcode)
            self.logger.debug('reply from Generic Websocket (second attempt): %s' % reply)
            self.data['client'].close()
        except Exception as ex:
            self.logger.error('Generic Websocket send failed (%s) on second attempt, giving up' % ex)

    def reconnect(self):
        self.logger.debug('reconnecting websocket: %s' % self.data['host'])
        self.data['client'].close()
        self.data['client'].connect(self.data['host'])


class CSTargetGenericMQTT(CSCommandTarget):
    # generic MQTT target

    def setup(self):
        self.description = 'Generic MQTT'
        self.data['client'] = mqtt.Client('CueStack')
        self.data['client'].connect(self.config['host'], self.config['port'])

    def shutdown(self):
        self.data['client'].disconnect()

    def send(self, command):
        host = (self.config['host'], self.config['port'])
        self.logger.info('sending Generic MQTT message: server: %s, topic: %s, message: %s' % (host, command['topic'], command['message']))
        try:
            actual_message = self.conv_msg_type(command)
            self.data['client'].publish(command['topic'], actual_message)
        except Exception as ex:
            self.logger.error('exception while trying to send Generic MQTT message: %s' % ex)


