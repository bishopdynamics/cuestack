# CueStack Configuration
Configuration is stored in a single file: `config-cuestack.json`. It contains four top-level keys: `default_stack`, `stacks`, `trigger_sources`, and `command_targets`. Here is an example:
```json
{
  "default_stack": "StackA",
  "stacks": [
    {
      "name": "StackA",
      "cues": [
        {
          "name": "winter_ball",
          "parts": [
            {
              "target": "tcp-example",
              "command": {
                "message": "i am the walrus"
              }
            }
          ]
        }
      ]
    },
    {
      "name": "StackB",
      "cues": [
        {
          "name": "winter_ball",
          "parts": [
            {
              "target": "tcp-example",
              "command": {
                "message": "i am NOT the walrus"
              }
            }
          ]
        }
      ]
    }
  ],
  "command_targets": [
    {
      "enabled": false,
      "name": "tcp-example",
      "type": "tcp-generic",
      "config": {
        "host": "localhost",
        "port": 8103
      }
    }
  ],
  "trigger_sources": [
    {
      "enabled": true,
      "name": "GenericWebsocket1",
      "type": "websocket",
      "config": {
        "port": 8081
      }
    }
  ]
}
```

## Trigger Sources

Trigger sources must send a JSON formatted string. The available keys are:
* `cue` call a cue
* `stack` change the current stack
* `request` request data about cues or stacks

A trigger source may send a message with one or more of these keys, but only one of each; stack change command will be executed before the cue trigger.
The `request` key allows you to ask for `cues` `stacks` or `currentStack`, and the corresponding data will be returned in the `result` key as shown below.

The client will receive a response in the form of a JSON formatted string with two possible keys:
* `status` either "OK" or description of the error encountered
* `result` the result of a request, if one was made

The `status` key will reflect the result of processing `cue` or `stack`, and will only reflect an error in handling request if it threw an unexpected exception.
Remember that `stack` is tracking; you only need to specify a stack when you want to change it.
### Websocket
Trigger sources should connect to the port specified, and send messages in the form:
`{"cue": "my_cue_name", "stack": "StackA", "request": "cues"}`

Config:
```json
    {
      "enabled": true,
      "name": "GenericWebsocket1",
      "type": "websocket",
      "config": {
        "port": 8081
      }
    }
```

### HTTP GET

HTTP GET actually does not use JSON encoding, instead encoding the keys in the url like this: `http://localhost:8081/trigger?cue=my_cue_name&stack=StackA&request=cues`
The response body will be JSON encoded.

```json
    {
      "enabled": true,
      "name": "GenericHTTP",
      "type": "http",
      "config": {
        "port": 8080
      }
    }
```

### MQTT

Messages are sent as JSON encoded string, exactly like websocket, but there will be no response (good or bad), it is all sent blindly. As a result, you cannot use the MQTT trigger source for making data requests.
```json
    {
      "enabled": false,
      "name": "GenericMQTT",
      "type": "mqtt",
      "config": {
        "host": "james-broker",
        "port": 1883,
        "topic": "CueStackTrigger"
      }
    }
```

## Command Targets
There are many more command target options, and the list will continue to grow

### OBS Studio via obs-websocket plugin

