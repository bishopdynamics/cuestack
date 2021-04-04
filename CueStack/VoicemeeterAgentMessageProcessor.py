#!/usr/bin/env python3
# CueStack Message Processor

#    Copyright (C) 2020 James Bishop (james@bishopdynamics.com)

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


class VoicemeeterAgentMessageProcessor:
    # The Voicemeeter Agent has its own message processor
    def __init__(self, config):
        logging.debug('Initializing a VoicemeeterAgentMessageProcessor')
        self.config = config
        try:
            logging.info('making sure voicemeeter %s is open' % self.config['voicemeeter_kind'])
            voicemeeter.launch(self.config['voicemeeter_kind'])
        except Exception as ex:
            logging.error('exception while setting up VoicemeeterAgentMessageProcessor: %s' % ex)
            raise ex

    def handle(self, _msg):
        try:
            # logging.debug('received message: %s' % _msg)
            try:
                trigger_message = json.loads(_msg, object_pairs_hook=self.dict_raise_on_duplicates)
            except Exception as ex:
                logging.error('JSON Decode Failure: %s' % ex)
                return {'status': 'JSON Decode Failure: %s' % ex}
            if 'apply' in trigger_message:
                logging.info('handling apply command: %s' % trigger_message['apply'])
                try:
                    with voicemeeter.remote(self.config['voicemeeter_kind']) as vmr:
                        vmr.apply(trigger_message['apply'])
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