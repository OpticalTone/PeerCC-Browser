/*
 *   Copyright (c) Microsoft Corporation 
 *   All Rights Reserved        
 *   Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with
 *   the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 *   THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, EITHER EXPRESS OR IMPLIED,
 *   INCLUDING WITHOUT LIMITATION ANY IMPLIED WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
 *   MERCHANTABLITY OR NON-INFRINGEMENT. 
 *   
 *   See the Apache 2 License for the specific language governing permissions and limitations under the License.
 */

var checkIfORTC = false;
var checkIfWebRTC = false;

checkIfORTCSupported();
 function checkIfORTCSupported() {
        try {
            if (typeof RTCIceGatherer !== 'undefined') {
                checkIfORTC = true;
            }
        } catch (e) {
            return false;
        }
        return false;
    }

function checkPeerSupport(peerName){
  if(peerName && peerName.lastIndexOf("-") > 0){
    peerName = peerName.toUpperCase();
    peerName = peerName.replace(/['"]+/g, '');
    let indexDual = peerName.lastIndexOf("-");
    let string = '';
    for(let i = indexDual+1; i < peerName.length; i++){
      string += peerName[i];
    }
    if(string === "DUAL" || string === "JSON")
        return string;
    else
        return false;
  }
  else
    return false;
}

    ['RTCPeerConnection', 'webkitRTCPeerConnection', 'mozRTCPeerConnection', 'RTCIceGatherer'].forEach(function (item) {
        if (checkIfWebRTC) {
            return;
        }

        if (item in window) {
            checkIfWebRTC = true;
        }
    });

    if (checkIfORTC === true && checkIfWebRTC === true)
        console.log("ORTC is supported.\nWebRTC is supported.");      
    else if (checkIfORTC === true)
        console.log("ORTC is supported.");
    else if (checkIfWebRTC === true)
        console.log("WebRTC is supported.");
    else
        console.log("ORTC is NOT supported.\nWebRTC is NOT supported.");


function changeName(){

    var input = document.getElementById("changeValue").value;
    
    if (input != "") {
        if ( /[^A-Za-z\d]/.test(input)) {
            alert("Please enter only letter and numeric characters");
            return false;
        }
    }

    document.getElementById('name').innerHTML = input;
    localStorage['name'] = input;
}