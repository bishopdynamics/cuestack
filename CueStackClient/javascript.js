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
    // console.log('ws status: ' + message);
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
        // console.log('sending message: ' + msg)
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
    // console.log('RenderInput(' + input_type + ', ' + value + ')');
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
        } else if (input_type == "config" || input_type == "command") {
            input = document.createElement("div");
            input.style.height = "400px;"
            input.style.border = "0px";
            input_view = document.createElement("table");
            if (input_type == "config") {
                for (const key in value) {
                    sub_input = RenderGeneric(key, value[key])
                    input_view.appendChild(sub_input)
                }
            } else if (input_type == "command") {
                for (const key in value.message) {
                    sub_input = RenderGeneric(key, value.message[key])
                    input_view.appendChild(sub_input)
                }
            }
            
            input_view.style.height = "400px";
            editor_view = document.createElement("pre");
            editor_view.classList.add("input_element")
            if (input_type == "config") {
                editor = new JsonEditor(editor_view, value);
            } else if (input_type == "command") {
                editor = new JsonEditor(editor_view, value.message);
            }
            input_view.style.display = "block";
            editor_view.style.display = "none";
            edit_button = document.createElement("button");
            edit_button.style.display = "block";
            edit_button.innerHTML = "Edit";
            return_button = document.createElement("button");
            return_button.style.display = "none";
            return_button.innerHTML = "Return";
            edit_button.addEventListener('click', function() {
                input_view.style.display = "none";
                editor_view.style.display = "block";
                return_button.style.display = "block";
                edit_button.style.display = "none";
            });
            return_button.addEventListener('click', function() {
                input_view.style.display = "block";
                editor_view.style.display = "none";
                return_button.style.display = "none";
                edit_button.style.display = "block";
            });
            edit_button.style.width = "60px";
            edit_button.style.height = "20px";
            return_button.style.width = "60px";
            return_button.style.height = "20px";
            input.appendChild(edit_button);
            input.appendChild(return_button);
            input.appendChild(input_view);
            input.appendChild(editor_view);

        }
        input.classList.add("input_element");
        let td_input = document.createElement("td");
        td_input.classList.add("input_table_td_input");
        td_input.appendChild(input);
        obj.appendChild(td_input);
        obj.classList.add("input_table_row");
    } catch (e) {
        console.error('exception while RenderInput: ' + e);
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

function RenderGeneric(name, value){
    // this decides input widget based on the literal type of value
    // returns a row containing two elements (each in a td):
    //  a span with camelcase name, to be used as label (class input_label)
    //  an element specific to the input type (class input_element)
    // the row is class input_table_row, the td are class input_table_td_label and input_table_td_input
    // console.log('RenderInput(' + name + ', ' + value + ')');
    let obj = document.createElement("tr");
    try {
        let label_text = camelCase(name);
        let label = document.createElement("span");
        label.classList.add("input_label");
        label.innerHTML = label_text;
        let td_label = document.createElement("td");
        td_label.classList.add("input_table_td_label");
        td_label.appendChild(label);
        obj.appendChild(td_label);
        let td_input = document.createElement("td");
        let input = null;
        if (typeof value == "boolean") {
            input = document.createElement("input");
            input.setAttribute("type", "checkbox");
            input.setAttribute("checked", value);
        } else if (typeof value == "number"){
            input = document.createElement("input");
            input.setAttribute("type", "number");
            input.setAttribute("value", value);
        } else if (typeof value == "string") {
            input = document.createElement("input");
            input.setAttribute("type", "text");
            input.setAttribute("value", value);
        } else if (typeof value == "object") {
            input = document.createElement("table");
            for (const key in value) {
                sub_input = RenderGeneric(key, value[key])
                input.appendChild(sub_input)
            }
            input.style.border = "1px dashed";
        }
        if (typeof value != "object") {
            if (typeof value == "boolean") {
                input.addEventListener("input", function() {
                    console.log('an input changed value to: ' + this.checked);
                    // onchange_callback(this.value);
                });
            } else {
                input.addEventListener("input", function() {
                    console.log('an input changed value to: ' + this.value);
                    // onchange_callback(this.value);
                });
            }
        }
        td_input.appendChild(input);
        obj.appendChild(td_input);
        obj.classList.add("input_table_row");
    } catch (e) {
        logging.error('exception while RenderGeneric: ' + e);
    }
    return obj;
}


function RenderSelect(options, value) {
    // return a selectbox using the given list of options, and a selected value
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
    // console.log('RenderInputObject(' + this_object + ')');
    try {
        in_obj = document.createElement("div");
        in_obj.classList.add("input_object");
        let table = document.createElement("table");
        table.classList.add("table_input");
        for (const ct_key in this_object) {
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

function TestThing(){
    ClickTab("edittargets");
    console.info("running TestThing");
    try {
        
        // let this_object = RenderInputForm_CommandTarget(CueStackTemplates.command_targets.mqtt_generic)
        let this_object = RenderInputForm_CuePart(CueStackTemplates.cue_parts.voicemeeter)
        // let this_object = RenderInputForm_TriggerSource(CueStackTemplates.trigger_sources.mqtt)
        let tab = document.getElementById("tab-edittargets");
        tab.appendChild(this_object);
    } catch (e) {
        console.error("exception in TestThing: " + e);
    }
}

function Setup() {
    console.log('setting up...')
    ClickTab("tester");
    GetStatus();
//    TestThing();
    // setInterval(GetStatus, 4000)
}

document.addEventListener('DOMContentLoaded', function() {
    Setup();
});
