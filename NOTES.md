# Notes

## November 11, 2022

Changed license to AGPL and released to public.

## May 27th, 2022

After uploading NetbootStudio to github, saw this repo and decided to take a look.
I am quite proud at how clean this whole project is, but I can't help but feel like it should be reorganized.
I'm not going to dedicate that much time here though, maybe next time.

* cleaned instances of `folder/*` in .gitignore
* ? Why are we using a local copy of pyatemmax ?
  * ATEMCommandHandlers -> _handleSSrc: was throwing errors, so nerfed it. Maybe future release will actually fix it.
* ? Why are we using a local copy of voicemeeter module ?
* Licensing check:
  * websockets - MIT
  * attr - MIT
  * obs-websocket-py - MIT
  * python-osc - Freely Distributable
  * websocket-client - MIT
  * paho-mqtt - Eclipse Public License v2.0 / Eclipse Distribution License v1.0
  * toml - MIT
  * pyserial - BSD
* added license for PyATEMMax module
* voicemeeter module has no license