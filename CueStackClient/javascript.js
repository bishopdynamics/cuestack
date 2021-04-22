/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
/*
    CueStackClient

    Copyright (C) 2021 James Bishop (james@bishopdynamics.com)
*/


WEBSOCKET_HOST = 'localhost';
WEBSOCKET_PORT = 8081;

WS_OPTIONS = {
  'reconnectInterval': 4000,
};

TABS_LIST = ['tester', 'managestacks', 'editcues', 'edittargets', 'edittriggers'];

function UpdateWSStatus(message) {
  // console.log('ws status: ' + message);
  const thing = document.querySelector('#websocket-status');
  thing.innerHTML = JSON.stringify(message, null, 4);
}

function HandleMessage(message) {
  if ('status' in message) {
    if (message.status == 'OK') {
      if ('response' in message) {
        // this is a response to the last request
        if ('cues' in message.response) {
          CreateCuesTable(message.response.cues);
        }
        if ('stacks' in message.response) {
          CreateStacksTable(message.response.stacks);
        }
        if ('currentStack' in message.response) {
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

function CreateCuesTable(data) {
  const table = document.querySelector('#cues-table');
  ClearTable(table);
  for (const key of data) {
    const row = table.insertRow();
    const td = document.createElement('td');
    const button = document.createElement('button');
    td.appendChild(button);
    row.appendChild(td);
    button.innerHTML = 'Cue: ' + key;
    button.addEventListener('click', function() {
      TriggerCue(key);
    });
  }
}

function CreateStacksTable(data) {
  const table = document.querySelector('#stacks-table');
  ClearTable(table);
  for (const key of data) {
    const row = table.insertRow();
    const td = document.createElement('td');
    const button = document.createElement('button');
    td.appendChild(button);
    row.appendChild(td);
    button.innerHTML = 'Stack: ' + key;
    button.addEventListener('click', function() {
      TriggerStack(key);
      UpdateCurrentStack(key);
      RequestStacks();
      RequestCues();
    });
  }
}

function ClearTable(table) {
  for (let i = table.rows.length -1; i > -1; i--) {
    table.deleteRow(i);
  }
}

function UpdateCurrentStack(data) {
  const thing = document.querySelector('#current-stack');
  thing.innerHTML = 'Current Stack: ' + data;
  RequestCues();
}

function RequestCues() {
  const req = {'request': 'getCues'};
  SendMessage(req);
}

function RequestStacks() {
  const req = {'request': 'getStacks'};
  SendMessage(req);
}

function RequestCurrentStack() {
  const req = {'request': 'getCurrentStack'};
  SendMessage(req);
}

function TriggerCue(cuename) {
  const req = {'cue': cuename};
  SendMessage(req);
}

function TriggerStack(stackname) {
  const req = {'stack': stackname};
  SendMessage(req);
}

function SendMessage(message) {
  // we open a fresh websocket connection for every message, which will auto-close after 200ms
  const msg = JSON.stringify(message);
  const client = new WebSocket('ws://' + WEBSOCKET_HOST + ':' + WEBSOCKET_PORT);
  client.onopen = function(event) {
    // console.log('sending message: ' + msg)
    client.send(msg);
    setTimeout(function() {
      client.close();
    }, 200);
  };
  client.onmessage = function(event) {
    UpdateWSStatus('received message: ' + event.data);
    try {
      parsed_message = JSON.parse(event.data);
      HandleMessage(parsed_message);
    } catch (e) {
      UpdateWSStatus('exception while parsing message: ' + e);
    }
  };
  client.onerror = function(event) {
    UpdateWSStatus(event.message);
  };
}

function GetStatus() {
  RequestCurrentStack();
  RequestStacks();
  RequestCues();
}

function ShowTab(tabname) {
  document.getElementById('tab-' + tabname).style.display = 'block';
}

function HideAllTabs() {
  for (const name in TABS_LIST) {
    if (Object.prototype.hasOwnProperty.call(TABS_LIST, name)) {
      document.getElementById('tab-' + TABS_LIST[name]).style.display = 'none';
    }
  }
}

function ClickTab(tabname) {
  HideAllTabs();
  ShowTab(tabname);
}

function camelCase(str) {
  return str.replace(/(\w)(\w*)/g,
      function(g0, g1, g2) {
        return g1.toUpperCase() + g2.toLowerCase();
      });
}

function RenderInput(inputtype, value, formtype) {
  // returns a row containing two elements (each in a td):
  //  a span with camelcase inputtype, to be used as label (class input_label)
  //  an element specific to the input type (class input_element)
  // the row is class input_table_row, the td are class input_table_td_label and input_table_td_input
  // console.log('RenderInput(' + inputtype + ', ' + value + ')');
  const obj = document.createElement('tr');
  try {
    const labeltext = camelCase(inputtype);
    const label = document.createElement('span');
    label.classList.add('input_label');
    label.innerHTML = labeltext;
    const tdlabel = document.createElement('td');
    tdlabel.classList.add('input_table_td_label');
    tdlabel.appendChild(label);
    obj.appendChild(tdlabel);
    let input = null;
    if (inputtype == 'enabled') {
      input = document.createElement('input');
      input.setAttribute('type', 'checkbox');
      input.setAttribute('checked', value);
    } else if (inputtype == 'name' || inputtype == 'target') {
      input = document.createElement('input');
      input.setAttribute('type', 'text');
      input.setAttribute('value', value);
    } else if (inputtype == 'type') {
      input = RenderSelect(GetKeyNames(formtype), value);
    } else if (inputtype == 'config' || inputtype == 'command') {
      input = document.createElement('div');
      input.style.height = '400px;';
      input.style.border = '0px';
      inputview = document.createElement('table');
      if (inputtype == 'config') {
        for (const key in value) {
          if (Object.prototype.hasOwnProperty.call(value, key)) {
            const subinput = RenderGeneric(key, value[key]);
            inputview.appendChild(subinput);
          }
        }
      } else if (inputtype == 'command') {
        for (const key in value.message) {
          if (Object.prototype.hasOwnProperty.call(value.message, key)) {
            const subinput = RenderGeneric(key, value.message[key]);
            inputview.appendChild(subinput);
          }
        }
      }
      inputview.style.height = '400px';
      const editorview = document.createElement('pre');
      editorview.classList.add('input_element');
      if (inputtype == 'config') {
        editor = new JsonEditor(editorview, value);
      } else if (inputtype == 'command') {
        editor = new JsonEditor(editorview, value.message);
      }
      inputview.style.display = 'block';
      editorview.style.display = 'none';
      const editbutton = document.createElement('button');
      editbutton.style.display = 'block';
      editbutton.innerHTML = 'Edit';
      returnbutton = document.createElement('button');
      returnbutton.style.display = 'none';
      returnbutton.innerHTML = 'Return';
      editbutton.addEventListener('click', function() {
        inputview.style.display = 'none';
        editorview.style.display = 'block';
        returnbutton.style.display = 'block';
        editbutton.style.display = 'none';
      });
      returnbutton.addEventListener('click', function() {
        inputview.style.display = 'block';
        editorview.style.display = 'none';
        returnbutton.style.display = 'none';
        editbutton.style.display = 'block';
      });
      editbutton.style.width = '60px';
      editbutton.style.height = '20px';
      returnbutton.style.width = '60px';
      returnbutton.style.height = '20px';
      input.appendChild(editbutton);
      input.appendChild(returnbutton);
      input.appendChild(inputview);
      input.appendChild(editorview);
    }
    input.classList.add('input_element');
    const tdinput = document.createElement('td');
    tdinput.classList.add('input_table_td_input');
    tdinput.appendChild(input);
    obj.appendChild(tdinput);
    obj.classList.add('input_table_row');
  } catch (e) {
    console.error('exception while RenderInput: ' + e);
  }
  return obj;
}
/**
 * returns an array of strings, corresponding to the first level key names in given object
 * @param  {object} thisobject
 * @return {Array} an array of key names
 */
function GetKeyNames(thisobject) {
  // returns an array of strings, corresponding to the first level key names in given object
  const options = [];
  for (const key in thisobject) {
    if (Object.prototype.hasOwnProperty.call(thisobject, key)) {
      options.push(key);
    }
  }
  return options;
}

/**
 * create a span to be used as a label, with text Camelcase
 * class is form-node-label
 * @param  {text} name
 * @return {Element} a span element
 */
function CreateLabel(name) {
  const labeltext = camelCase(name);
  const label = document.createElement('span');
  label.classList.add('form-node-label');
  label.innerHTML = labeltext;
  return label;
}

/**
 * create a checkbox with the given value
 * class is form-node-input
 * @param  {boolean} value
 * @return {Element} a checkbox element
 */
function CreateCheckbox(value) {
  const input = document.createElement('input');
  input.setAttribute('type', 'checkbox');
  input.setAttribute('checked', value);
  input.classList.add('form-node-input');
  return input;
}

/**
 * create a number input with the given value
 * class is form-node-input
 * @param  {number} value
 * @return {Element} a number input element
 */
function CreateNumberInput(value) {
  const input = document.createElement('input');
  input.setAttribute('type', 'number');
  input.setAttribute('value', value);
  input.classList.add('form-node-input');
  return input;
}

/**
 * create a text input with the given value
 * class is form-node-input
 * @param  {string} value
 * @return {Element} a text input element
 */
function CreateTextInput(value) {
  const input = document.createElement('input');
  input.setAttribute('type', 'text');
  input.setAttribute('value', value);
  input.classList.add('form-node-input');
  return input;
}

/**
 * create a table row with two divs, containing name and an input element matching the type of value
 * @param  {string} name
 * @param  {any} value
 * @return {Element} a table row
 */
function RenderGeneric(name, value) {
  // this decides input widget based on the literal type of value
  // returns a tr containing two elements (each in a td):
  //   a span with camelcase name, to be used as label (class input_label)
  //   an element specific to the input type (class input_element)
  // the row is class input_table_row, the td are class input_table_td_label and input_table_td_input
  // console.log('RenderInput(' + name + ', ' + value + ')');
  const obj = document.createElement('tr');
  try {
    const label = CreateLabel(name);
    const tdlabel = document.createElement('td');
    tdlabel.classList.add('input_table_td_label');
    tdlabel.appendChild(label);
    obj.appendChild(tdlabel);
    const tdinput = document.createElement('td');
    let input = null;
    if (typeof value == 'boolean') {
      input = CreateCheckbox(value);
    } else if (typeof value == 'number') {
      input = CreateNumberInput(value);
    } else if (typeof value == 'string') {
      input = CreateTextInput(value);
    } else if (typeof value == 'object') {
      input = document.createElement('table');
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          const subinput = RenderGeneric(key, value[key]);
          input.appendChild(subinput);
        }
      }
      input.style.border = '1px dashed';
    }
    tdinput.appendChild(input);
    obj.appendChild(tdinput);
    obj.classList.add('input_table_row');
  } catch (e) {
    logging.error('exception while RenderGeneric: ' + e);
  }
  return obj;
}


function RenderSelect(options, value) {
  // return a selectbox using the given list of options, and a selected value
  const select = document.createElement('select');
  for (let i = 0; i < options.length; i++) {
    const option = document.createElement('option');
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

function RenderInputObject(thisobject, formtype) {
  // return a div containing all the input fields for keys in thisobject
  // console.log('RenderInputObject(' + thisobject + ')');
  try {
    inputobject = document.createElement('div');
    inputobject.classList.add('input_object');
    const table = document.createElement('table');
    table.classList.add('table_input');
    for (const key in thisobject) {
      if (Object.prototype.hasOwnProperty.call(thisobject, key)) {
        try {
          table.appendChild(RenderInput(key, thisobject[key], formtype));
        } catch (e) {
          console.error('exception while adding a row to table: ' + e);
        }
      }
    }
    inputobject.appendChild(table);
  } catch (e) {
    console.error('exception while RenderInputObject: ' + e);
    inputobject = null;
  }
  return inputobject;
}

function RenderInputForm_CommandTarget(command_target) {
  const formtype = CueStackTemplates.command_targets;
  const thisobject = RenderInputObject(command_target, formtype);
  return thisobject;
}

function RenderInputForm_TriggerSource(trigger_source) {
  const formtype = CueStackTemplates.trigger_sources;
  const thisobject = RenderInputObject(trigger_source, formtype);
  return thisobject;
}

function RenderInputForm_CuePart(cue_part) {
  const formtype = CueStackTemplates.cue_parts;
  const thisobject = RenderInputObject(cue_part, formtype);
  return thisobject;
}

function TestThing() {
  ClickTab('edittargets');
  console.info('running TestThing');
  try {
    // let this_object = RenderInputForm_CommandTarget(CueStackTemplates.command_targets.mqtt_generic)
    const thisobject = RenderInputForm_CuePart(CueStackTemplates.cue_parts.voicemeeter);
    // let this_object = RenderInputForm_TriggerSource(CueStackTemplates.trigger_sources.mqtt)
    const tab = document.getElementById('tab-edittargets');
    tab.appendChild(thisobject);
  } catch (e) {
    console.error('exception in TestThing: ' + e);
  }
}

function Setup() {
  console.log('setting up...')
  ClickTab('tester');
  GetStatus();
  TestThing();
  // setInterval(GetStatus, 4000)
}

document.addEventListener('DOMContentLoaded', function() {
  Setup();
});
