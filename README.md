# CueStack Toolkit
CueStack is a system for coordinating show control across many different devices and protocols.

Copyright (C) 2021 by James Bishop (james@bishopdynamics.com)

License: [![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)

[Change Log](CHANGELOG.md)

## Note about release

This project started as a proprietary solution for use in producing live-streamed events.
As such, it has never been refactored.

I have re-licensed it under AGPL and made it available in the hope that it may be useful for others.

This project is no longer actively developed.

## Contents

* [CueStack](CueStack/README.md)
* [VoicemeeterAgent](CueStack/README-VoicemeeterAgent.md)
* [ViscaAgent](CueStack/README-ViscaAgent.md)
* [ATEMAgent](CueStack/README-ATEMAgent.md)
* [CueStackClient](CueStackClient/README.md) (incomplete)
* [AudioTrigger](AudioTrigger/README.md)
* [WebsocketTestTarget](WebsocketTestTarget/README.md)

## Prebuilt Binaries for Windows

We provide prebuilt binaries for Windows here: [dist](dist). 

For CueStack, ATEMAgent, and VoicemeeterAgent, you will need a config file, 
see [Quick Start](CueStack/README.md#quick-start) or start with an example from here: [CueStack/example-configs](CueStack/example-configs)

There are no prebuilt ViscaAgent binaries for Windows, as it is not supported on Windows.

You may need to install [Visual C++ Redist 2015](https://www.microsoft.com/en-us/download/details.aspx?id=48145), 
but this is probably only needed for older versions of Windows.
<<<<<<< HEAD

CueStackClient is incomplete; it was intended to be a web-based frontend for configuring CueStack, instead of using the config files. I found the config files (and a proper editor) served the purpose just fine, and so I never finished CueStackClient.
=======
>>>>>>> 40f7bd66a293f267f51d38b190356c445f647ba1

## Running from source on Windows

Each tool has `setup.bat` and `run.bat`, they can be used to manually setup and run that tool from within the source tree. 
This is intended only for development, please use the prebuilt binaries. 

VoicemeeterAgent and ATEMAgent live within the Cuestack folder, and share `setup.bat` with CueStack 
but have their own separate run script: `run-voicemeeteragent.bat` and `run-atemagent.bat`.

ViscaAgent is not supported on Windows.

## Usage on Linux and macOS

All of these tools should work on any posix compliant system where python3.8+ and node.js 14.15.3+ are available. 
It is quite likely that these tools will work just fine with older versions of python3 and node.js but it has not been tested and is not supported. 
All of the python tools check for 3.8+ at start, they will need to be modified.

VoicemeeterAgent is the only tool here which is Windows-only, all the other tools have `setup.sh` and `run.sh` which can be used 
to manually setup and run that tool from within the source tree. 

ViscaAgent lives within the Cuestack folder, and shares `setup.sh` with CueStack but has its own run script: `run-viscaagent.sh`.