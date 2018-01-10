

(function (global) {
    "use strict";

/*=========================================
=            Connect to server            =
=========================================*/


var isConnected = false;
var selfInfo = {};
var peerInfo = {};
var videoPreview = false;
var videoRenderer = false;
var isBusy = false;
var pc;
var configuration;

var signalingChannel = new SignallingChannel();
if(window.navigator.userAgent.indexOf("Edge") > -1){
  console.log("Edge Browser");
  configuration = { "gatherPolicy": "all", 
  "iceServers": [
    { 
      "urls": 
        "turn:turn-testdrive.cloudapp.net:3478?transport=udp", 
        "username": "redmond", 
        "credential": "redmond123" 
    }
  ] };
}else{
  console.log("Not Edge Browser");
  configuration = { "gatherPolicy": "all", 
  "iceServers": [
    {
      "urls": "stun: stun.l.google.com:19302"
    },
    { 
      "urls": 
        "turn:turn-testdrive.cloudapp.net:3478?transport=udp", 
        "username": "redmond", 
        "credential": "redmond123" 
    }
  ] };
}


document.getElementById("connect_btn").addEventListener("click", onConnectButtonPressed);

window.onload = function () {
  document.getElementById("connect_btn").value = "Connect";
  document.getElementById("connect_btn").enabled;
  document.getElementById("call_btn").value = "Call";
  document.getElementById("call_btn").disabled;
};

function onConnectButtonPressed() {
  if (isConnected) {
    disconnectFromServer();
  }
  else {
    connectToServer();
  }
}

function connectToServer() {
  if (signalingChannel) {
    var elServerAddress = document.getElementById("peer-id");
    var elServerPort = document.getElementById("peer-key");
    var info = JSON.stringify({
      address: elServerAddress.value,
      port: elServerPort.value
    });
    document.body.style.cursor = "progress";
    signalingChannel.start(info);
  }
}

function disconnectFromServer() {
  if (signalingChannel) {
    document.body.style.cursor = "progress";
    signalingChannel.close();
  }
}

function updateServerStatus(on) {
  if (on) {
    document.getElementById("connect_btn").value = "Connect";
    isConnected = false;
    document.body.style.cursor = "default";
  }
  else {
    document.getElementById("connect_btn").value = "Disconnect";
    isConnected = true;
    document.body.style.cursor = "default";

    document.getElementById("call_btn").disabled = false;
    console.log("Connected to Peer Connection Server");
  }
}

function start() {
  pc = new RTCPeerConnection(configuration);
  updateServerStatus();
}


function clearPeerDetails() {
  var elPeerId = document.getElementById("peer-id");

  if (elPeerId) {
      elPeerId.value = "";
      elPeerId.title = "";
  }

  peerInfo = {};
}


function closeConnection(softClose) {

  if (!softClose) {
    selfInfo = {};
    window.location.reload();
  }

  isBusy = false;
  peerInfo = {};
  selectedContactName = null;
  selectedContactId = null;

  // reset video tags and release capture devices 
  if(videoRenderer){
      videoRenderer.src = null;
      videoRenderer.srcObject = null;
      videoRenderer = null;
  }
  if(videoPreview) {
      videoPreview.src = null;
      videoPreview.srcObject = null;
      videoPreview = null;
  }
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null; 
  }
  if (renderStream) {
    renderStream.getTracks().forEach(track => track.stop());
    renderStream = null; 
  }

  updateCallStatus(true);
}

function updateSelfInformation(details) {

  if (details.id) {
      selfInfo.id = details.id;
      selfInfo.friendlyName = details.friendlyName;

      document.title = "ORTC " + details.friendlyName;
  }

}


/*=====  End of Connect to server  ======*/















































/*=================================
=            Call peer            =
=================================*/

var contacts = null;
var selectedContactName = null;
var selectedContactId = null;
var localStream = null;
var renderStream = null; 
var previewStream = null;

var allowPreview = true;  


var offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};

