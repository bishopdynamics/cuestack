0.1.1
* extended data api with addCue, addStack, setDefaultStack, addTarget, addTrigger, setEnabled
* enforce python 3.8+ 
* prebuilt binaries for windows report version with commit id they were built from

0.1.0
* started version numbers and changelog (everything prior is retro)
* move prebuilt binaries to top level dist/
* renamed web_cue_trigger to CueStackClient, and provide prebuilt binary for windows
* renamed audio_trigger to AudioTrigger, and provide prebuilt binary for windows (dont need node.js anymore!)
* renamed tests/ws to WebsocketTestTarget, and provide prebuild binary for windows

0.0.2
* added multiprocessing: moved all command targets into their own processes fed by queues

0.0.1
* added prebuilt binaries for windows, for CueStack and VoicemeeterAgent
* added untested ViscaAgent