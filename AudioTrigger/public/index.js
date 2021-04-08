
let numtriggers = 8;

function Setup() {
    let holder = document.querySelector('.iframes');
    for (i = 1; i < numtriggers + 1; i++){
        AddFrame(i);
    }
}

function AddFrame(id) {
    let holder = document.querySelector('.iframes');
    let new_iframe = document.createElement("iframe");
    new_iframe.id = 'iframe_' + id;
    new_iframe.src = '/cuetrigger.html?id=' + id;
    new_iframe.style = "width:100%; height:100px; border:1px solid black; display:inline;"
    holder.appendChild(new_iframe);
}

document.addEventListener('DOMContentLoaded', function() {
    Setup();
});