document.getElementById("call_btn").addEventListener("click", onCallButtonPressed);

contacts = new Map();

var ul = document.getElementById("contactList");
ul.onclick = function (event) {
  var target = getEventTarget(event);
  selectedContactName = target.innerHTML;
  selectedContactId = contacts.get(selectedContactName);
};

function getEventTarget(e) {
  e = e || window.event;
  return e.target || e.srcElement;
}


function onCallButtonPressed() {
   
  if (isBusy) {
    hangup();
  }
  else {
    call();
  }
}


function call() {

  if (selectedContactId == null || selectedContactName == null) {
    alert("Please select contact before making call.");
  }
  else {
    peerInfo.id = selectedContactId
    peerInfo.friendlyName = selectedContactName;
    signalMessage(JSON.stringify({
      connectrequest: "connectrequest",
      peerId: peerInfo.id
    }));
  }
}


function hangup() {
  if (isBusy) {
    signalMessage(JSON.stringify({ disconnect: 'disconnect' }));
  }
  else {
    alert("Not in call, cannot hangup");
  }
}
   
function signalMessage(msg) {
  if (signalingChannel) {
      msg = JSON.parse(msg);
      msg.selfInfo = selfInfo;
      msg.peerInfo = peerInfo;
      signalingChannel.send(JSON.stringify(msg));
  }
}

function updateCallStatus(on) {
  if (on) {
      document.getElementById("call_btn").value = "Call";
      isBusy = false;
  }
  else {
      document.getElementById("call_btn").value = "End Call";
      isBusy = true;
      document.body.style.cursor = "progress";
  }
}

function handleCallRequest(message) {
  showMessage("Peer: " + message.connectrequest.peerInfo.id 
    + " requested to connect.");

  if (isBusy) {
      peerInfo = message.connectrequest.peerInfo;

      // reject
      signalMessage(JSON.stringify({
          "connectresponse": "reject"
      }));

      peerInfo = {};
      showMessage("Rejected Peer: " + message.connectrequest.peerInfo.id 
        + " connection request.");
  }
  else {
      // accept
      peerInfo = message.connectrequest.peerInfo;

      signalMessage(JSON.stringify({
          "connectresponse": "accept"
      }));

      showMessage("Accepted Peer: " + message.connectrequest.peerInfo.id 
        + " connection request.");

  }
}








/*===================================
=            Webrtc part            =
===================================*/


function initiateConnection() {

  
  // Get a local stream
  navigator.mediaDevices.getUserMedia({ 
      "audio": true, 
      "video": true
  }).then( 
      gotMedia
  ).catch( 
      gotMediaError
  );

}


function gotMedia(stream) {
  updateCallStatus();

  //add local stream to the video element.
  localStream = stream;


  //add local stream to the RTCPeerConnection
  localStream.getTracks().forEach(
    function(track) {
    console.log('Using device: ' + track.label);
      pc.addTrack(
        track,
        localStream
      );
    }
  );

  videoPreview = document.getElementById("previewVideo");
  videoPreview.srcObject = localStream;



  // send ice candidates to the other peer
  pc.onicecandidate = function (evt) {
    signalMessage(JSON.stringify({
      "candidate": evt.candidate
    }));
  };


  if (pc.remoteDescription && pc.remoteDescription.type == "offer")
    pc.createAnswer(localDescCreated, logError);
  else
    pc.createOffer().then(localDescCreated, logError);

}


function gotMediaError(e) {
    showMessage(e, true);
    console.log("Error - gotMediaError: " + e);
    signalMessage(JSON.stringify({ "error": "Media error: " + e 
      + "\n Please hang up and retry." }));
}

//function called upon successful creation of offer or answer
function localDescCreated(desc) {

  pc.setLocalDescription( 
    new RTCSessionDescription(desc),
    () => signalMessage(JSON.stringify({
      "sdp": pc.localDescription
    })),
    logError
  );

}


