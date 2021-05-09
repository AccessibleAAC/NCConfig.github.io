
"use strict"

const MSG_NOT_SUPPORTED = "Unfortunately, this browser does not support connection to a serial device.\
  Supported browers are Chrome, Edge and Opera.  In addition, on these browsers you must enable experimental features.\
 To do this copy one of:\
<ul>\
<li><code>chrome://flags/#enable-experimental-web-platform-features</code>\
<li><code>edge://flags/#enable-experimental-web-platform-features</code>\
<li><code>opera://flags/#enable-experimental-web-platform-features</code>\
</ul>\
and paste it into your brower's address bar.  Then, set the option to \'Enabled\'.";
   
const MSG_MUST_CONNECT = "We now need to correct the your netClé device.<br/>\
Please ensure your device is connected to your computer, and then press OK.";

function startup() {
    // A bunch of lists that cannot be initialized until all javascript
    // files have been loaded.
    createSensorList();
    createActionList();
    loadPorts();
    LoadSolutionList();
    Chooser.init();
    createConnectionOptions();
    
   if (!connection.isSupported()) {
        let p = showMessageBox("Error", MSG_NOT_SUPPORTED, ["OK"]);
        p.then( () => {
            
        });
    }
}

function generateTrigs() {
    SolutionList.doPortCheck().then( (val) => {
        if (val === true) {  // Port check passed    
            
            SolutionList.compile();
        }
    });
}

function getHash() {
//    var sensorList = [SENSOR_1A, SENSOR_1B, SENSOR_2A, SENSOR_2B, SENSOR_3A, SENSOR_3B];
    var text = "";
    
    for(let s of sensors) {
        var subset = Triggers.getSubSet(s);
        if (subset.length() > 0) {
            let hash = subset.getHash()
            text += "Value for " + s.name + "(" + subset.length() + ") is " + hash.toString(10) + "<br/>";
        }
    }
    showMessageBox("Hash", text, ["OK"]);
}

function download() {
    if (!connection.isSupported()) {
        showMessageBox("Error", MSG_NOT_SUPPORTED, ["OK"]);
        return;
    } else {
        // doPortCheck may put up a dialog, and thus returns a promise.
        SolutionList.doPortCheck().then( (val) => {
            if (val === true) {  // Port check passed
                if (connection.connected) {
                    doDownload();
                } else {
                    getConnected( doDownload );
                } 
            }
        });
    }
}

function upload() {
    if (!connection.isSupported()) {
        showMessageBox("Error", MSG_NOT_SUPPORTED, ["OK"]);
        return;
    } else {
        // doPortCheck may put up a dialog, and thus returns a promise.
        SolutionList.doPortCheck().then( (val) => {
            if (val === true) {  // Port check passed
                if (connection.connected) {
                    Recreate.doAll();
                } else {
                    getConnected( Recreate.doAll );
                } 
            }
        });
    }
}

// Establish the connections to the hub.  If successful call the callback function.
function getConnected( callbackFunc ) {
    showMessageBox("Information", MSG_MUST_CONNECT, ["OK"])
    .then( () => {  // after message box is closed ...
        return connection.open();

    }).then( () => {  // after connection is complete ...
        return connection.checkVersion();

    }).then( (version) => {  // after version check is complete.
        if (version == null) {
             showMessageBox("Error", "You are not connected to a netClé device.", ["OK"]);
             connection.close();
         } else if (version == "1.04" || version == "2.04") {
             callbackFunc();
         } else {
             showMessageBox("Error", "Your netClé hub firmware is version " + version + 
                ". This is out-of-date. \
In order to use this tool you will need a firmware upgrade.", ["OK"]);
             connection.close();
         }        

    }).catch( (error) => {  // if connection.open fails
        showMessageBox("Error", "Connection failed:<br/>" + error, ["OK"]);
        return;
    });    
}

function doDownload() {
    SolutionList.compile();
    sendTriggersToSensact();
    connection.sendCommand(RUN_SENSACT);
    showMessageBox("Information", "Download complete", ["OK"]);    
}


function sendTriggers() {
    sendTriggersToSensact();
}

function getVersion() {
    let p = showMessageBox("Question", "Send version request?", ["Yes", "No", "Maybe"]);
    p.then( (value) => {
        console.log(value);
        if (value == "Yes") {
            connection.sendCommand(GET_VERSION);
        }
    });
}

function getConfig() {
    connection.sendCommand(REQUEST_TRIGGERS);
}

function closeConnection() {
    connection.close();
}


async function showMessageBox(title, message, buttonList) {
    let p = new Promise( function (resolve, reject) {
        let box = document.getElementById("infoBox");
        let heading = document.getElementById("infoHeading");
        let content = document.getElementById("infoContent");
        var buttons = document.getElementById("infoButtons");
        
        heading.innerHTML = title;
        content.innerHTML = message;
        
        // Clear any old buttons
        while(buttons.firstChild) {
            buttons.removeChild(buttons.lastChild);
        }
        
        for (let b of buttonList) {
            let btn = document.createElement("input");
            btn.type = "button";
            btn.value = b;
            btn.onclick = function() {
                box.style.display = "none";
                resolve(b);
            }
            buttons.appendChild(btn);
        }
        box.style.display = "block";
    });
    return p;
}

function startLevels() {
    if (!connection.isSupported()) {
        showMessageBox("Error", MSG_NOT_SUPPORTED, ["OK"]);
        return;
    } else {
        if (connection.connected) {
            Levels.startLevels();
        } else {
            getConnected( Levels.startLevels ); 
        }      
    }    
}
