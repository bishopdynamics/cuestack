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

from visca import ViscaControl

# self.v = ViscaControl(portname='/dev/serial/by-id/usb-Twiga_TWIGACam-if03-port0')
# self.v.cmd_cam_zoom_tele_speed(self.CAM, 7)
# self.v.cmd_cam_zoom_stop(self.CAM)
# self.v.cmd_cam_zoom_wide_speed(self.CAM, 7)


class ViscaAgentMessageProcessor:
    # The Visca Agent has its own message processor
    def __init__(self, config):
        logging.debug('Initializing a ViscaAgentMessageProcessor')
        self.config = config
        try:
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

    def handle(self, _msg):
        try:
            # logging.debug('received message: %s' % _msg)
            try:
                trigger_message = json.loads(_msg, object_pairs_hook=self.dict_raise_on_duplicates)
            except Exception as ex:
                logging.error('JSON Decode Failure: %s' % ex)
                return {'status': 'JSON Decode Failure: %s' % ex}
            if 'visca' in trigger_message:
                if trigger_message['visca']['args']['device_id'] == self.device_id:
                    try:
                        self.send_command(trigger_message['visca'])
                    except Exception as ex:
                        logging.error('exception while handling visca command: %s' % ex)
                        return {'status': 'Exception while handling visca command: %s' % ex}
                    return {'status': 'OK'}
                else:
                    logging.debug('ignoring message for other device id: %s' % trigger_message['visca']['args']['device_id'])
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
        method_to_call(**command['args'])
