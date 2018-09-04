var checkIfORTC = false;
var checkIfWebRTC = false;

ORTCSupport();
WebRTCSupport();

function ORTCSupport() {
  try {
    if (typeof RTCIceGatherer !== "undefined") {
      checkIfORTC = true;
    }
  } catch (e) {
    return false;
  }
  return false;
}

function WebRTCSupport() {
  let rtcPeerConn = false;
  try {
    rtcPeerConn = new RTCPeerConnection();

    if (rtcPeerConn !== false) checkIfWebRTC = true;
  } catch (e) {
    return false;
  }
  return false;
}

function checkPeerSupport(peerName) {
  if (peerName && peerName.lastIndexOf("-") > 0) {
    peerName = peerName.toUpperCase();
    peerName = peerName.replace(/['"]+/g, "");

    let indexDual = peerName.lastIndexOf("-");
    let string = "";

    for (let i = indexDual + 1; i < peerName.length; i++) {
      string += peerName[i];
    }

    if (string === "DUAL" || string === "JSON") return string;
    else return false;
  } else return false;
}

if (checkIfORTC === true && checkIfWebRTC === true)
  console.log("ORTC is supported.\nWebRTC is supported.");
else if (checkIfORTC === true) console.log("ORTC is supported.");
else if (checkIfWebRTC === true) console.log("WebRTC is supported.");
else console.log("ORTC is NOT supported.\nWebRTC is NOT supported.");
