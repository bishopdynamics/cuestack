/* eslint-disable no-unused-vars */
/* eslint-disable max-len */
/*
    CueStackClient Utility Functions

    Copyright (C) 2021 James Bishop (james@bishopdynamics.com)
*/

/**
 * turn a string into Camelcase
 * @param  {string} str
 * @return {string} new string
 */
function camelCase(str) {
  return str.replace(/(\w)(\w*)/g,
      function(g0, g1, g2) {
        return g1.toUpperCase() + g2.toLowerCase();
      });
}

/**
 * returns an array of strings, corresponding to the first level key names in given object
 * @param  {object} thisobject
 * @return {Array} an array of key names
 */
function getKeyNames(thisobject) {
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
 * Generate a uuid4 (as a string) for use as request_id
 * @return  {string} uuid
 */
function uuid4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    // eslint-disable-next-line one-var
    const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
