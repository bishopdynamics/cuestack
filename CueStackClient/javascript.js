
WEBSOCKET_HOST = "localhost";
WEBSOCKET_PORT = "8081";

WS_OPTIONS = {
    "reconnectInterval": 4000
}

function UpdateWSStatus(message){
    console.log('ws status: ' + message);
    let thing = document.querySelector('#websocket-status');
    thing.innerHTML = message;
}

function HandleMessage(message) {
    if ("status" in message){
        if(message.status == "OK"){
            if ("response" in message) {
                // this is a response to the last request
                if ("cues" in message.response) {
                    CreateCuesTable(message.response.cues);
                }
                if ("stacks" in message.response) {
                    CreateStacksTable(message.response.stacks);
                }
                if ("currentStack" in message.response) {
                    UpdateCurrentStack(message.response.currentStack);
                }
            }
            // dont particularly care about status:OK message without response
        } else {
            console.error('api error: status: ' + message.status);
        }
    } else {
        console.error('api error: bad message format');
    }
}

function CreateCuesTable(data){
    let table = document.querySelector('#cues-table');
    ClearTable(table);
    for (let key of data) {
        let row = table.insertRow();
        let td = document.createElement("td");
        let button = document.createElement("button");
        td.appendChild(button);
        row.appendChild(td);
        button.innerHTML = 'Cue: ' + key;
        button.addEventListener('click', function() {
            TriggerCue(key);
        })
    }
}

function CreateStacksTable(data){
    let table = document.querySelector('#stacks-table');
    ClearTable(table);
    for (let key of data) {
        let row = table.insertRow();
        let td = document.createElement("td");
        let button = document.createElement("button");
        td.appendChild(button);
        row.appendChild(td);
        button.innerHTML = 'Stack: ' + key;
        button.addEventListener('click', function() {
            TriggerStack(key);
            UpdateCurrentStack(key);
            RequestStacks();
            RequestCues();
        })
    }
}

function ClearTable(table){
    for(var i = table.rows.length -1; i > -1; i--)
    {
        table.deleteRow(i);
    }
}

function UpdateCurrentStack(data) {
    let thing = document.querySelector('#current-stack');
    thing.innerHTML = 'Current Stack: ' + data;
    RequestCues();
}

function RequestCues() {
    req = {"request": "getCues"};
    SendMessage(req);
}

function RequestStacks() {
    req = {"request": "getStacks"};
    SendMessage(req);
}

function RequestCurrentStack() {
    req = {"request": "currentStack"};
    SendMessage(req);
}

function TriggerCue(cuename) {
    req = {"cue": cuename};
    SendMessage(req);
}

function TriggerStack(stackname) {
    req = {"stack": stackname}
    SendMessage(req);
}

function SendMessage(message) {
    // we open a fresh websocket connection for every message, which will auto-close after 200ms
    let msg = JSON.stringify(message);
    let client = new WebSocket("ws://" + WEBSOCKET_HOST + ":" + WEBSOCKET_PORT)
    client.onopen = function(event){
        console.log('sending message: ' + msg)
        client.send(msg);
        setTimeout(function(){
            client.close()
        }, 200)
    }
    client.onmessage = function(event){
        UpdateWSStatus('received message: ' + event.data);
        try {
            parsed_message = JSON.parse(event.data);
            HandleMessage(parsed_message);
        } catch (e) {
            UpdateWSStatus("exception while parsing message: " + e);
        }
    }
    client.onerror = function(event) {
        UpdateWSStatus(event.message);
        CloseWebsocket(this);
    }
}

function GetStatus() {
    RequestCurrentStack();
    RequestStacks();
    RequestCues();
}


function Setup() {
    console.log('setting up...')
    GetStatus();
    // setInterval(GetStatus, 4000)
}

document.addEventListener('DOMContentLoaded', function() {
    Setup();
});
