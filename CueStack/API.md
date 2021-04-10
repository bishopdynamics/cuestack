# CueStack Application Programming Interface

In CueStack, trigger sources serve as our access point to the API; the full API is available through all supported trigger sources.
That being said, the websocket trigger source is probably the best method if you are using the `request` endpoint.

## Message Format
API messages must be in the form of a JSON-encoded string (except HTTP, where the keys are encoded as query parameters), with one or more out of four possible keys:
```json
{
  "cue": "myFavoriteCue",
  "stack": "StackUno",
  "request": "setDefaultStack",
  "request_payload": "StackUno"
}
```

Most trigger sources will only ever use the `cue` and `stack` keys, as those are the actual "trigger" options. In that case, CueStack will send a response `{"status": "OK"}` or in the event of an error, the value of `status` will hold the error description. 
Error messages in `status` are meant to be descriptive, and may change over time; do not rely on specific error messages in your logic, success or failure only.

You can include all four of these keys in a single API message, and they will be processed in the order: `stack`, `cue`, `request`. Keep in mind that any errors encountered while processing `request` will override `status`, so in the event that a `cue` or `stack` trigger causes an error, AND `request` causes an error, only the error from `request` will be returned in `status`.
This behavior is justified in that most trigger sources will not process the response at all, so it is primarily intended for users of the Data API.

The `request` and `request_payload` keys implement the data API, which can be used to configure and control CueStack.

## Data API
The Data API is primarily intended for use by CueStackClient

The `request` key may be one of the options below; if the request needs to return data, it will be in `response`

* `cues`
  - returns `"response": {"cues": []}`, where `[]` is a list of all cues by name in the currently active stack
* `stacks`
  - returns `"response": {"stacks": []}`, where `[]` is a list of all stacks by name
* `currentStack`
  - returns `"response": {"currentStack": "stackname"}`, where `stackname` is the name of the current stack
* `triggerSources`
  - returns `"response": {"triggerSources": []}`, where `[]` is a list of all trigger sources by name
* `commandTargets`
  - returns `"response": {"commandTargets": []}`, where `[]` is a list of all command targets by name

There are some options which require additional data be given in `request_payload`; these options only return `status`

* `addTarget`
  - expects `"request_payload": {}`, where `{}` is a target exactly as in config.json
* `addTrigger`
  - expects `"request_payload": {}`, where `{}` is a trigger exactly as in config.json
* `addCue`
  - expects `"request_payload": {"stack": "stackname", "cue": {}}`, where `{}` is a cue exactly as in config.json to create, and `stackname` is the name of the stack to add it to. If needed, the stack will be created.
  - you can also copy from an existing cue: `"request_payload": {"stack": "stackname", "copyFrom": {"stack": "otherstackname", "cue": "othercuename"}, "cue": {}}`
  - you can also replace an existing cue, with a copy of another existing cue: `"request_payload": {"stack": "stackname", "replace": true, "copyFrom": {"stack": "otherstackname", "cue": "othercuename"}, "cue": {}}`
* `deleteCue`
  - expects `"requeset_payload": {"stack": "stackname", "cue": "cuename"}`
* `addStack`
  - expects `"request_payload": {"stack": "stackname"}`, where `stackname` is the name of the stack to create
  - you can also copy from an existing stack: `"request_payload": {"stack": "stackname", "copyFrom": "otherstackname"}`
  - you cannot replace an existing stack using addStack, instead try rename or delete
* `renameStack`
  - expects `"requeset_payload": {"stack": "stackname", "new_name": "stacknewname"}`
  - you cannot rename the currently active stack
* `deleteStack`
  - expects `"requeset_payload": {"stack": "stackname"}`
  - you cannot delete the currently active stack
* `setDefaultStack`
  - expects `"request_payload": "stackname"`, where `stackname` is the name of a stack to set as default; will fail if it does not exist
* `setEnabled`
  - expects `"request_payload": {"enabled": state}`, where `state` is boolean `true` or `false` indicating if we are enabling or disabling something. You also need to specify what to enable/disable
  - examples: 
    - cue: `"request_payload": {"enabled": false, "cue": {"stack": "stackname", "cue": "cuename"}}`
    - part: `"request_payload": {"enabled": false, "part": {"stack": "stackname", "cue": "cuename", "part": partnumber}}` (note `partnumber` is an integer)
    - target: `"request_payload": {"enabled": true, "target": {"name": "targetname"}}`
    - trigger: `"request_payload": {"enabled": true, "trigger": {"name": "triggername"}}` (note that if you disable the trigger source you're using for the API, you will lose access to the API, and it will not return a response)
  - In the event that something is already enabled/disabled, CueStack will take no action without returning an error
* `command`
  - expects `"request_payload": {}`, where `{}` is a command exactly as in a cue part, in config.json. This is also known as an anonymous cue part, or an ad-hoc command.
    
    

