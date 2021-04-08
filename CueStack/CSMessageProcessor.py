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
from datetime import datetime
from multiprocessing import Process, Queue

from CSTriggerSources import CSTriggerGenericWebsocket, CSTriggerGenericHTTP, CSTriggerGenericMQTT
from CSCommandTargets import CSTargetOBS, CSTargetGenericOSC, CSTargetGenericTCP, CSTargetGenericUDP, CSTargetGenericHTTP, CSTargetGenericWebsocket, CSTargetGenericMQTT


class CSMessageProcessor:
    trigger_sources = {}  # objects managing a connection to a trigger source live here
    command_targets = {}  # holds the processes (multithreading) that handle sending command target messages
    command_queues = {}  # holds the queues for pushing messages to the process which sends them
    trigger_queue = None  # trigger sources place received messages in this queue, which the message processor then pulls from
    target_map = {  # this maps command target types to the corresponding class
        'obs-websocket': CSTargetOBS,
        'osc-generic': CSTargetGenericOSC,
        'tcp-generic': CSTargetGenericTCP,
        'udp-generic': CSTargetGenericUDP,
        'http-generic': CSTargetGenericHTTP,
        'websocket-generic': CSTargetGenericWebsocket,
        'mqtt-generic': CSTargetGenericMQTT,
    }
    trigger_map = {
        'websocket': CSTriggerGenericWebsocket,
        'http': CSTriggerGenericHTTP,
        'mqtt': CSTriggerGenericMQTT,
    }

    def __init__(self, config, loop):
        logging.debug('Initializing a CSMessageProcessor')
        self.config = config
        self.loop = loop
        self.trigger_queue = Queue()
        self.current_cue_stack = self.find_stack(config['default_stack'])
        self.setup_command_targets()
        self.setup_trigger_sources()

    def stop(self):
        logging.info('shutting down trigger sources')
        for this_source in self.trigger_sources:
            try:
                self.trigger_sources[this_source].stop()
            except Exception:
                pass
        logging.info('shutting down command targets')
        for this_target in self.command_targets:
            try:
                logging.debug('shutting down command target process: %s' % this_target)
                self.command_targets[this_target].terminate()
                self.command_targets[this_target].join()
            except Exception:
                pass

    def handle(self, _msg):
        # you can have cut, stack, and request all in the same message
        try:
            logging.debug('received message: %s' % _msg)
            try:
                trigger_message = json.loads(_msg, object_pairs_hook=self.dict_raise_on_duplicates)
            except Exception as ex:
                logging.error('JSON Decode Failure: %s' % ex)
                return {'status': 'JSON Decode Failure: %s' % ex}
            response = {'status': 'invalid request'}  # should get overwritten if this is a valid request
            if 'cue' in trigger_message or 'stack' in trigger_message:
                response = self.handle_api_cuestack(trigger_message)
            if 'request' in trigger_message:
                response = self.handle_api_request(trigger_message)
            return response

        except Exception as e:
            logging.error('unexpected exception while parsing message: %s' % e)
            return {'status': 'Unexpected Exception'}

    def handle_api_cuestack(self, trigger_message):
        # triggering a cue or stack
        if 'stack' in trigger_message:
            logging.info('switching to cue stack: %s' % trigger_message['stack'])
            actual_stack = self.find_stack(trigger_message['stack'])
            if actual_stack is not None:
                self.current_cue_stack = actual_stack
                # dont return yet
            else:
                logging.error('stack not found: %s' % trigger_message['stack'])
                logging.warning('not changing stacks')
                return {'status': 'Stack Not Found: %s' % trigger_message['stack']}
        if 'cue' in trigger_message:
            cuename = trigger_message['cue']
            logging.debug('received trigger for cue: %s' % cuename)
            actual_cue = self.find_cue(self.current_cue_stack, cuename)
            if actual_cue is not None:
                if 'enabled' in actual_cue:
                    if not actual_cue['enabled']:
                        logging.warning('silently ignoring disabled cue %s' % cuename)
                        return
                num_parts = 0
                total_parts = len(actual_cue['parts'])
                logging.info('running cue: %s' % cuename)
                for cue_part in actual_cue['parts']:
                    num_parts += 1
                    if 'enabled' in cue_part:
                        if not cue_part['enabled']:
                            logging.warning('ignoring disabled cue part: %s part %s/%s, target: %s, command: %s' % (cuename, num_parts, total_parts, cue_part['target'], json.dumps(cue_part['command'])))
                            continue
                    logging.info('running cue: %s, part: %s of %s, target: %s, command: %s' % (cuename, num_parts, total_parts, cue_part['target'], json.dumps(cue_part['command'])))
                    if cue_part['target'] == 'internal':
                        # an internal cue part can be used to call another trigger
                        timestamp = str(datetime.now())
                        logging.info('%s Sending an internal trigger: %s' % (timestamp, cue_part['command']))
                        tempstring = json.dumps(cue_part['command'])
                        self.handle(tempstring)
                        continue
                    else:
                        if cue_part['target'] in self.command_targets:
                            timestamp = str(datetime.now())
                            logging.debug('%s executing a part' % timestamp)
                            self.command_queues[cue_part['target']].put(cue_part['command'])
                        else:
                            logging.error('no enabled command target exists to handle cue target: %s' % cue_part['target'])
                            continue
            else:
                logging.error('unable to find a cue named %s in current stack' % cuename)
                return {'status': 'Cue Not Found: %s' % cuename}
        return {'status': 'OK'}

    def handle_api_request(self, trigger_message):
        # data api requests
        try:
            request = trigger_message['request']
            if request == 'cues':
                cuelist = []
                for cue in self.current_cue_stack['cues']:
                    cuelist.append(cue['name'])
                response = {'status': 'OK', 'response': {'cues': cuelist}}
            elif request == 'stacks':
                stacklist = []
                for stack in self.config['stacks']:
                    stacklist.append(stack['name'])
                response = {'status': 'OK', 'response': {'stacks': stacklist}}
            elif request == 'currentStack':
                response = {'status': 'OK', 'response': {'currentStack': self.current_cue_stack['name']}}
            elif request == 'triggerSources':
                sourcelist = []
                for src in self.trigger_sources:
                    sourcelist.append(src)
                response = {'status': 'OK', 'response': {'triggerSources': sourcelist}}
            elif request == 'commandTargets':
                targetlist = []
                for target in self.command_targets:
                    targetlist.append(target)
                response = {'status': 'OK', 'response': {'commandTargets': targetlist}}
            elif request == 'addTarget':
                try:
                    self.setup_command_target(trigger_message['request_payload'])
                    response = {'status': 'OK'}
                except Exception as ex:
                    logging.error('addTarget failed: %s' % ex)
                    response = {'status': 'Exception: %s' % ex}
            elif request == 'addTrigger':
                try:
                    self.setup_trigger_source(trigger_message['request_payload'])
                    response = {'status': 'OK'}
                except Exception as ex:
                    logging.error('addTrigger failed: %s' % ex)
                    response = {'status': 'Exception: %s' % ex}
            else:
                response = {'status': 'Unknown request: %s' % request}
        except Exception as ex:
            msg = 'unexpected exception while handling a request %s' % ex
            logging.error(msg)
            response = {'status': msg}
        return response

    def find_stack(self, stackname):
        found_stack = None
        for stack in self.config['stacks']:
            if stack['name'] == stackname:
                found_stack = stack
                break
        return found_stack

    def find_cue(self, stack, cuename):
        found_cue = None
        for cue in stack['cues']:
            if cue['name'] == cuename:
                found_cue = cue
                break
        return found_cue

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

    def setup_command_targets(self):
        # setup command targets based on config, populating command_targets
        logging.info('setting up command targets')
        for this_target in self.config['command_targets']:
            try:
                self.setup_command_target(this_target)
            except Exception:
                logging.exception('something went wrong while configuring one of the command targets')
                raise Exception('failed to setup command targets')
        logging.debug('succeeded in setting up command targets')

    def setup_command_target(self, this_target):
        if not this_target['enabled']:
            logging.warning('ignoring disabled command target: %s' % this_target['name'])
        else:
            logging.info('setting up command target: %s' % this_target['name'])
            if this_target['type'] in self.target_map:
                self.command_queues[this_target['name']] = Queue()
                this_config_obj = {
                    'config': this_target['config'],  # config for this target, straight from config.json
                    'name': 'ct:%s' % this_target['name'],  # this will be the name used in logging
                    'queue': self.command_queues[this_target['name']],  # the queue for passing command messages to this target
                }
                self.command_targets[this_target['name']] = Process(target=self.target_map[this_target['type']], args=(this_config_obj,))
                self.command_targets[this_target['name']].start()
            else:
                raise Exception('command target %s unknown type: %s' % (this_target['name'], this_target['type']))

    def setup_trigger_sources(self):
        # setup trigger sources based on config, populating trigger_sources
        logging.info('setting up trigger sources')
        for this_source in self.config['trigger_sources']:
            try:
                self.setup_trigger_source(this_source)
            except Exception:
                logging.exception('something went wrong while configuring one of the trigger sources')
                raise Exception('failed to setup trigger sources')
        logging.debug('succeeded in setting up trigger sources')

    def setup_trigger_source(self, this_source):
        if this_source['name'] == 'internal':
            raise Exception('trigger source name "internal" is reserved for internal use, please choose a different name for this trigger source')
        if not this_source['enabled']:
            logging.warning('ignoring disabled trigger source: %s' % this_source['name'])
        else:
            logging.info('setting up trigger source: %s' % this_source['name'])
            if this_source['type'] in self.trigger_map:
                this_config_obj = {
                    'config': this_source['config'],
                    'name': 'ts:%s' % this_source['name'],
                    'queue': self.trigger_queue,
                    'handler': self.handle,
                    'loop': self.loop,
                }
                self.trigger_sources[this_source['name']] = self.trigger_map[this_source['type']](this_config_obj)
            else:
                raise Exception('trigger source %s unknown type: %s' % (this_source['name'], this_source['type']))
