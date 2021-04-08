# CueStack Toolkit
CueStack is a system for coordinating show control across many different devices and protocols.

Copyright (C) 2021 by James Bishop (james@bishopdynamics.com)

License: [Proprietary](LICENSE.txt)

## Contents

* CueStack - see [CueStack/README.md](CueStack/README.md)
* VoicemeeterAgent - also see [CueStack/README.md](CueStack/README.md) (near the bottom)
* ViscaAgent - also see [CueStack/README.md](CueStack/README.md) (near the bottom)
* web_buttons_trigger - a very simple webui providing buttons to control CueStack
* AudioTrigger - trigger source for CueStack, for calling cues based on audio input level threshold. see [Readme.md](audio_trigger/README.md)

## Prebuilt Binaries for Windows

We provide prebuilt binaries for Windows here: [dist](dist). 

For CueStack and VoicemeeterAgent, you will need a config file, see [Quick Start](CueStack/README.md#quick-start) or start with an example from here: [CueStack/example-configs](CueStack/example-configs)

You may need to install [Visual C++ Redist 2015](https://www.microsoft.com/en-us/download/details.aspx?id=48145), but this is probably only needed for older versions of Windows.