/*=====  End of Webrtc part  ======*/

/*=====  End of Call peer  ======*/












































































function showMessage(msg, alrt) {

  var stat = document.getElementById("footer-status");

  if (stat) {
      stat.innerHTML = msg;
  }

  if (alrt) {
      alert(msg);
  }

  console.log(msg);
}

function logError(error) {
  console.log(error.name + ': ' + error.message);
}


// Function that handles changers to the signalingChannel - server 
// among others handles connect, disconnect, call, hangup...
signalingChannel.onmessage = function (evt) {
  if (!pc)
    start();

  var message = JSON.parse(evt.data);
  console.log(message);
  if (message.peerMessage) {
    console.log(JSON.stringify(message.peerMessage));
  }

  if (message.registerdone) {
    console.log(JSON.stringify(message.registerdone));
    updateSelfInformation(message.registerdone);
    updateServerStatus();
  }

  if (message.peervalidateresponse) {
    if (message.peervalidateresponse === "valid") {
        call();
    }
    else {
        clearPeerDetails();
        alert("Invalid peer details.", true);
    }
  }

  //remote connection requested
  if (message.connectrequest) {
    handleCallRequest(message);
  }

  if (message.connectresponse) {
    if (message.connectresponse === "reject") {
      showMessage("Peer rejected offer.", true);
      clearPeerDetails();
    }

    else if (message.connectresponse === "accept") {
      initiateConnection();
    }

    else {
      showMessage("Bad response", true);
    }
  }

  if (message.disconnect && isBusy) {
    console.log("Peer terminated connection.");
    closeConnection(true);
  }

  if (message.serverDisconnected) {
    console.log("Disconnected from Peer Connection Server");
    if (isBusy) {
      closeConnection();
    }
    else {
      document.getElementById("call_btn").disabled = true;
    }
    // update UI
    updateServerStatus(true);
    var ul = document.getElementById("contactList");
    ul.innerHTML = "";

  }


  if (message.contacts) {
    var values = message.contacts.split("\n");
    for (var i = 0; i < values.length; i++) {
      if (values[i] != "") {
        var peer_information = values[0].split(",");

        if (peer_information[2] == "0") {
          contacts.delete(peer_information[0]);

          var item = document.getElementById("contact" + peer_information[1]);
          item.parentNode.removeChild(item);
        }
        else {

          contacts.set(peer_information[0], peer_information[1]);

          var ul = document.getElementById("contactList");
          var li = document.createElement("li");

          li.setAttribute("id", "contact" + peer_information[1]);

          var a = document.createElement("a");
          a.textContent = peer_information[0];
          a.setAttribute('href', "#");
          li.appendChild(a);
          ul.appendChild(li);
        }
      }
    }
  }

  if(message.candidate){
    //fixes DOMException: Error processing ICE candidate
    //by only setting candidates when remoteDescription is not set
    if(pc || pc.remoteDescription.type){
    console.log("\n\n Remote candidate:\n"+JSON.stringify(message.candidate)+"\n\n\n");
    pc.addIceCandidate(new RTCIceCandidate(message.candidate));
    }
  }

  if(message.sdp){

    //set remote description after getting offer or answer from the other peer
    pc.setRemoteDescription(message.sdp, 
      function () {

      videoRenderer = document.getElementById("rtcRenderer");
      //testing
      pc.ontrack = function(event){
        videoRenderer.srcObject = event.streams[0];
        console.log("Remote track resceved");
      }

      //display remote stream in the video element
      pc.onaddstream = function(event) {
        videoRenderer.srcObject = event.stream;
        console.log("Remote stream resceved");
        document.body.style.cursor = "default";
      }
      
      // if we received an offer, we need set up the stream to send the answer
      if (pc.remoteDescription.type == "offer"){
            initiateConnection();
          }
        }, logError);
  }
};

}(typeof window === "object" ? window : global));