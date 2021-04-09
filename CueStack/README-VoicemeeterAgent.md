# VoicemeeterAgent
VoicemeeterAgent is designed to allow you to remotely control a Voicemeeter instance on a remote machine, using websocket messages.
You can use the generic websocket command target to send messages to this agent. The agent supports control messages using the same input modules as CueStack, so it also supports HTTP Get and MQTT messages for control.

You can send messages that will use the `apply` method as documented [here](https://github.com/chvolkmann/voicemeeter-remote-python).
You may notice that API supports other methods, but we have chosen to only use `apply` as it covers everything in one call.

VoicemeeterAgent only works on Windows, same for Voicemeeter itself.

## Flags
* `-c` - set the config file location, default is `config-voicemeeteragent.json`
* `-m` - set the runmode, which changes how much info is printed, options are `dev` and `prod` (default)

## Config

Voicemeeter Agent has its own config file, which is pretty straightforward:
```json
{
  "voicemeeter_kind": "potato",
  "command_sources": [
    {
      "enabled": true,
      "name": "GenericWebsocket1",
      "type": "websocket",
      "config": {
        "port": 9901
      }
    },
    {
      "enabled": false,
      "name": "GenericHTTP",
      "type": "http",
      "config": {
        "port": 9902
      }
    },
    {
      "enabled": false,
      "name": "GenericMQTT",
      "type": "mqtt",
      "config": {
        "host": "james-broker",
        "port": 1883,
        "topic": "VoicemeeterAgent"
      }
    }
  ]
}
```

## Cue
And a cue part in CueStack looks like this:
```json
            {
              "target": "voicemeeter",
              "command": {
                "message": "{\"apply\": {\"in-0\": {\"mute\": false}}}"
              }
            }
```

You can also send a message as a dict, to avoid having to escape quotes with a slash. The dict will be converted into a json-encoded string before sending. As you can see in the below example, more complex control messages are much easier when you dont have to mind your quotes!:

```json
            {
              "target": "voicemeeter",
              "command": {
                "message_type": "dict",
                "message": {
                  "apply": {
                    "in-0": {
                      "mute": false,
                      "A1": true,
                      "A2": true,
                      "A3": false,
                      "gain": -6.0
                    },
                    "in-1": {
                      "A1": false,
                      "A2": false,
                      "A3": true,
                      "gain": 1.2
                    }
                  }
                }
              }
            }
```
