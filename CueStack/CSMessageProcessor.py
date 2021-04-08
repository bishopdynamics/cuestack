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


class CSMessageProcessor:
    # CueStack, all trigger sources pass their messages off to this class's handle method
    def __init__(self, config, trigger_sources, command_targets, command_queues):
        logging.debug('Initializing a CSMessageProcessor')
        self.command_targets = command_targets
        self.trigger_sources = trigger_sources
        self.command_queues = command_queues
        self.config = config
        self.current_cue_stack = self.find_stack(config['default_stack'])

    def handle(self, _msg):
        # you can have cut, stack, and request all in the same message
        try:
            logging.debug('received message: %s' % _msg)
            try:
                trigger_message = json.loads(_msg, object_pairs_hook=self.dict_raise_on_duplicates)
            except Exception as ex:
                logging.error('JSON Decode Failure: %s' % ex)
                return {'status': 'JSON Decode Failure: %s' % ex}
            if 'stack' in trigger_message:
                logging.info('switching to cue stack: %s' % trigger_message['stack'])
                actual_stack = self.find_stack(trigger_message['stack'])
                if actual_stack is not None:
                    self.current_cue_stack = actual_stack
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
                            logging.warning('ignoring disabled cue %s' % cuename)
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
            if 'request' in trigger_message:
                # a data request yay
                try:
                    if trigger_message['request'] == 'cues':
                        cuelist = []
                        for cue in self.current_cue_stack['cues']:
                            cuelist.append(cue['name'])
                        response = {'status': 'OK', 'response': {'cues': cuelist}}
                    elif trigger_message['request'] == 'stacks':
                        stacklist = []
                        for stack in self.config['stacks']:
                            stacklist.append(stack['name'])
                        response = {'status': 'OK', 'response': {'stacks': stacklist}}
                    elif trigger_message['request'] == 'currentStack':
                        response = {'status': 'OK', 'response': {'currentStack': self.current_cue_stack['name']}}
                    elif trigger_message['request'] == 'triggerSources':
                        sourcelist = []
                        for src in self.trigger_sources:
                            sourcelist.append(src)
                        response = {'status': 'OK', 'response': {'triggerSources': sourcelist}}
                    elif trigger_message['request'] == 'commandTargets':
                        targetlist = []
                        for target in self.command_targets:
                            targetlist.append(target)
                        response = {'status': 'OK', 'response': {'commandTargets': targetlist}}
                    else:
                        response = {'status': 'Unknown request: %s' % trigger_message['request']}
                except Exception as ex:
                    msg = 'unexpected exception while handling a request %s' % ex
                    logging.error(msg)
                    response = {'status': msg}
                return response
            return {'status': 'OK'}
        except Exception as e:
            logging.error('unexpected exception while parsing message: %s' % e)
            return {'status': 'Unexpected Exception'}

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
