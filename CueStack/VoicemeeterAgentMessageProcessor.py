#!/usr/bin/env python3
# Voicemeeter Agent Message Processor

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
import voicemeeter
from multiprocessing import Queue

from CSTriggerSources import CSTriggerGenericWebsocket, CSTriggerGenericHTTP, CSTriggerGenericMQTT


class VoicemeeterAgentMessageProcessor:
    # The Voicemeeter Agent has its own message processor
    command_sources = {}  # objects managing a connection to a command source live here
    command_queue = None  # command sources place received messages in this queue, which the message processor then pulls from
    command_map = {
        'websocket': CSTriggerGenericWebsocket,
        'http': CSTriggerGenericHTTP,
        'mqtt': CSTriggerGenericMQTT,
    }

    def __init__(self, config, log_level, loop):
        logging.debug('Initializing a VoicemeeterAgentMessageProcessor')
        self.config = config
        self.loop = loop
        self.log_level = log_level
        self.command_queue = Queue()
        try:
            self.setup_command_sources()
            logging.info('making sure voicemeeter %s is open' % self.config['voicemeeter_kind'])
            voicemeeter.launch(self.config['voicemeeter_kind'])
        except Exception as ex:
            logging.error('exception while setting up VoicemeeterAgentMessageProcessor: %s' % ex)
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
            if 'apply' in command_message:
                logging.info('handling apply command: %s' % command_message['apply'])
                try:
                    with voicemeeter.remote(self.config['voicemeeter_kind']) as vmr:
                        vmr.apply(command_message['apply'])
                except Exception as ex:
                    logging.error('exception while handling apply command: %s' % ex)
                    return {'status': 'Exception while handling apply command: %s' % ex}
                return {'status': 'OK'}
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
