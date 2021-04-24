/* eslint-disable require-jsdoc */
/* eslint-disable max-len */
/*
    CueStackClient

    Copyright (C) 2021 James Bishop (james@bishopdynamics.com)
*/


WEBSOCKET_HOST = 'localhost';
WEBSOCKET_PORT = 8081;

TABS_LIST = ['tester', 'editcues', 'edittargets', 'edittriggers', 'apitester'];

API = new APIManager(WEBSOCKET_HOST, WEBSOCKET_PORT, handleMessage);

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
      API.triggerStack(key, function(message) {
        getStatus();
      });
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
  API.getCues(function(message) {
    createCuesTable(message.response.cues);
  });
}

function getStatus() {
  API.getStacks(function(message) {
    createStacksTable(message.response.stacks);
    API.getCurrentStack(function(message) {
      updateCurrentStack(message.response.currentStack);
    });
  });
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


function testThing() {
  clickTab('edittargets');
  console.info('running testThing');
  try {
    populateTabAPITester();
    // CueStackTemplates.trigger_sources.mqtt
    // CueStackTemplates.command_targets.mqtt_generic
    const thisobj = createFlippableInputForm(CueStackTemplates.command_targets.mqtt_generic);
    const tab = document.getElementById('tab-edittargets');
    tab.appendChild(thisobj);
  } catch (e) {
    console.error('exception in testThing: ' + e);
  }
}

function populateTabAPITester() {
  const tabcontent = document.getElementById('tab-apitester-content');
  const requestoptions = getKeyNames(CueStackAPIRequests);
  const requestselect = renderSelect(requestoptions, null);
  const templateselect = renderSelect([], null);
  const sendbutton = document.createElement('button');
  sendbutton.innerHTML = 'Send';
  sendbutton.addEventListener('click', function() {
    console.log('clicked the send button');
    // TODO read value of editorview
  });
  tabcontent.appendChild(requestselect);
  tabcontent.appendChild(templateselect);
  tabcontent.appendChild(sendbutton);
  requestselect.addEventListener('change', function(event) {
    const selectedoption = event.target.value;
    console.log(selectedoption);
    try {
      const templates = CueStackAPIRequests[selectedoption].templates;
      const templateoptions = getKeyNames(templates);
      const templateselect = renderSelect(templateoptions, null);
      tabcontent.appendChild(templateselect);
      templateselect.addEventListener('change', function(event) {
        const selectedoption = event.target.value;
        console.log(selectedoption);
        try {
          const template = templates[selectedoption];
          const editorview = createFlippableInputForm(template);
          tabcontent.appendChild(editorview);
        } catch (e) {
          console.error('failed to render template: ', e);
        }
      });
    } catch (e) {
      console.error('exception while generating select for this api request ', e);
    }
  });
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
