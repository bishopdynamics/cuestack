# ATEMAgent
ATEMAgent is designed to allow you to remotely control a BlackMagic ATEM video switcher, using websocket messages.
You can use the generic websocket command target to send messages to this agent. 
The agent supports control messages using the same input modules as CueStack, so it also supports HTTP Get and MQTT messages for control.


## Flags
* `-c` - set the config file location, default is `config-atemagent.json`
* `-m` - set the runmode, which changes how much info is printed, options are `dev` and `prod` (default)

## Config

ATEM Agent has its own config file, which is pretty straightforward:
```json
{
  "atem_ip": "192.168.1.92",
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
        "topic": "ViscaAgent"
      }
    }
  ]
}
```

## Cue
And a cue part in CueStack looks like this:
```json
            {
              "target": "atem-agent",
              "command": {
                "message": "{\"atem\": {\"request\": \"setMacroAction\", \"args\": {\"macro\": \"macro1\", \"action\": \"runMacro\"}}"
              }
            }
```

You can also send a message as a dict, to avoid having to escape quotes with a slash. The dict will be converted into a json-encoded string before sending. As you can see in the below example, more complex control messages are much easier when you dont have to mind your quotes!:

```json
            {
              "target": "atem-agent",
              "command": {
                "message_type": "dict",
                "message": {
                    "atem": {
                        "request": "setMacroAction",
                        "args": {
                            "macro": "macro1",
                            "action": "runMacro"
                        }
                    }
                }
              }
            }
```

Valid options for `action` are:
* `runMacro`
* `stopMacro`
* `stopRecording`
* `insertWaitForUser`
* `continueMacro`
* `deleteMacro`