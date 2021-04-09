# CueStack

## Table of Contents

   * [CueStack](#cuestack)
      * [Intro to CueStack](#intro-to-cuestack)
      * [Quick Start](#quick-start)
      * [Vocabulary](#vocabulary)
      * [Limitations](#limitations)
      * [API](#api)    
      * [Conceptual Diagram](#conceptual-diagram)
      * [Config](#config)
      * [Trigger Sources](#trigger-sources)
         * [Websocket](#websocket)
         * [HTTP GET](#http-get)
         * [MQTT](#mqtt)
      * [Command Targets](#command-targets)
         * [OBS Studio via obs-websocket plugin](#obs-studio-via-obs-websocket-plugin)
         * [Generic OSC](#generic-osc)
         * [Generic UDP](#generic-udp)
         * [Generic TCP](#generic-tcp)
         * [HTTP GET](#http-get-1)
         * [Generic Websocket](#generic-websocket)
         * [MQTT](#mqtt-1)

## Intro to CueStack
Inspired by an old tool called Cue Composer, this project seeks to provide a middle component as part of a whole production coordination system. 
The stack system is intended to allow you to build out multiple versions of the same cues, with the stack representing overall context. 
External triggers will call cues by name, but what those cues actually DO is dependent on which stack is currently active. 

## Quick Start
If you are on Windows, you can get started pretty quickly
* grab the prebuilt binaries here: [dist/](../dist) and place them in a folder on your PC
* grab `config-cuestack.json` and `config-voicemeeteragent.json` from here: [example-configs/](example-configs) and place them in the same folder
* edit the `.json` files to suit your needs, Visual Studio Code is highly recommended
* double-click on either `.exe` to launch it; to quit, just close the window

Notes:
* by default, CueStack will look for `config-cuestack.json`, and VoicemeeterAgent will look for `config-voicemeeteragent.json`
* you can change this with the `-c` flag: `CueStack.exe -c myotherconfig.json`
* you can also use `-m` flag to change how much info is printed (`prod` or `dev`): `CueStack.exe -m dev`


## Vocabulary
    
* Cue - a set of commands, called Parts, to execute when a trigger calls this cue by name
* Part - a single command to send
* Cue Stack - a set of cues representing a specific state of the production
* Trigger - an external stimulus calling a cue by name
* Trigger Source = the thing sending a trigger, you can have many of these
* Command - something to trigger, like sending a websocket command to OBS
* Command Target - the thing receiving a command, you can have many of these

## Limitations

* A Cue represents an instantanious situation, it does not include any timing information. All timing should be handled by whatever is receiving the command. This is an intentional design decision, as it allows CueStack to run as fast as possible without any consideration for timing.
* Triggers are opaque; you cannot pass along information with them
* commands are sent to targets one way only; though we may use an API capable of returning data, we make no use of it.


## API
CueStack provides a full API through trigger sources, check out [the documentation](API.md)

## Conceptual Diagram

![Diagram](docs/mindmap.png)

## Configuration
CueStack is configured through a `.json` file, by default `config-cuestack.json`, check out [the documentation](Config.md)