You can use any request documented [here](https://github.com/Elektordi/obs-websocket-py/blob/master/obswebsocket/requests.py), the `request` key must match one of those classes, and the `args` key is where you must include any arguments as listed in `:Arguments:` within that class definition.
CueStack can only send messages to OBS Studio, it cannot fetch information; responses are ignored, except for errors.
#### Cue part
```json
            {
              "target": "obs",
              "command": {
                "request": "SetSourceFilterVisibility",
                "args": {
                  "sourceName": "Player2",
                  "filterName": "expanded",
                  "filterEnabled": true
                }
              }
            },
            {
              "target": "obs",
              "command": {
                "request": "SetCurrentScene",
                "args": {
                  "scene_name": "WinterBall_Daytime_2source"
                }
              }
            }
```

#### Config
```json
    {
      "enabled": false,
      "name": "obs",
      "type": "obs-websocket",
      "config": {
        "host": "localhost",
        "port": 4444,
        "password": "secret"
      }
    }
```

### Generic OSC
As a handy shortcut, you can omit the `value` key, and a value of `1` will be sent

#### Cue Part
```json
            {
              "target": "qlcplus",
              "command": {
                "address": "/button/1"
              }
            },
            {
              "target": "qlcplus",
              "command": {
                "address": "/slider/22",
                "value": 132
              }
            }
```

#### Config
```json
    {
      "enabled": true,
      "name": "qlcplus",
      "type": "osc-generic",
      "config": {
        "host": "127.0.0.1",
        "port": 7703
      }
    }
```

### Generic UDP
#### Cue Part
```json
            {
              "target": "udp-example",
              "command": {
                "message": "{\"msg\": \"hello\"}"
              }
            }
```
You can also send a message as a dict, to avoid having to escape quotes with a slash. The dict will be converted into a json-encoded string before sending:
```json
            {
              "target": "udp-example",
              "command": {
                "message_type": "dict",
                "message": {
                  "msg": "hello"
                }
              }
            }
```
#### Config
```json
    {
      "enabled": false,
      "name": "udp-example",
      "type": "udp-generic",
      "config": {
        "host": "localhost",
        "port": 9191
      }
    }
```

### Generic TCP
#### Cue Part
```json
            {
              "target": "tcp-example",
              "command": {
                "message": "{\"msg\": \"hello\"}"
              }
            }
```
You can also send a message as a dict, to avoid having to escape quotes with a slash. The dict will be converted into a json-encoded string before sending:
```json
            {
              "target": "tcp-example",
              "command": {
                "message_type": "dict",
                "message": {
                  "msg": "hello"
                }
              }
            }
```
#### Config
```json
    {
      "enabled": false,
      "name": "tcp-example",
      "type": "tcp-generic",
      "config": {
        "host": "localhost",
        "port": 8103
      }
    }
```

### HTTP GET
#### Cue Part
```json
            {
              "target": "http-example",
              "command": {
                "message": "/someendpoint?param1=foo&param2=bar"
              }
            }
```
You can also send a message as a dict. The path and params will be converted into an appropriate url before sending:
```json
            {
              "target": "http-example",
              "command": {
                "message_type": "dict",
                "message": {
                  "path": "someendpoint",
                  "params": {
                    "param1": "foo",
                    "param2": "bar"
                  }
                }
              }
            }
```

#### Config
```json
    {
      "enabled": false,
      "name": "http-example",
      "type": "http-generic",
      "config": {
        "host": "localhost",
        "port": 9090
      }
    }
```

### Generic Websocket
#### Cue Part
```json
            {
              "target": "websocket-example",
              "command": {
                "message": "{\"msg\": \"hello\"}"
              }
            }
```

You can also send a message as a dict, to avoid having to escape quotes with a slash. The dict will be converted into a json-encoded string before sending:
```json
            {
              "target": "websocket-example",
              "command": {
                "message_type": "dict",
                "message": {
                  "msg": "hello"
                }
              }
            }
```

#### Config
```json
    {
      "enabled": false,
      "name": "websocket-example",
      "type": "websocket-generic",
      "config": {
        "host": "localhost",
        "port": 8113
      }
    }
```

### MQTT
#### Cue Part
```json
            {
              "target": "mqtt-example",
              "command": {
                "topic": "testtopic",
                "message": "{\"msg\": \"hello\"}"
              }
            }
```

You can also send a message as a dict, to avoid having to escape quotes with a slash. The dict will be converted into a json-encoded string before sending:

```json
            {
              "target": "mqtt-example",
              "command": {
                "topic": "testtopic",
                "message_type": "dict",
                "message": {
                  "msg": "hello"
                }
              }
            }
```

#### Config
```json
    {
      "enabled": false,
      "name": "mqtt-example",
      "type": "mqtt-generic",
      "config": {
        "host": "192.168.1.202",
        "port": 1883
      }
    }
```
