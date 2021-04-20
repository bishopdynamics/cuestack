/*
    CueStackClient Templates

    Copyright (C) 2021 James Bishop (james@bishopdynamics.com)
*/

const CueStackTemplates = {
    trigger_sources: {
        websocket: {
            enabled: true,
            name: "GenericWebsocket",
            type: "websocket",
            config: {
                port: 8081
            }
        },
        http: {
            enabled: true,
            name: "GenericHTTP",
            type: "http",
            config: {
                port: 8080
            }
        },
        mqtt: {
            enabled: true,
            name: "GenericMQTT",
            type: "mqtt",
            config: {
                host: "192.168.1.195",
                port: 1883,
                topic: "CueStackTriggerTopic"
            }
        }
    },
    command_targets: {
        websocket_generic: {
            enabled: true,
            name: "WebsocketTarget",
            type: "websocket_generic",
            config: {
                host: "localhost",
                port: 8001
            }
        },
        http_generic: {
            enabled: true,
            name: "HTTPTarget",
            type: "http_generic",
            config: {
                host: "localhost",
                port: 9090
            }
        },
        mqtt_generic: {
            enabled: true,
            name: "MQTTTarget",
            type: "mqtt_generic",
            config: {
                host: "192.168.1.195",
                port: 1883
            }
        },
        tcp_generic: {
            enabled: true,
            name: "TCPTarget",
            type: "tcp_generic",
            config: {
                host: "localhost",
                port: 8103
            }
        },
        udp_generic: {
            enabled: true,
            name: "UDPTarget",
            type: "udp_generic",
            config: {
                host: "localhost",
                port: 8104
            }
        },
        osc_generic: {
            enabled: true,
            name: "OSCTarget",
            type: "osc_generic",
            config: {
                host: "127.0.0.1",
                port: 7703
            }
        },
        obs_websocket: {
            enabled: true,
            name: "OBSWebsocketTarget",
            type: "obs_websocket",
            config: {
                host: "localhost",
                port: 4444,
                password: "secret"
            }
        }
    },
    cue_parts: {
        websocket_generic_dict: {
            enabled: true,
            target: "WebsocketTarget",
            command: {
                message_type: "dict",
                message: {
                    msg: "hello"
                }
            }
        },
        websocket_generic_basic: {
            enabled: true,
            target: "WebsocketTarget",
            command: {
                message: "hello"
            }
        },
        http_generic_dict: {
            enabled: true,
            target: "HTTPTarget",
            command: {
                message_type: "dict",
                message: {
                    path: "/myendpoint",
                    params: {
                        param1: "foo",
                        param2: "bar"
                    }
                }
            }
        },
        http_generic_basic: {
            enabled: true,
            target: "HTTPTarget",
            command: {
                message: "/myendpoint?param1=foo&param2=bar"
            }
        },
        mqtt_generic_basic: {
            enabled: true,
            target: "MQTTTarget",
            command: {
                topic: "/my/favorite/topic",
                message: "hello"
            }
        },
        mqtt_generic_dict: {
            enabled: true,
            target: "MQTTTarget",
            command: {
                topic: "/my/favorite/topic",
                message_type: "dict",
                message: {
                    msg: "hello"
                }
            }
        },
        tcp_generic_dict: {
            enabled: true,
            target: "TCPTarget",
            command: {
                message_type: "dict",
                message: {
                    msg: "hello"
                }
            }
        },
        tcp_generic_basic: {
            enabled: true,
            target: "TCPTarget",
            command: {
                message: "hello"
            }
        },
        udp_generic_dict: {
            enabled: true,
            target: "UDPTarget",
            command: {
                message_type: "dict",
                message: {
                    msg: "hello"
                }
            }
        },
        udp_generic_basic: {
            enabled: true,
            target: "UDPTarget",
            command: {
                message: "hello"
            }
        },
        osc_generic: {
            enabled: true,
            target: "OSCTarget",
            command: {
                address: "/button/1",
                value: 1
            }
        },
        obs_websocket_scene: {
            enabled: true,
            target: "OBSWebsocketTarget",
            command: {
                request: "SetCurrentScene",
                args: {
                    scene_name: "my_scene_1"
                }
            }
        },
        obs_websocket_sourcefilter: {
            enabled: true,
            target: "OBSWebsocketTarget",
            command: {
                request: "SetSourceFilterVisibility",
                args: {
                    sourceName: "player1",
                    filterName: "expanded",
                    filterEnabled: true
                }
            }
        },
        internal_cue: {
            enabled: true,
            target: "internal",
            command: {
                cue: "myCue"
            }
        },
        internal_stack: {
            enabled: true,
            target: "internal",
            command: {
                stack: "myStack"
            }
        },
        voicemeeter: {
            enabled: true,
            target: "VoicemeeterAgent",
            command: {
                message_type: "dict",
                message: {
                    apply: {
                        "in-0": {
                            gain: 0.0,
                            mute: false,
                            solo: false,
                            mono: false,
                            A1: true,
                            A2: true,
                            A3: true,
                            A4: true,
                            A5: true,
                            B1: false,
                            B2: false,
                            B3: false
                        },
                        "out-0": {
                            gain: 0.0,
                            mute: false
                        }
                    }
                }
            }
        }
    }
}

