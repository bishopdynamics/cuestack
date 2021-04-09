# CueStack Toolkit
CueStack is a system for coordinating show control across many different devices and protocols.

Copyright (C) 2021 by James Bishop (james@bishopdynamics.com)

License: [Proprietary](LICENSE.txt)

## Contents

* [CueStack](CueStack/README.md)
* [VoicemeeterAgent](CueStack/README-VoicemeeterAgent.md)
* [ViscaAgent](CueStack/README-ViscaAgent.md)
* [CueStackClient](CueStackClient/README.md)
* [AudioTrigger](AudioTrigger/README.md)
* [WebsocketTestTarget](WebsocketTestTarget/README.md)

## Prebuilt Binaries for Windows

We provide prebuilt binaries for Windows here: [dist](dist). 

For CueStack, and VoicemeeterAgent, you will need a config file, see [Quick Start](CueStack/README.md#quick-start) or start with an example from here: [CueStack/example-configs](CueStack/example-configs)

There are no prebuilt ViscaAgent binaries for Windows, as it is not supported on Windows.

You may need to install [Visual C++ Redist 2015](https://www.microsoft.com/en-us/download/details.aspx?id=48145), but this is probably only needed for older versions of Windows.

## Running from source on Windows

Each tool has `setup.bat` and `run.bat`, they can be used to manually setup and run that tool from within the source tree. This is intended only for development, please use the prebuilt binaries. VoicemeeterAgent and ViscaAgent both live within the Cuestack folder, and share `setup.bat` with CueStack but have their own run scripts.

## Usage on Linux and macOS

All of these tools should work on any posix compliant system where python3.8+ and node.js 14.15.3+ are available. 
It is quite likely that these tools will work just fine with older versions of python3 and node.js but it has not been tested and is not supported. 
All of the python tools check for 3.8+ at start, they will need to be modified.

VoicemeeterAgent is the only tool here which is Windows-only, all the other tools have `setup.sh` and `run.sh` which can be used to manually setup and run that tool from within the source tree. VoicemeeterAgent and ViscaAgent both live within the Cuestack folder, and share `setup.sh` with CueStack but have their own run scripts.