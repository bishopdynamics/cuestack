/* eslint-disable max-len */
/*
    CueStackClient GUI Functions

    Copyright (C) 2021 James Bishop (james@bishopdynamics.com)
*/


/**
 * create a span to be used as a label, with text Camelcase
 * class is form-node-label
 * @param  {text} name
 * @return {Element} a span element
 */
function createLabel(name) {
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
function createCheckbox(value) {
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
function createNumberInput(value) {
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
function createTextInput(value) {
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
function renderGeneric(name, value) {
  const obj = document.createElement('tr');
  try {
    const label = createLabel(name);
    const tdlabel = document.createElement('td');
    tdlabel.classList.add('input_table_td_label');
    tdlabel.appendChild(label);
    obj.appendChild(tdlabel);
    const tdinput = document.createElement('td');
    let input = null;
    if (typeof value == 'boolean') {
      input = createCheckbox(value);
    } else if (typeof value == 'number') {
      input = createNumberInput(value);
    } else if (typeof value == 'string') {
      input = createTextInput(value);
    } else if (typeof value == 'object') {
      input = document.createElement('table');
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          const subinput = renderGeneric(key, value[key]);
          input.appendChild(subinput);
        }
      }
      input.style.border = '1px dashed';
    }
    tdinput.appendChild(input);
    obj.appendChild(tdinput);
    obj.classList.add('input_table_row');
  } catch (e) {
    console.error('exception while renderGeneric: ' + e);
  }
  return obj;
}

/**
 * create a drop-down given the array of options and a value indicated the selected option
 * @param  {Array} options
 * @param  {any} value
 * @return {Element} a select element
 */
function renderSelect(options, value) {
  // return a selectbox using the given list of options, and a selected value
  const select = document.createElement('select');
  for (let i = 0; i < options.length; i++) {
    const option = document.createElement('option');
    option.value = options[i];
    option.text = options[i]; // TODO this could be stylized here
    select.appendChild(option);
  }
  try {
    select.value = value;
  } catch (e) {
    console.error('selected value: ' + value + ' was not found');
  }
  return select;
}
