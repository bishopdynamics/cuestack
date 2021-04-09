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
