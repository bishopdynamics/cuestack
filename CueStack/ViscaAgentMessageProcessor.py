#!/usr/bin/env python3
# CueStack Message Processor

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
from multiprocessing import Queue

from visca import ViscaControl
from CSTriggerSources import CSTriggerGenericWebsocket, CSTriggerGenericHTTP, CSTriggerGenericMQTT

# self.v = ViscaControl(portname='/dev/serial/by-id/usb-Twiga_TWIGACam-if03-port0')
# self.v.cmd_cam_zoom_tele_speed(self.CAM, 7)
# self.v.cmd_cam_zoom_stop(self.CAM)
# self.v.cmd_cam_zoom_wide_speed(self.CAM, 7)


class ViscaAgentMessageProcessor:
    # The Visca Agent has its own message processor
    command_sources = {}  # objects managing a connection to a command source live here
    command_queue = None  # command sources place received messages in this queue, which the message processor then pulls from
    command_map = {
        'websocket': CSTriggerGenericWebsocket,
        'http': CSTriggerGenericHTTP,
        'mqtt': CSTriggerGenericMQTT,
    }

    def __init__(self, config, log_level, loop):
        logging.debug('Initializing a ViscaAgentMessageProcessor')
        self.config = config
        self.loop = loop
        self.log_level = log_level
        self.command_queue = Queue()
        try:
            self.setup_command_sources()
            if 'device_id' in self.config:
                self.device_id = self.config['device_id']
            else:
                self.device_id = 1
            logging.info('This device_id is: %s' % self.device_id)
            self.v = ViscaControl(portname=self.config['serial_port'])
            self.v.start()
            self.v.cmd_adress_set()
            self.v.cmd_if_clear_all()
            logging.info('Visca Agent is ready')
        except Exception as ex:
            logging.error('exception while setting up ViscaAgentMessageProcessor: %s' % ex)
            raise ex

    def stop(self):
        logging.info('shutting down command sources')
        for this_source in self.command_sources:
            try:
                self.command_sources[this_source].stop()
            except Exception:
                pass

    def handle(self, _msg):
        try:
            # logging.debug('received message: %s' % _msg)
            try:
                command_message = json.loads(_msg, object_pairs_hook=self.dict_raise_on_duplicates)
            except Exception as ex:
                logging.error('JSON Decode Failure: %s' % ex)
                return {'status': 'JSON Decode Failure: %s' % ex}
            if 'visca' in command_message:
                if command_message['visca']['args']['device'] == self.device_id:
                    try:
                        result = self.send_command(command_message['visca'])
                        logging.info('result of command: %s' % result)
                    except Exception as ex:
                        logging.error('exception while handling visca command: %s' % ex)
                        return {'status': 'Exception while handling visca command: %s' % ex}
                    return {'status': 'OK'}
                else:
                    logging.debug('ignoring message for other device id: %s' % command_message['visca']['args']['device'])
            else:
                return {'status': 'Error: missing a supported command key'}
        except Exception as e:
            logging.error('unexpected exception while parsing message: %s' % e)
            return {'status': 'Unexpected Exception'}

    def dict_raise_on_duplicates(self, ordered_pairs):
        # reject duplicate keys. JSON decoder allows duplicate keys, but we do not
        # this will cause a ValueError to be raised if a duplicate is found
        d = {}
        for k, v in ordered_pairs:
            if k in d:
                raise ValueError("duplicate key: %r" % (k,))
            else:
                d[k] = v
        return d

    def send_command(self, command):
        logging.info('sending visca command: %s' % command)
        method_to_call = getattr(self.v, command['request'])
        return method_to_call(**command['args'])

    def setup_command_sources(self):
        # setup command sources based on config, populating command_sources
        logging.info('setting up command sources')
        for this_source in self.config['command_sources']:
            try:
                self.setup_command_source(this_source)
            except Exception:
                logging.exception('something went wrong while configuring one of the command sources')
                raise Exception('failed to setup command sources')
        logging.debug('succeeded in setting up command sources')

    def setup_command_source(self, this_source):
        if this_source['name'] == 'internal':
            raise Exception('command source name "internal" is reserved for internal use, please choose a different name for this command source')
        if not this_source['enabled']:
            logging.warning('ignoring disabled command source: %s' % this_source['name'])
        else:
            logging.info('setting up command source: %s' % this_source['name'])
            if this_source['type'] in self.command_map:
                this_config_obj = {
                    'config': this_source['config'],
                    'name': 'ts:%s' % this_source['name'],
                    'queue': self.command_queue,
                    'handler': self.handle,
                    'loop': self.loop,
                }
                self.command_sources[this_source['name']] = self.command_map[this_source['type']](this_config_obj)
            else:
                raise Exception('command source %s unknown type: %s' % (this_source['name'], this_source['type']))
