/* eslint-disable max-len, no-unused-vars*/
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

// /**
//  * create a table row with two divs, containing name and an input element matching the type of value
//  * @param  {string} name
//  * @param  {any} value
//  * @return {Element} a table row
//  */
// function renderGeneric(name, value) {
//   const obj = document.createElement('tr');
//   try {
//     const label = createLabel(name);
//     const tdlabel = document.createElement('td');
//     tdlabel.classList.add('input_table_td_label');
//     tdlabel.appendChild(label);
//     obj.appendChild(tdlabel);
//     const tdinput = document.createElement('td');
//     let input = null;
//     if (typeof value == 'boolean') {
//       input = createCheckbox(value);
//     } else if (typeof value == 'number') {
//       input = createNumberInput(value);
//     } else if (typeof value == 'string') {
//       input = createTextInput(value);
//     } else if (typeof value == 'object') {
//       input = document.createElement('table');
//       for (const key in value) {
//         if (Object.prototype.hasOwnProperty.call(value, key)) {
//           const subinput = renderGeneric(key, value[key]);
//           input.appendChild(subinput);
//         }
//       }
//       input.style.border = '1px dashed';
//     }
//     tdinput.appendChild(input);
//     obj.appendChild(tdinput);
//     obj.classList.add('input_table_row');
//   } catch (e) {
//     console.error('exception while renderGeneric: ' + e);
//   }
//   return obj;
// }

/**
 * given a datatree populated with input elements, build the actual table
 * @param  {object} datatree
 * @return {Element} a table with all the input elements
 */
function renderDataTree(datatree) {
  const table = document.createElement('table');
  try {
    for (const key in datatree) {
      if (Object.prototype.hasOwnProperty.call(datatree, key)) {
        const row = document.createElement('tr');
        const labeltd = document.createElement('td');
        const inputtd = document.createElement('td');
        const labelelem = createLabel(key);
        labeltd.appendChild(labelelem);
        let inputelem = null;
        if (datatree[key] instanceof Element) {
          inputelem = datatree[key];
        } else {
          inputelem = renderDataTree(datatree[key]);
        }
        inputtd.appendChild(inputelem);
        row.appendChild(labeltd);
        row.appendChild(inputtd);
        table.appendChild(row);
      }
    }
  } catch (e) {
    console.error('exception while renderDataTree: ' + e);
  }
  return table;
}

/**
 * create a tree of input elements based on the values of keys in an object
 * @param  {object} object the object to base it on
 * @param  {object} datatree optional existing datatree to add things to, used for recursion
 * @return {Element} a table row
 */
function buildDataTree(object, datatree = null) {
  if (datatree === null) {
    datatree = JSON.parse(JSON.stringify(object)); // making a deep copy so we can change it independently
  }
  try {
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        const value = object[key];
        let input = null;
        if (typeof value == 'boolean') {
          input = createCheckbox(value);
          datatree[key] = input;
        } else if (typeof value == 'number') {
          input = createNumberInput(value);
          datatree[key] = input;
        } else if (typeof value == 'string') {
          input = createTextInput(value);
          datatree[key] = input;
        } else if (typeof value == 'object') {
          datatree[key] = buildDataTree(value, datatree[key]);
        }
      }
    }
  } catch (e) {
    console.error('exception while buildDataTree: ' + e);
  }
  return datatree;
}

/**
 * update an the given object's values from the input elements in the datatree
 * datatree and object must have the exact same structure
 * @param  {object} object the object to update values
 * @param  {object} datatree the tree holding input elements
 * @return {object} object with updated values
 */
function updateObjectFromDatatree(object, datatree) {
  const table = document.createElement('table');
  try {
    for (const key in datatree) {
      if (Object.prototype.hasOwnProperty.call(datatree, key)) {
        if (datatree[key] instanceof Element) {
          if (datatree[key].type == 'checkbox') {
            // this is a checkbox
            object[key] = datatree[key].checked;
          } else if (datatree[key].type == 'number') {
            // this is a number input
            object[key] = Number(datatree[key].value);
          } else {
            // hopefully this is an input element that has a value property
            object[key] = datatree[key].value;
          }
        } else {
          updateObjectFromDatatree(object[key], datatree[key]);
        }
      }
    }
  } catch (e) {
    console.error('exception while updateObjectFromDatatree: ' + e);
  }
  return object;
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

/**
 * create a form that can be flipped to a json editor
 * @param  {any} object
 * @return {Element}
 */
function createFlippableInputForm(object) {
  const container = document.createElement('div');
  // const inputview = document.createElement('table');
  const editorview = document.createElement('pre'); // editor docs say use a pre
  const editbutton = document.createElement('button');
  const returnbutton = document.createElement('button');
  let datatree = buildDataTree(object);
  let inputview = renderDataTree(datatree);
  editorview.classList.add('form-node-input');
  let editor = new JsonEditor(editorview, object);
  inputview.style.display = 'block';
  editorview.style.display = 'none';
  editbutton.style.display = 'block';
  editbutton.innerHTML = 'Edit';
  returnbutton.style.display = 'none';
  returnbutton.innerHTML = 'Return';
  editbutton.addEventListener('click', function() {
    const newobject = updateObjectFromDatatree(object, datatree);
    editorview.innerHTML = '';
    editor = new JsonEditor(editorview, newobject);
    object = newobject;
    inputview.style.display = 'none';
    delete(inputview);
    editorview.style.display = 'block';
    returnbutton.style.display = 'block';
    editbutton.style.display = 'none';
  });
  returnbutton.addEventListener('click', function() {
    const newdatatree = buildDataTree(editor.get());
    inputview = renderDataTree(newdatatree);
    // inputview.parentElement.replaceChild(newinputview, inputview);
    // inputview = newinputview;
    container.appendChild(inputview);
    datatree = newdatatree;
    inputview.style.display = 'block';
    editorview.style.display = 'none';
    returnbutton.style.display = 'none';
    editbutton.style.display = 'block';
  });
  editbutton.style.width = '60px';
  editbutton.style.height = '20px';
  returnbutton.style.width = '60px';
  returnbutton.style.height = '20px';
  container.appendChild(editbutton);
  container.appendChild(returnbutton);
  container.appendChild(inputview);
  container.appendChild(editorview);
  return container;
}
