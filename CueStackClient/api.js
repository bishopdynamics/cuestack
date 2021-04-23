/* eslint-disable max-len */
/*
    CueStackClient API Manager

    Copyright (C) 2021 James Bishop (james@bishopdynamics.com)
*/


// eslint-disable-next-line require-jsdoc, no-unused-vars
class APIManager {
  /**
   * @param  {string} host
   * @param  {number} port
   */
  constructor(host, port) {
    this.host = host;
    this.port = port;
    this.callback_list = {};
  }

  /**
   * @param  {object} message
   * @param  {Function} callback
   * @return {boolean} success
   */
  sendMessage(message, callback) {
    // we open a fresh websocket connection for every message, which will auto-close after 200ms
    const requestid = uuid4();
    message['request_id'] = requestid; // attach a request_id to every message sent
    const msg = JSON.stringify(message);
    this.callback_list[requestid] = {};
    this.callback_list[requestid]['callback'] = callback;
    this.callback_list[requestid]['request'] = msg;
    const client = new WebSocket('ws://' + this.host + ':' + this.port);
    client.callback_list = this.callback_list;
    client.onopen = function(event) {
      // console.log('sending message: ' + msg)
      client.send(msg);
      setTimeout(function() {
        client.close();
      }, 500);
    };
    client.handleResponse = this.handleResponse; // attach the handleResponse method directly to the client
    client.onmessage = function(event) {
      const rmessage = event.data;
      // console.info('received message: ' + rmessage);
      try {
        const message = JSON.parse(rmessage);
        if ('request_id' in message) {
          const requestid = message.request_id;
          if (requestid in this.callback_list) {
            // console.info('received a response to a request, calling callback');
            try {
              const thiscallback = this.callback_list[requestid]['callback'];
              if (thiscallback !== undefined) {
                thiscallback(message);
              }
              // else {
              //   console.log('received a response for message sent without callback: ', message);
              // }
            } catch (e) {
              console.error('exception while calling callback for request response: ', e);
            }
            delete(this.callback_list[requestid]);
          }
        }
      } catch (e) {
        console.error('exception while onmessage: ', e);
      }
      client.close(); // we always close the client, as all sent messages warrant only a single response
    };
    client.onerror = function(event) {
      console.error('error in websocket: ' + event.message);
    };
    return true;
  }

  /* trigger endpoints require only what they're triggering, and a callback is optional if you dont care about the result
      these are the exact same endpoints hit by all external triggers
  */

  /**
   * trigger a cue
   * @param  {string} cuename
   * @param  {Function} callback
   */
  triggerCue(cuename, callback) {
    const req = {'cue': cuename};
    this.sendMessage(req, callback);
  }

  /**
   * trigger a stack change
   * @param  {text} stackname
   * @param  {Function} callback
   */
  triggerStack(stackname, callback) {
    const req = {'stack': stackname};
    this.sendMessage(req, callback);
  }

  /* get endpoints require no additional data, just a callback
      these endpoints are indended for populating lists with names, they are NOT intended to return actual objects requested, only their names
  */

  /**
   * get a list of cuenames
   * @param  {Function} callback
   */
  getCues(callback) {
    const req = {'request': 'getCues'};
    this.sendMessage(req, callback);
  }

  /**
   * get a list of stack names
   * @param  {Function} callback
   */
  getStacks(callback) {
    const req = {'request': 'getStacks'};
    this.sendMessage(req, callback);
  }

  /**
   * get the name of the currently active stack
   * @param  {Function} callback
   */
  getCurrentStack(callback) {
    const req = {'request': 'getCurrentStack'};
    this.sendMessage(req, callback);
  }

  /**
   * @param  {Function} callback
   */
  getTriggerSources(callback) {
    const req = {'request': 'getTriggerSources'};
    this.sendMessage(req, callback);
  }

  /**
   * @param  {Function} callback
   */
  getCommandTargets(callback) {
    const req = {'request': 'getCommandTargets'};
    this.sendMessage(req, callback);
  }

  /* add and set endpoints require request_payload, and the callback is technically optional, but you should always check for success
      this is the meat of the API, allowing you to change config
  */

  /**
   * Add a new command target
   * @param  {object} payload
   * @param  {Function} callback
   */
  addCommandTarget(payload, callback) {
    const req = {'request': 'addCommandTarget', 'request_payload': payload};
    this.sendMessage(req, callback);
  }

  /**
   * Add a new trigger source
   * @param  {object} payload
   * @param  {Function} callback
   */
  addTriggerSource(payload, callback) {
    const req = {'request': 'addTriggerSource', 'request_payload': payload};
    this.sendMessage(req, callback);
  }

  /**
   * Add a new cue, optionally copying from another
   * @param  {object} payload
   * @param  {Function} callback
   */
  addCue(payload, callback) {
    const req = {'request': 'addCue', 'request_payload': payload};
    this.sendMessage(req, callback);
  }

  /**
   * Delete a given cue from the given stack
   * @param  {object} payload
   * @param  {Function} callback
   */
  deleteCue(payload, callback) {
    const req = {'request': 'deleteCue', 'request_payload': payload};
    this.sendMessage(req, callback);
  }

  /**
   * Add a new (empty) stack
   * @param  {object} payload
   * @param  {Function} callback
   */
  addStack(payload, callback) {
    const req = {'request': 'addStack', 'request_payload': payload};
    this.sendMessage(req, callback);
  }

  /**
   * Rename a stack
   * @param  {object} payload
   * @param  {Function} callback
   */
  renameStack(payload, callback) {
    const req = {'request': 'renameStack', 'request_payload': payload};
    this.sendMessage(req, callback);
  }

  /**
   * Delete a stack (and all its cues)
   * @param  {object} payload
   * @param  {Function} callback
   */
  deleteStack(payload, callback) {
    const req = {'request': 'deleteStack', 'request_payload': payload};
    this.sendMessage(req, callback);
  }

  /**
   * Set the default stack to be loaded when CueStack starts
   * @param  {object} payload
   * @param  {Function} callback
   */
  setDefaultStack(payload, callback) {
    const req = {'request': 'setDefaultStack', 'request_payload': payload};
    this.sendMessage(req, callback);
  }

  /**
   * Enable or Disable cue, part, target, or trigger
   * @param  {object} payload
   * @param  {Function} callback
   */
  setEnabled(payload, callback) {
    const req = {'request': 'setEnabled', 'request_payload': payload};
    this.sendMessage(req, callback);
  }

  /**
   * send a raw cue part to be executed immediately
   * @param  {object} payload
   * @param  {Function} callback
   */
  command(payload, callback) {
    const req = {'request': 'command', 'request_payload': payload};
    this.sendMessage(req, callback);
  }
}

