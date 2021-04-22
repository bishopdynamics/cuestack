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
   * @param  {Function} messagehandler
   */
  constructor(host, port, messagehandler) {
    this.host = host;
    this.port = port;
    this.messagehandler = messagehandler;
  }

  /**
   * @param  {object} message
   */
  sendMessage(message) {
    // we open a fresh websocket connection for every message, which will auto-close after 200ms
    const msg = JSON.stringify(message);
    const client = new WebSocket('ws://' + this.host + ':' + this.port);
    client.onopen = function(event) {
      // console.log('sending message: ' + msg)
      client.send(msg);
      setTimeout(function() {
        client.close();
      }, 200);
    };
    client.msg_handler = this.messagehandler;
    client.onmessage = function(event) {
      console.info('received message: ' + event.data);
      try {
        const parsedmessage = JSON.parse(event.data);
        this.msg_handler(parsedmessage);
      } catch (e) {
        console.error('exception while parsing message: ' + e);
      }
    };
    client.onerror = function(event) {
      console.error('error in websocket: ' + event.message);
    };
  }

  /**
   * get a list of cuenames
   */
  getCues() {
    const req = {'request': 'getCues'};
    this.sendMessage(req);
  }

  /**
   * get a list of stack names
   */
  getStacks() {
    const req = {'request': 'getStacks'};
    this.sendMessage(req);
  }

  /**
   * get the name of the currently active stack
   */
  getCurrentStack() {
    const req = {'request': 'getCurrentStack'};
    this.sendMessage(req);
  }

  /**
   * trigger a cue
   * @param  {string} cuename
   */
  triggerCue(cuename) {
    const req = {'cue': cuename};
    this.sendMessage(req);
  }

  /**
   * trigger a stack change
   * @param  {text} stackname
   */
  triggerStack(stackname) {
    const req = {'stack': stackname};
    this.sendMessage(req);
  }
}

