#!/usr/bin/env python3
# Visca Agent
#  serves as a websocket bridge for controlling cameras compatible with Sony Visca protocol

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

from CSLogger import get_logger
from ViscaAgentMessageProcessor import ViscaAgentMessageProcessor
from CSCommon import get_version


class ViscaAgent:
    config = None  # parsed config lives here

    def __init__(self, args, log_level):
        path_file = pathlib.Path(__file__).parent.absolute()  # this is where this .py file is located
        path_cwd = pathlib.Path.cwd()  # this is the current working directory, not necessarily where .py is located
        version = get_version(path_file)
        logging.info('ViscaAgent %s is starting...' % version)
        path_base = path_cwd
        config_file = path_base.joinpath(args.config)
        logging.info('using config file: %s' % config_file)
        try:
            with open(config_file, 'r') as cf:
                self.config = json.load(cf)
        except Exception as e:
            logging.error('exception while parsing config file (%s): %s' % (config_file, e))
            sys.exit(1)
        try:
            logging.info('setting up structures')
            self.loop = asyncio.new_event_loop()
            self.msg_processor = ViscaAgentMessageProcessor(self.config, log_level, self.loop)

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
            logging.error('Unexpected Exception while setting up Visca Agent: %s', ex)
            self.stop()

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
        try:
            self.msg_processor.stop()
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
        logging.info('Visca Agent shutdown complete')


if __name__ == "__main__":
    # this is the main entry point for Visca Agent
    ARG_PARSER = argparse.ArgumentParser(description='Visca Agent', formatter_class=argparse.ArgumentDefaultsHelpFormatter)
    ARG_PARSER.add_argument('-m', dest='mode', action='store',
                            type=str, default='prod', choices=['prod', 'dev'],
                            help='which mode to run in')
    ARG_PARSER.add_argument('-c', dest='config', action='store',
                            type=str, default='config-viscaagent.json',
                            help='config file to use, relative to current directory')
    ARGS = ARG_PARSER.parse_args()
    if ARGS.mode == 'dev':
        LOG_LEVEL = logging.DEBUG
    else:
        LOG_LEVEL = logging.INFO
    logger = get_logger(name=__name__,
                        level=LOG_LEVEL)
    assert sys.version_info >= (3, 8), "Script requires Python 3.8+."
    VA = ViscaAgent(ARGS, LOG_LEVEL)
