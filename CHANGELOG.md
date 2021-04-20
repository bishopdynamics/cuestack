0.1.2
* WIP

0.1.1
* extend and reorg data api:
  - renamed: cues -> getCues, stacks -> getStacks, currentStack -> getCurrentStack
  - Added: addCue, addStack, setDefaultStack, addTarget, addTrigger, setEnabled, getConfig, deleteStack, deleteCue, renameStack
* enforce python 3.8+
* allow python3.9 in CueStack/setup.sh
* all prebuilt binaries for windows report version with commit id they were built from
* added CueStackClient templates.js
* started (but not complete) thinking about a full web client for editing config
* put finishing touches on ViscaAgent (verified with hardware)
* added ATEMAgent (verified with hardware)

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
