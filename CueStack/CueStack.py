#!/usr/bin/env python3
# CueStack service

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


import sys
import json
import signal
import asyncio
import logging
import argparse
import pathlib
import platform

from multiprocessing import Process, Queue

from CSLogger import get_logger
from CSTriggerSources import CSTriggerGenericWebsocket, CSTriggerGenericHTTP, CSTriggerGenericMQTT
from CSCommandTargets import CSTargetOBS, CSTargetGenericOSC, CSTargetGenericTCP, CSTargetGenericUDP, CSTargetGenericHTTP, CSTargetGenericWebsocket, CSTargetGenericMQTT
from CSMessageProcessor import CSMessageProcessor


class CueStackService:
    config = None  # parsed config lives here
    trigger_sources = {}  # objects managing a connection to a trigger source live here
    command_targets = {}  # holds the processes (multithreading) that handle sending command target messages
    command_queues = {}  # holds the queues for pushing messages to the process which sends them
    target_map = {
        'obs-websocket': CSTargetOBS,
        'osc-generic': CSTargetGenericOSC,
        'tcp-generic': CSTargetGenericTCP,
        'udp-generic': CSTargetGenericUDP,
        'http-generic': CSTargetGenericHTTP,
        'websocket-generic': CSTargetGenericWebsocket,
        'mqtt-generic': CSTargetGenericMQTT
    }

    def __init__(self, args):
        logging.info('CueStack is starting...')
        self.args = args
        path_file = pathlib.Path(__file__).parent.absolute()
        path_cwd = pathlib.Path.cwd()
        path_base = path_cwd
        config_file = path_base.joinpath(self.args.config)
        logging.info('using config file: %s' % config_file)
        try:
            with open(config_file, 'r') as cf:
                self.config = json.load(cf)
        except Exception as e:
            logging.error('exception while parsing config file (%s): %s' % (config_file, e))
            self.stop(1)
        try:
            logging.info('setting up structures')
            self.loop = asyncio.new_event_loop()
            self.msg_processor = CSMessageProcessor(self.config, self.trigger_sources, self.command_targets, self.command_queues)
            self.setup_command_targets()
            self.setup_trigger_sources()

        except Exception as ex:
            logging.error('exception while setting up structures: %s' % ex)
            self.stop(1)

        signal.signal(signal.SIGTERM, self.handle_signal)
        signal.signal(signal.SIGINT, self.handle_signal)
        logging.info('CueStack Server is ready')
        try:
            self.loop.run_forever()
        except KeyboardInterrupt:
            pass
        except Exception as ex:
            logging.error('Unexpected Exception while setting up CueStack Server: %s', ex)
            self.stop(1)

    def setup_command_targets(self):
        # setup command targets based on config, populating command_targets
        logging.info('setting up command targets')
        for this_target in self.config['command_targets']:
            try:
                if not this_target['enabled']:
                    logging.warning('ignoring disabled command target: %s' % this_target['name'])
                else:
                    logging.info('setting up command target: %s' % this_target['name'])
                    this_type = this_target['type']
                    this_config = this_target['config']
                    # if this_type == 'obs-websocket':
                    #     self.command_targets[this_target['name']] = CSTargetOBS(this_config)
                    # elif this_type == 'osc-generic':
                    #     self.command_targets[this_target['name']] = CSTargetGenericOSC(this_config)
                    # elif this_type == 'tcp-generic':
                    #     self.command_targets[this_target['name']] = CSTargetGenericTCP(this_config)
                    # elif this_type == 'udp-generic':
                    #     self.command_targets[this_target['name']] = CSTargetGenericUDP(this_config)
                    # elif this_type == 'http-generic':
                    #     self.command_targets[this_target['name']] = CSTargetGenericHTTP(this_config)
                    # elif this_type == 'websocket-generic':
                    #     self.command_queues[this_target['name']] = Queue()
                    #     self.command_targets[this_target['name']] = Process(target=self.target_map[this_type], args=(this_config, this_target['name'], self.command_queues[this_target['name']]))
                    #     self.command_targets[this_target['name']].start()
                    # elif this_type == 'mqtt-generic':
                    #     self.command_targets[this_target['name']] = CSTargetGenericMQTT(this_config)
                    if this_type in self.target_map:
                        self.command_queues[this_target['name']] = Queue()
                        self.command_targets[this_target['name']] = Process(target=self.target_map[this_type], args=(this_config, this_target['name'], self.command_queues[this_target['name']]))
                        self.command_targets[this_target['name']].start()
                    else:
                        raise Exception('command target %s unknown type: %s' % (this_target['name'], this_type))
            except Exception:
                logging.exception('something went wrong while configuring one of the command targets')
                raise Exception('failed to setup command targets')
        logging.debug('succeeded in setting up command targets')

    def setup_trigger_sources(self):
        # setup trigger sources based on config, populating trigger_sources
        logging.info('setting up trigger sources')
        for this_source in self.config['trigger_sources']:
            try:
                if this_source['name'] == 'internal':
                    raise Exception('trigger source name \'internal\' is reserved for internal use, please choose a different name for this trigger source')
                if not this_source['enabled']:
                    logging.warning('ignoring disabled trigger source: %s' % this_source['name'])
                else:
                    logging.info('setting up trigger source: %s' % this_source['name'])
                    this_type = this_source['type']
                    this_config = this_source['config']
                    if this_type == 'websocket':
                        self.trigger_sources[this_source['name']] = CSTriggerGenericWebsocket(this_config, self.msg_processor.handle, self.loop)
                    elif this_type == 'http':
                        self.trigger_sources[this_source['name']] = CSTriggerGenericHTTP(this_config, self.msg_processor.handle, self.loop)
                    elif this_type == 'mqtt':
                        self.trigger_sources[this_source['name']] = CSTriggerGenericMQTT(this_config, self.msg_processor.handle, self.loop)
                    else:
                        raise Exception('trigger source %s unknown type: %s' % (this_source['name'], this_type))
            except Exception:
                logging.exception('something went wrong while configuring one of the trigger sources')
                raise Exception('failed to setup trigger sources')
        logging.debug('succeeded in setting up trigger sources')

    def handle_signal(self, this_signal, this_frame=None):
        # handle sigint or sigterm and cleanup
        try:
            logging.info('Caught signal to initiate shutdown')
            logging.debug('Caught signal: %s', this_signal)
            self.stop()
        except Exception as ex:
            logging.error('Unexpected Exception while handling signal: %s', ex)
            sys.exit(1)

    def stop(self, code=0):
        # shut down anything that needs to be
        logging.info('shutting down trigger sources')
        for this_source in self.trigger_sources:
            try:
                self.trigger_sources[this_source].stop()
            except Exception:
                pass
        logging.info('shutting down command targets')
        for this_target in self.command_targets:
            try:
                # self.command_targets[this_target].stop()
                logging.debug('shutting down command target process: %s' % this_target)
                self.command_targets[this_target].terminate()
                self.command_targets[this_target].join()
            except Exception:
                pass
        try:
            self.loop.stop()
        except Exception:
            pass
        try:
            self.loop.close()
        except Exception:
            pass
        logging.info('CueStack shutdown complete')
        if platform.system() == 'Windows':
            input('paused to let you read messages above, press enter to completely exit')
        sys.exit(code)


if __name__ == "__main__":
    # this is the main entry point for CueStack
    ARG_PARSER = argparse.ArgumentParser(description='CueStack Server', formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    ARG_PARSER.add_argument('-m', dest='mode', action='store',
                            type=str, default='prod', choices=['prod', 'dev'],
                            help='which mode to run in')
    ARG_PARSER.add_argument('-c', dest='config', action='store',
                            type=str, default='config-cuestack.json',
                            help='config file to use, relative to current directory')
    ARGS = ARG_PARSER.parse_args()
    if ARGS.mode == 'dev':
        LOG_LEVEL = logging.DEBUG
    else:
        LOG_LEVEL = logging.INFO
    logger = get_logger(name=__name__,
                        level=LOG_LEVEL)
    assert sys.version_info >= (3, 8), "Script requires Python 3.8+."
    CS = CueStackService(ARGS)
