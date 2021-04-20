0.1.2
* CueStack 
  - move execution of cues to CueRunner, each in a separate thread
  - implement `delay` for cue parts, milliseconds from start of cue to delay this part. parts without `delay` will default to zero (everything executes at the same time)

0.1.1
* extend and reorg data api endpoints:
  - Renamed: cues -> getCues, stacks -> getStacks, currentStack -> getCurrentStack
  - Added: addCue, deleteCue, addStack, deleteStack, renameStack
  - Added: addTarget, addTrigger, getTriggerSources, getCommandTargets
  - Added: getConfig, setEnabled, command
* enforce python 3.8+
* allow python3.9 in CueStack/setup.sh (for ViscaAgent on raspbian bullseye)
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
