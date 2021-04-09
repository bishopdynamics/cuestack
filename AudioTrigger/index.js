const http = require('http');
const express = require('express');
const socketIo = require('socket.io');
const WebSocket = require('ws');
const { send } = require('process');
const fs = require('fs');
const ReconnectingWebSocket = require('reconnecting-websocket')



/*
    Below are configuration variables, to be customized to suit your needs
*/

const active_state = 'active'; // name of the filter to activate when they are talking
const inactive_state = 'inactive'; // name of filter when not talking
const quiet_time = 4000; // milliseconds, how long input is quiet before switching to inactive state
const interval_period = 150; // milliseconds, how often to run the changeScene function
const websocket_host = 'localhost' // address of machine running CueStack service
const websocket_port = 8081; // port for CueStack service
const webserver_port = 3000; // port to serve the http gui

/*
    End configuration variables, do not edit below here
*/

function ws_onopen() {
    console.info('connected to CueStack websocket');
}

function ws_onclose(){
    console.info('websocket connection closed, will retry')
}

const ws_options = {
    WebSocket: WebSocket, // custom WebSocket constructor
    connectionTimeout: 1000,
    maxRetries: Infinity,
};

const ws = new ReconnectingWebSocket('ws://' + websocket_host + ':' + websocket_port, [], ws_options);
ws.addEventListener('open', ws_onopen);
ws.addEventListener('close', ws_onclose);

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static('./public'));

sources = {}

// this tracks how many milliseconds since the indicated source went quiet, aka dropped below the threshold for activation/expansion
state_tracker_quiet = {};

// track current state of source, so we dont have to keep sending signals all the time flooding the ws connection
state_tracker_state = {};


function setValues(val) {
    sources[val.id] = val;
}

function sendCueStackMessage(cue_name) {
    ws.send('{"cue": "' + cue_name + '"}');
}

function setActive(scene_name) {
    // send active state signal
    if (!(scene_name in state_tracker_state)) {
        // no state info, lets default it to inactive and then do nothing
        state_tracker_state[scene_name] = 'inactive';
    } else {
        if (state_tracker_state[scene_name] == 'inactive'){
            sendCueStackMessage(scene_name + '_' + active_state);
            state_tracker_quiet[scene_name] = 0;
            state_tracker_state[scene_name] = 'active';
        }
    }
    
}

function setQuiet(scene_name) {
    // Quiet, but not neccesarily inactive yet
    if (state_tracker_quiet[scene_name] > quiet_time) {
        setInactive(scene_name);
    } else {
        var prior_quiet_value = state_tracker_quiet[scene_name];
        state_tracker_quiet[scene_name] = prior_quiet_value + interval_period;
    }
}

function setInactive(scene_name) {
    // send inactive state signal
    if (!(scene_name in state_tracker_state)) {
        // no state info, lets default it to inactive and then do nothing
        state_tracker_state[scene_name] = 'inactive';
    } else {
        if (state_tracker_state[scene_name] == 'active'){
            sendCueStackMessage(scene_name + '_' + inactive_state);
            state_tracker_quiet[scene_name] = 0;
            state_tracker_state[scene_name] = 'inactive';
        }
    }
}

function changeScene() {
    if (Object.keys(sources).length > 0){
        for (const [id, data] of Object.entries(sources)) {
            if (data.volume > parseInt(data.limit)){
                setActive(data.scene);
            } else {
                setQuiet(data.scene);
            }
        }
    }
}

function getVersion() {
    // try to build a version string from VERSION and BUILD files, falling back on "development" if not found
    let this_version = null
    let this_commit = null
    fs.readFile('VERSION', 'utf8', (err, data) => {
        if (err) {
            console.log('AudioTrigger development is starting...');
        } else {
            this_version = data.replace(/\r?\n|\r/g, " ");
            fs.readFile('BUILD', 'utf8', (err, data) => {
                if (err) {
                    console.log('AudioTrigger development is starting...');
                } else {
                    this_commit = data.replace(/\r?\n|\r/g, " ");
                    console.log('AudioTrigger ' + this_version + '-' + this_commit + ' is starting...');
                }
            });
        }
    });
}

/* This is where execution begins */

getVersion();

io.on('connection', (socket) => {
    socket.on('audioInput', (body) => {
        setValues({ 'volume': parseInt(body.volume), 'id': body.id, 'scene': body.scene, 'limit': parseInt(body.limit)})
        //console.log({ 'volume': parseInt(body.volume), 'id': body.id, 'scene': body.scene, 'limit': parseInt(body.limit)})
    });
});

setInterval(() => {
    try {
        changeScene();
    } catch (e) {
        console.warn('changeScene threw an exception: ' + e);
        console.info('sources: ' + JSON.stringify(sources))
    }
}, interval_period);

/* TODO this doesnt actually solve the problem, but it does make it so that this will continue to work on newer
    versions of node, where unhandledRejections will cause node to exit
    it also has the benefit of providing more useful error when a rejection happens
*/
process.on('unhandledRejection', (reason, p) => {
    console.log('Unhandled Rejection at: ', p, 'reason:', reason.stack);
    // application specific logging, throwing an error, or other logic here
  });

server.listen(webserver_port, () => {
    console.log('OBS Audio Switch webui is now running on port ' + webserver_port)
    console.log('')
});
