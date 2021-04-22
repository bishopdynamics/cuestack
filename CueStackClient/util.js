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
