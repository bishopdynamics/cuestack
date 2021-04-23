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
}

