/*
    CueStackClient

    Copyright (C) 2021 James Bishop (james@bishopdynamics.com)
*/


WEBSOCKET_HOST = "localhost";
WEBSOCKET_PORT = "8081";

WS_OPTIONS = {
    "reconnectInterval": 4000
}

TABS_LIST = ["tester", "managestacks", "editcues", "edittargets", "edittriggers"]

function UpdateWSStatus(message){
    console.log('ws status: ' + message);
    let thing = document.querySelector('#websocket-status');
    thing.innerHTML = JSON.stringify(message, null, 4);
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
    req = {"request": "getCurrentStack"};
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

function ShowTab(tabname) {
    
    document.getElementById("tab-" + tabname).style.display = "block";
}

function HideAllTabs() {
    for (let tabno in TABS_LIST) {
        document.getElementById("tab-" + TABS_LIST[tabno]).style.display = "none";
    }
}

function ClickTab(tabname) {
    console.log('showing tab: ' + tabname);
    HideAllTabs();
    ShowTab(tabname);
}

function camelCase(str) {
    return str.replace(/(\w)(\w*)/g,
        function(g0,g1,g2){return g1.toUpperCase() + g2.toLowerCase();});
}

function RenderInput(input_type, value, form_type){
    // returns a row containing two elements (each in a td):
    //  a span with camelcase input_type, to be used as label (class input_label)
    //  an element specific to the input type (class input_element)
    // the row is class input_table_row, the td are class input_table_td_label and input_table_td_input
    console.log('RenderInput(' + input_type + ', ' + value + ')');
    let obj = document.createElement("tr");
    try {
        let label_text = camelCase(input_type);
        let label = document.createElement("span");
        label.classList.add("input_label");
        label.innerHTML = label_text;
        let td_label = document.createElement("td");
        td_label.classList.add("input_table_td_label");
        td_label.appendChild(label);
        obj.appendChild(td_label);
        let input = null;
        if (input_type == "enabled") {
            input = document.createElement("input");
            input.setAttribute("type", "checkbox");
            input.setAttribute("checked", value);
        } else if (input_type == "name" || input_type == "target") {
            input = document.createElement("input");
            input.setAttribute("type", "text");
            input.setAttribute("value", value);
        } else if (input_type == "type") {
            input = RenderSelect(GetOptions(form_type), value);
        } else if (input_type == "config") {
            input = document.createElement("pre");
            try {
                editor = new JsonEditor(input, value);
            } catch (e) {
                console.error('exception while creating editor: ' + e);
            }
        } else if (input_type == "command") {
            if (value.message_type == "dict"){
                input = document.createElement("pre");
                try {
                    editor = new JsonEditor(input, value.message);
                } catch (e) {
                    console.error('exception while creating editor: ' + e);
                }
            } else {
                input = document.createElement("textarea");
                input.value = value;
            }
        }
        input.classList.add("input_element");
        let td_input = document.createElement("td");
        td_input.classList.add("input_table_td_input");
        td_input.appendChild(input);
        obj.appendChild(td_input);
        obj.classList.add("input_table_row");
    } catch (e) {
        logging.error('exception while RenderInput: ' + e);
    }
    return obj;
}

function GetOptions(this_object){
    // returns an array of strings, corresponding to the first level key names in given object
    let options = []
    for (const key in this_object) {
        options.push(key);
    }
    return options;
}

function RenderSelect(options, value) {
    let select = document.createElement("select");
    for (var i = 0; i < options.length; i++){
        let option = document.createElement("option");
        option.value = options[i];
        option.text = options[i];  // TODO this could be stylized here
        select.appendChild(option);
    }
    try {
        select.value = value;
    } catch (e) {
        console.error('selected value: ' + value + ' was not found');
    }
    return select;
}

function RenderInputObject(this_object, form_type){
    // return a div containing all the input fields for keys in this_object
    console.log('RenderInputObject(' + this_object + ')');
    try {
        in_obj = document.createElement("div");
        in_obj.classList.add("input_object");
        let table = document.createElement("table");
        table.classList.add("table_input");
        for (const ct_key in this_object) {
            console.log('creating input');
            try {
                table.appendChild(RenderInput(ct_key, this_object[ct_key], form_type));
            } catch (e) {
                console.error('exception while adding a row to table: ' + e);
            }
        }
        in_obj.appendChild(table);
    } catch (e) {
        console.error('exception while RenderInputObject: ' + e);
        in_obj = null;
    }
    return in_obj;
}

function RenderInputForm_CommandTarget(command_target){
    let form_type = CueStackTemplates.command_targets;
    let this_object = RenderInputObject(command_target, form_type);
    return this_object;
}

function RenderInputForm_TriggerSource(trigger_source){
    let form_type = CueStackTemplates.trigger_sources;
    let this_object = RenderInputObject(trigger_source, form_type);
    return this_object;
}

function RenderInputForm_CuePart(cue_part){
    let form_type = CueStackTemplates.cue_parts;
    let this_object = RenderInputObject(cue_part, form_type);
    return this_object;
}

function testthing(){
    ClickTab("edittargets");
    try {
        console.info("testthing");
        let this_object = RenderInputForm_CommandTarget(CueStackTemplates.command_targets.tcp_generic)
        // let this_object = RenderInputForm_CuePart(CueStackTemplates.cue_parts.voicemeeter)
        // let this_object = RenderInputForm_TriggerSource(CueStackTemplates.trigger_sources.websocket)
        let tab = document.getElementById("tab-edittargets");
        tab.appendChild(this_object);
    } catch (e) {
        console.error("exception in testthing: " + e);
    }
}

function Setup() {
    console.log('setting up...')
    ClickTab("tester");
    GetStatus();
    testthing();
    // setInterval(GetStatus, 4000)
}

document.addEventListener('DOMContentLoaded', function() {
    Setup();
});
