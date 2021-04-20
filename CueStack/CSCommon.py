#!/usr/bin/env python3
# CueStack Common Functions

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


import os
import pathlib


def get_version(path_base):
    try:
        _version_string = 'development'
        v_file = pathlib.Path(path_base).joinpath('VERSION')
        b_file = pathlib.Path(path_base).joinpath('BUILD')
        if os.path.exists(v_file) and os.path.exists(b_file):
            with open(v_file, 'r') as file:
                _version = file.read().replace('\n', '')
            with open(b_file, 'r') as file:
                _build = file.read().replace('\n', '')
            _version_string = '%s-%s' % (_version, _build)
    except:
        _version_string = 'development'
        pass
    return _version_string


def find_cue(stack, cuename):
    # given a stack and cuename, return the cue matching cue object if found, or None
    found_cue = None
    for cue in stack['cues']:
        if cue['name'] == cuename:
            found_cue = cue
            break
    return found_cue


def dict_raise_on_duplicates(ordered_pairs):
    # reject duplicate keys. JSON decoder allows duplicate keys, but we do not
    # this will cause a ValueError to be raised if a duplicate is found
    d = {}
    for k, v in ordered_pairs:
        if k in d:
            raise ValueError("duplicate key: %r" % (k,))
        else:
            d[k] = v
    return d


def find_stack_index(config, stackname):
    # return the index of the stack matching stackname, within the array of stacks
    found_index = None
    for i in range(0, len(config['stacks'])):
        if config['stacks'][i]['name'] == stackname:
            found_index = i
            break
    return found_index


def find_cue_index(stack, cuename):
    # return the index of the cue matching cuename, within the array of cues in the given stack
    found_index = None
    for i in range(0, len(stack['cues'])):
        if stack['cues'][i]['name'] == cuename:
            found_index = i
            break
    return found_index


def find_trigger(config, triggername):
    # find a trigger source instance by name and return it
    found_trigger = None
    for trigger in config['trigger_sources']:
        if trigger['name'] == triggername:
            found_trigger = trigger
            break
    return found_trigger


def find_target(config, targetname):
    # find a command target by name and return it
    found_target = None
    for target in config['command_targets']:
        if target['name'] == targetname:
            found_target = target
            break
    return found_target


def find_stack(config, stackname):
    # find a stack matching stackname, within the array of stacks, and return it
    found_stack = None
    for stack in config['stacks']:
        if stack['name'] == stackname:
            found_stack = stack
            break
    return found_stack
