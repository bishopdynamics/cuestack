/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
/*
    CueStackClient

    Copyright (C) 2021 James Bishop (james@bishopdynamics.com)
*/


WEBSOCKET_HOST = 'localhost';
WEBSOCKET_PORT = 8081;

TABS_LIST = ['tester', 'managestacks', 'editcues', 'edittargets', 'edittriggers'];

function handleMessage(message) {
  if ('status' in message) {
    if (message.status == 'OK') {
      if ('response' in message) {
        // this is a response to the last request
        if ('cues' in message.response) {
          createCuesTable(message.response.cues);
        }
        if ('stacks' in message.response) {
          createStacksTable(message.response.stacks);
        }
        if ('currentStack' in message.response) {
          updateCurrentStack(message.response.currentStack);
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

API = new APIManager(WEBSOCKET_HOST, WEBSOCKET_PORT, handleMessage);

function createCuesTable(data) {
  const table = document.querySelector('#cues-table');
  clearTable(table);
  for (const key of data) {
    const row = table.insertRow();
    const td = document.createElement('td');
    const button = document.createElement('button');
    td.appendChild(button);
    row.appendChild(td);
    button.innerHTML = 'Cue: ' + key;
    button.addEventListener('click', function() {
      API.triggerCue(key);
    });
  }
}

function createStacksTable(data) {
  const table = document.querySelector('#stacks-table');
  clearTable(table);
  for (const key of data) {
    const row = table.insertRow();
    const td = document.createElement('td');
    const button = document.createElement('button');
    td.appendChild(button);
    row.appendChild(td);
    button.innerHTML = 'Stack: ' + key;
    button.addEventListener('click', function() {
      API.triggerStack(key);
      updateCurrentStack(key);
      API.getStacks();
      API.getCues();
    });
  }
}

function clearTable(table) {
  for (let i = table.rows.length -1; i > -1; i--) {
    table.deleteRow(i);
  }
}

function updateCurrentStack(data) {
  const thing = document.querySelector('#current-stack');
  thing.innerHTML = 'Current Stack: ' + data;
  API.getCues();
}

function getStatus() {
  API.getCurrentStack();
  API.getStacks();
  API.getCues();
}

function showTab(tabname) {
  document.getElementById('tab-' + tabname).style.display = 'block';
}

function hideAllTabs() {
  for (const name in TABS_LIST) {
    if (Object.prototype.hasOwnProperty.call(TABS_LIST, name)) {
      document.getElementById('tab-' + TABS_LIST[name]).style.display = 'none';
    }
  }
}

function clickTab(tabname) {
  hideAllTabs();
  showTab(tabname);
}

/**
 * create a form that can be flipped to a json editor
 * @param  {any} value
 * @return {Element}
 */
function createFlippableInputForm(value) {
  const input = document.createElement('div');
  const inputview = document.createElement('table');
  const editorview = document.createElement('pre'); // editor docs say use a pre
  const editbutton = document.createElement('button');
  const returnbutton = document.createElement('button');
  for (const key in value) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      const subinput = renderGeneric(key, value[key]);
      inputview.appendChild(subinput);
    }
  }
  editorview.classList.add('form-node-input');
  editor = new JsonEditor(editorview, value);
  inputview.style.display = 'block';
  editorview.style.display = 'none';
  editbutton.style.display = 'block';
  editbutton.innerHTML = 'Edit';
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
  return input;
}

function testThing() {
  clickTab('edittargets');
  console.info('running testThing');
  try {
    // CueStackTemplates.trigger_sources.mqtt
    // CueStackTemplates.command_targets.mqtt_generic
    const thisobject = createFlippableInputForm(CueStackTemplates.cue_parts.voicemeeter);
    const tab = document.getElementById('tab-edittargets');
    tab.appendChild(thisobject);
  } catch (e) {
    console.error('exception in testThing: ' + e);
  }
}

function setupEverything() {
  console.log('setting up...');
  clickTab('tester');
  getStatus();
  testThing();
  // setInterval(getStatus, 4000)
}

document.addEventListener('DOMContentLoaded', function() {
  setupEverything();
});
