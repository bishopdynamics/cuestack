let socket = io.connect('http://localhost:3000/');

navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia ||
    navigator.mozGetUserMedia || navigator.msGetUserMedia);

let devicesAvailable = []
let select = document.getElementById("selectDevice");
let btnPick = document.getElementById("pick");
let selectPanel = document.getElementById("removable-element");
let sceneSelected = document.getElementById("scene");
let sliderValue = document.getElementById("range-value");
let slider = document.getElementById("RangeDb");
let titleTrigger = document.getElementById("trigger-name");
let actualOpt = ""
let dbLimit = -25

if(titleTrigger != null){
    titleTrigger.innerHTML = `Trigger-${getParameterByName("id")}`;
    sceneSelected.value = `scene${getParameterByName("id")}`
}

navigator.mediaDevices.enumerateDevices().then(function (devices) {
    var numdevices = {}; // tracks number of each device kind
    devices.forEach(function (device) {
        var newlabel = '';
        if (!(device.kind in numdevices)) {
            numdevices[device.kind] = 1;
        } else {
            numdevices[device.kind]++;
        }
        if (device.label == '') {
            newlabel = numdevices[device.kind];
        } else {
            newlabel = numdevices[device.kind] + ' - ' + device.label;
        }
        devicesAvailable.push({
            'kind': device.kind,
            'label': newlabel,
            'deviceId': device.deviceId
        })

        let opt = device.kind + ": " + newlabel;
        let el = document.createElement("option");
        el.textContent = opt;
        el.value = device.deviceId;
        select.appendChild(el);

    });
    //console.log('Available devices:');
    //console.log(devicesAvailable);
}).catch(function (err) {
    console.log(err.name + ": " + err.message);
});

function getNewOption() {
    actualOpt = select.value
}

function getVol(val){
    sliderValue.innerHTML = val;
    dbLimit = val
    //console.log(val)
}

function getParameterByName(name, url) {
    if (!url) url = window.location.href;
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}

function startStream() {
    if (navigator.getUserMedia) {
        navigator.getUserMedia({ audio: { deviceId: { exact: actualOpt } } }, function (stream) {
            vuMeter(stream)
            selectPanel.remove()
        }, function (err) {
            console.warn(err)
        });
    }
}

function vuMeter(streamdata) {
    let audioContextVar = new AudioContext();
    let analyser = audioContextVar.createAnalyser();
    let microphone = audioContextVar.createMediaStreamSource(streamdata);
    let javascriptNode = audioContextVar.createScriptProcessor(2048, 1, 1);
    //console.log(analyser)
    analyser.smoothingTimeConstant = 0.8;
    analyser.fftSize = 1024;

    microphone.connect(analyser);
    analyser.connect(javascriptNode);
    javascriptNode.connect(audioContextVar.destination);

    let canvasContext = $("#canvas")[0].getContext("2d");
    javascriptNode.onaudioprocess = function () {
        //console.log("process")
        let array = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(array);
        let values = 0;

        let length = array.length;
        for (let i = 0; i < length; i++) {
            values += (array[i]);
        }

        let average = values / length;
        let actualVolume = Math.round(average - 40)
        //console.log(actualVolume);
        sendSocketData(actualVolume, `${getParameterByName("id")}`, sceneSelected.value)
        canvasContext.clearRect(0, 0, 100, 50);
        canvasContext.fillStyle = '#BadA55';
        canvasContext.fillRect(0, 50 - average, 100, 50);
        canvasContext.fillStyle = '#262626';
        canvasContext.font = "48px impact";
        canvasContext.fillText(Math.round(average - 40), -2, 50);

    }
}
//
function sendSocketData(volume, id, scene_name) {
    try {
        let objData = { 'volume': volume, 'id': id, 'scene': scene_name, 'limit': parseInt(dbLimit) }
        socket.emit('audioInput', (objData));
    } catch {
        console.warn('some error in sending ws message');
    }
}