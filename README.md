# CueStack Toolkit
CueStack is a system for coordinating show control across many different devices and protocols.

Copyright (C) 2021 by James Bishop (james@bishopdynamics.com)

License: [Proprietary](LICENSE.txt)

## Contents

* CueStack - see [CueStack/README.md](CueStack/README.md)
* Voicemeeter Agent - also see [CueStack/README.md](CueStack/README.md) (near the bottom)
* Visca Agent - also see [CueStack/README.md](CueStack/README.md) (near the bottom)
* web_buttons_trigger - a very simple webui providing buttons to control CueStack
* audio_trigger - trigger source for CueStack, for calling cues based on audio input level threshold. see [Readme.md](audio_trigger/README.md)

## Prebuilt Binaries for Windows

For CueStack and VoicemeeterAgent, we have prebuilt binaries for Windows here: [CueStack/dist](CueStack/dist).
To use them, place `CueStack.exe` in a folder with your `config-cuestack.json`, and double-click on `CueStack.exe`. The same applies to `VoicemeeterAgent.exe` with `config-voicemeeteragent.json`.

You may need to install [Visual C++ Redist 2015](https://www.microsoft.com/en-us/download/details.aspx?id=48145), but this is probably only needed for older versions of Windows.