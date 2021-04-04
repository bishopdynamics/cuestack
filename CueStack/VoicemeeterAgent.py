#!/usr/bin/env python3
# Voicemeeter Agent
#  serves as a websocket bridge for controlling voicemeeter

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

if platform.system() == 'Windows':
    import win32api

from CSLogger import get_logger
from CSTriggerSources import CSTriggerGenericWebsocket, CSTriggerGenericHTTP, CSTriggerGenericMQTT
from VoicemeeterAgentMessageProcessor import VoicemeeterAgentMessageProcessor


class VoicemeeterAgent:
    config = None  # parsed config lives here
    command_sources = {}  # objects managing a connection to a command source live here

    def __init__(self):
        logging.info('Voicemeeter Agent is starting...')
        path_base = pathlib.Path(__file__).parent.absolute()
        config_file = path_base.joinpath('config-voicemeeteragent.json')
        try:
            with open(config_file, 'r') as cf:
                self.config = json.load(cf)
        except Exception as e:
            logging.error('exception while parsing config-voicemeeteragent.json: %s' % e)
            sys.exit(1)
        try:
            logging.info('setting up structures')
            self.loop = asyncio.new_event_loop()
            self.msg_processor = VoicemeeterAgentMessageProcessor(self.config)
            self.setup_command_sources()

        except Exception as ex:
            logging.error('exception while setting up structures: %s' % ex)
            self.stop()
            sys.exit(1)

        signal.signal(signal.SIGTERM, self.handle_signal)
        signal.signal(signal.SIGINT, self.handle_signal)
        logging.info('Voicemeeter Agent is ready')
        try:
            self.loop.run_forever()
        except KeyboardInterrupt:
            pass
        except Exception as ex:
            logging.error('Unexpected Exception while setting up Voicemeeter Agent: %s', ex)
            self.stop()

    def setup_command_sources(self):
        # setup command sources based on config, populating command_sources
        logging.info('setting up command sources')
        for this_source in self.config['command_sources']:
            try:
                if this_source['name'] == 'internal':
                    raise Exception('command source name \'internal\' is reserved for internal use, please choose a different name for this command source')
                if not this_source['enabled']:
                    logging.warning('ignoring disabled command source: %s' % this_source['name'])
                else:
                    logging.info('setting up command source: %s' % this_source['name'])
                    this_type = this_source['type']
                    this_config = this_source['config']
                    if this_type == 'websocket':
                        self.command_sources[this_source['name']] = CSTriggerGenericWebsocket(this_config, self.msg_processor.handle, self.loop)
                    elif this_type == 'http':
                        self.command_sources[this_source['name']] = CSTriggerGenericHTTP(this_config, self.msg_processor.handle, self.loop)
                    elif this_type == 'mqtt':
                        self.command_sources[this_source['name']] = CSTriggerGenericMQTT(this_config, self.msg_processor.handle, self.loop)
                    else:
                        raise Exception('command source %s unknown type: %s' % (this_source['name'], this_type))
            except Exception:
                logging.exception('something went wrong while configuring one of the command sources')
                raise Exception('failed to setup command sources')
        logging.debug('succeeded in setting up command sources')

    def handle_signal(self, this_signal, this_frame=None):
        # handle sigint or sigterm and cleanup
        try:
            logging.info('Caught signal to initiate shutdown')
            logging.debug('Caught signal: %s', this_signal)
            self.stop()
            sys.exit(0)
        except Exception as ex:
            logging.error('Unexpected Exception while handling signal: %s', ex)
            sys.exit(1)

    def stop(self):
        # shut down anything that needs to be
        logging.info('shutting down command sources')
        for this_source in self.command_sources:
            try:
                self.command_sources[this_source].stop()
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
        logging.info('Voicemeeter Agent shutdown complete')


def handle_windows_signal(a, b=None):
    logging.info('caught windows idea of a signal, you probably need to press ctrl+c again')
    sys.exit()


if __name__ == "__main__":
    # this is the main entry point for Voicemeeter Agent
    if platform.system() == 'Windows':
        win32api.SetConsoleCtrlHandler(handle_windows_signal, True)
    ARG_PARSER = argparse.ArgumentParser(description='Voicemeeter Agent')
    ARG_PARSER.add_argument('-m', dest='mode', action='store',
                            type=str, default='prod', choices=['prod', 'dev'],
                            help='which mode to run in')
    ARGS = ARG_PARSER.parse_args()
    if ARGS.mode == 'dev':
        LOG_LEVEL = logging.DEBUG
    else:
        LOG_LEVEL = logging.INFO
    logger = get_logger(name=__name__,
                        level=LOG_LEVEL)
    assert sys.version_info >= (3, 8), "Script requires Python 3.8+."
    VMA = VoicemeeterAgent()
