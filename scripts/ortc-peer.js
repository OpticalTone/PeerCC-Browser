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


(function (global) {
    "use strict";

    var sigCh = null;
    var iceGathr = null;
    var iceTr = null;
    var dtlsTr = null;
    var isConnected = false;
    var isBusy = false;
    var audioSender = null;
    var videoSender = null;
    var audioReceiver = null;
    var videoReceiver = null;
    var sendAudioCaps = null;
    var sendVideoCaps = null;
    var receiveVideoCaps = null;
    var receiveAudioCaps = null;
    var selfInfo = {};
    var peerInfo = {};
    var remoteCandidates = [];
    var localCandidatesCreated = false;
    var remoteIceParams = null;
    var remoteDtlsParams = null;
    var videoRenderer = null;
    var videoPreview = null;
    var renderStream = null; 
    var previewStream = null;
    var trackCount = 0;
    var remote_audioRecvParams = null;
    var remote_videoRecvParams = null;
    var remote_audioSendParams = null;
    var remote_videoSendParams = null;
    var local_video_MST = null;
    var local_audio_MST = null;

    var allowBundle = true;
    var iceGathr_2 = null;
    var iceTr_2 = null;
    var dtlsTr_2 = null;
    var remoteCandidates_2 = [];
    var localCandidatesCreated_2 = false;
    var remoteIceParams_2 = null;
    var remoteDtlsParams_2 = null;

    var allowPreview = true;

    var contacts = null;

    var selectedContactName = null;
    var selectedContactId = null;

    var util = {};
    window.onload = function () {
        if(checkIfORTC !== true) {
           document.getElementById("warning").style.display = "block";
           document.getElementById("demo").style.display = "none";
           document.getElementById("footer").style.display = "none";
           if(parent) {
               parent.postMessage(document.body.scrollHeight, "https://dev.modern.ie");
           }
           return;
        }

        initialize();
    };


    function initialize() {
        try {
          document.getElementById("connect_btn").addEventListener("click", onConnectButtonPressed);
          document.getElementById("call_btn").addEventListener("click", onCallButtonPressed);
            document.getElementById("alert-ok-btn").addEventListener("click", closeAlert);
            document.getElementById("alert-box").addEventListener("keypressed", closeAlert);

            var ul = document.getElementById("contactList");
            ul.onclick = function (event) {
              var target = getEventTarget(event);
              selectedContactName = target.innerHTML;
              selectedContactId = contacts.get(selectedContactName);
            };

            global.fName = window.location.pathname.substring(window.location.pathname.indexOf("/", 0) + 1);
            contacts = new Map();
            sigCh = new global.SignallingChannel();
            sigCh.onmessage = handleMessages;
        }
        catch (e) {
            showMessage(e.message || e, true);
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
        showMessage("Connected to Peer Connection Server");
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
            document.body.style.cursor = "wait";
        }
    }

    function getEventTarget(e) {
      e = e || window.event;
      return e.target || e.srcElement;
    }

    function showMessage(msg, alrt) {

        var stat = document.getElementById("footer-status");

        if (stat) {
            stat.innerHTML = msg;
        }

        if (alrt) {
            showAlert(msg);
        }

        addToLog(msg);
    }

    function showAlert(msg) {
        document.getElementById("disabler").style.display = "block";
        document.getElementById("alert-box").style.display = "block";
        document.getElementById("message").innerHTML = msg;
    }

    function addToLog(msg) {
        console.log(msg);
    }

    function closeAlert() {
        document.getElementById("disabler").style.display = "none";
        document.getElementById("alert-box").style.display = "none";

        if(isBusy)closeConnection();
    }

    function clearPeerDetails() {
        var elPeerId = document.getElementById("peer-id");

        if (elPeerId) {
            elPeerId.value = "";
            elPeerId.title = "";
        }

        peerInfo = {};
    }

    function handleMessages(evt) {

        var message = JSON.parse(evt.data);

        addToLog(JSON.stringify(message));

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

        if (message.peerMessage) {
          addToLog(JSON.stringify(message.peerMessage));
        }

        if (message.registerdone) {
            addToLog(JSON.stringify(message.registerdone));
            updateSelfInformation(message.registerdone);
            updateServerStatus();
        }

        if (message.peervalidateresponse) {
            if (message.peervalidateresponse === "valid") {
                call();
            }
            else {
                clearPeerDetails();
                showMessage("Invalid peer details.", true);
            }
        }

        if (message.connectrequest) {
            handleCallRequest(message);
        }

        if (message.connectresponse) {
            if (message.connectresponse === "reject") {

                showMessage("Peer rejected offer.", true);
                clearPeerDetails();
            }

            else if (message.connectresponse === "accept") {
              selfInfo.dtlsRole = "server";
              initiateConnection();
            }

            else {
              showMessage("Bad response", true);
            }
        }

        if (message.start) {
            selfInfo.dtlsRole = message.dtlsrole;
            initiateConnection();  
        }

        if (message.disconnect && isBusy) {
            showMessage("Peer terminated connection. Please disconnect and try again.");
            closeConnection();
        }

        if (message.serverDisconnected) {
          showMessage("Disconnected from Peer Connection Server");
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

          // clean up
          contacts.clear();
          selectedContactName = null;
          selectedContactId = null;

        }

        if (message.error) {
            showMessage("Remote error: " + message.error, true);
        }

        if (iceTr && dtlsTr) {
            if (message.candidate) {

                addToLog("Remote ICE candidate: " + message.candidate.ip + ":" + message.candidate.port);

                if(Object.keys(message.candidate).length > 0) {
                    remoteCandidates.push(message.candidate);
                }
                else {
                    iceTr.setRemoteCandidates(remoteCandidates); 
                }

                // the alternative option is to call addRemoteCandidate including the empty candidate
                //iceTr.addRemoteCandidate(message.candidate);

            }

            if (message.params) {
                var remote = message.params;

                if (remote.ice) {
                    remoteIceParams = remote.ice;
                    remoteDtlsParams = remote.dtls;

                    if(localCandidatesCreated){
                        iceTr.start(iceGathr, remoteIceParams, (selfInfo.dtlsRole && selfInfo.dtlsRole === "client" ? "controlled" : "controlling" ));
                        dtlsTr.start(remoteDtlsParams);
                    }
                }

                if (remote.sendAudioCaps) {
                    if (audioReceiver) {
                        var audioRecvParams = util.myCapsToRecvParams(receiveAudioCaps, remote.sendAudioCaps);
                        audioRecvParams.muxId = remote.muxId;
                        audioRecvParams.encodings.push(util.RTCRtpEncodingParameters(1001, 0, 0, 0, 1.0)); 
                        audioReceiver.receive(audioRecvParams);

                        trackCount++;
                        if ( trackCount == 2) {
                            videoRenderer.srcObject = renderStream;
                        }
                    }
                    else {
                        remote_audioRecvParams = remote;  
                    }
                }

                if (remote.sendVideoCaps) {
                    if (videoReceiver) {
                        var videoRecvParams = util.myCapsToRecvParams(receiveVideoCaps, remote.sendVideoCaps);
                        videoRecvParams.muxId = remote.muxId;
                        videoRecvParams.encodings.push(util.RTCRtpEncodingParameters(3003, 0, 0, 0, 1.0));
                        videoReceiver.receive(videoRecvParams);

                        trackCount++;
                        if ( trackCount == 2) {
                            videoRenderer.srcObject = renderStream;
                        }
                    }
                    else {
                        remote_videoRecvParams = remote;
                    }
                }

                if (remote.receiveAudioCaps) {
                    if (audioSender) {
                        var audioSendParams = util.myCapsToSendParams(sendAudioCaps, remote.receiveAudioCaps);
                        audioSendParams.encodings.push(util.RTCRtpEncodingParameters(1001, 0, 0, 0, 1.0));
                        audioSender.send(audioSendParams);
                    }
                    else {
                        remote_audioSendParams = remote; 
                    }
                }

                if (remote.receiveVideoCaps) {
                    if (videoSender) {
                        var videoSendParams = util.myCapsToSendParams(sendVideoCaps, remote.receiveVideoCaps);
                        videoSendParams.encodings.push(util.RTCRtpEncodingParameters(3003, 0, 0, 0, 1.0));
                        videoSender.send(videoSendParams);
                    }
                    else {
                        remote_videoSendParams = remote;
                    }
                }
            }
        }

        if (iceTr_2 && dtlsTr_2) {
            if (message.candidate_2) {
                addToLog("Remote ICE candidate_2: " + message.candidate_2.ip + ":" + message.candidate_2.port);

                if(Object.keys(message.candidate_2).length > 0) {
                    remoteCandidates_2.push(message.candidate_2);
                }
                else {
                    iceTr_2.setRemoteCandidates(remoteCandidates_2); 
                }
            }

            if (message.params) {
                var remote = message.params;
                if (remote.ice_2) {

                    remoteIceParams_2 = remote.ice_2;
                    remoteDtlsParams_2 = remote.dtls_2;

                    if(localCandidatesCreated_2){

                        iceTr_2.start(iceGathr_2, remoteIceParams_2, (selfInfo.dtlsRole && selfInfo.dtlsRole === "client" ? "controlled" : "controlling" ));

                        dtlsTr_2.start(remoteDtlsParams_2);
                    }
                }

            }
        }
    }

    function handleCallRequest(message) {
        showMessage("Peer: " + message.connectrequest.peerInfo.id + " requested to connect.");

        if (isBusy) {
            peerInfo = message.connectrequest.peerInfo;

            // reject
            signalMessage(JSON.stringify({
                "connectresponse": "reject"
            }));

            peerInfo = {};
            showMessage("Rejected Peer: " + message.connectrequest.peerInfo.id + " connection request.");
        }
        else {
            // accept
            peerInfo = message.connectrequest.peerInfo;

            signalMessage(JSON.stringify({
                "connectresponse": "accept"
            }));

            showMessage("Accepted Peer: " + message.connectrequest.peerInfo.id + " connection request.");

            selfInfo.dtlsRole = "client";
            initiateConnection();
        }
    }

    function closeConnection(softClose) {

        if (audioSender) {
            audioSender.stop();
        }

        if (videoSender) {
            videoSender.stop();
        }

        if (audioReceiver) {
            audioReceiver.stop();
        }

        if (videoReceiver) {
            videoReceiver.stop();
        }

        if (!softClose) {
            if (iceTr) {
                iceTr.stop();
            }

            if (iceTr_2) {
                iceTr_2.stop();
            }

            if (dtlsTr) {
                dtlsTr.stop();
            }

            if (dtlsTr_2) {
                dtlsTr_2.stop();
            }

            peerInfo = {};
            window.location.reload();

            isBusy = false;
            iceGathr = null;
            iceGathr_2 = null;
            audioSender = null;
            videoSender = null;
            audioReceiver = null;
            videoReceiver = null;
            sendAudioCaps = null;
            sendVideoCaps = null;
            receiveVideoCaps = null;
            receiveAudioCaps = null;
            selfInfo = {};

            remoteCandidates = [];
            localCandidatesCreated = false;
            remoteIceParams = null;
            remoteDtlsParams = null;
            remoteCandidates_2 = [];
            localCandidatesCreated_2 = false;
            remoteIceParams_2 = null;
            remoteDtlsParams_2 = null;

            remote_audioRecvParams = null;
            remote_videoRecvParams = null;
            remote_audioSendParams = null;
            remote_videoSendParams = null;

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
            if(renderStream) {
                renderStream = null; 
            }
            if(previewStream){
                previewStream = null;
            }
            if(local_video_MST) {
                local_video_MST.stop();
                local_video_MST = null; 
            }
            if(local_audio_MST) {
                local_audio_MST.stop();
                local_audio_MST = null; 
            }
            trackCount = 0;

            updateCallStatus(true);
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

        //closeConnection();
      }
      else {
        alert("Not in call, cannot hangup");
      }
    }

    

    function initiateConnection() {

        updateCallStatus();

        var iceOptions = { "gatherPolicy": "all", "iceServers": [{ "urls": "turn:turn-testdrive.cloudapp.net:3478?transport=udp", "username": "redmond", "credential": "redmond123" }] };

        // the following will work for testing within the same network (i.e. no relay)
        //var iceOptions = { "gatherPolicy": "all", "iceServers": [] };

        iceGathr = new RTCIceGatherer(iceOptions);
        iceTr = new RTCIceTransport(); 
        dtlsTr = new RTCDtlsTransport(iceTr);
        


        if(!allowBundle){
            iceGathr_2 = new RTCIceGatherer(iceOptions);
            iceTr_2 = new RTCIceTransport(); 
            dtlsTr_2 = new RTCDtlsTransport(iceTr_2); 
        }

        // Apply any local ICE candidate and send it to the remote
        iceGathr.onlocalcandidate = function (evt) {
            signalMessage(JSON.stringify({ "candidate": evt.candidate }));

            localCandidatesCreated = false;

            if(Object.keys(evt.candidate).length == 0){
                localCandidatesCreated = true;

                addToLog("End of local ICE candidates");

                signalMessage(JSON.stringify({
                    params: {
                        "ice": iceGathr.getLocalParameters(),
                        "dtls": dtlsTr.getLocalParameters()
                    }
                }));

                if(remoteIceParams){
                    iceTr.start(iceGathr, remoteIceParams, (selfInfo.dtlsRole && selfInfo.dtlsRole === "client" ? "controlled" : "controlling" ));

                    dtlsTr.start(remoteDtlsParams);
                }
            }
            else {
                addToLog("Local ICE candidate: " + evt.candidate.ip + ":" + evt.candidate.port);
            }
        };

        if(!allowBundle) iceGathr_2.onlocalcandidate = function (evt) {
            signalMessage(JSON.stringify({ "candidate_2": evt.candidate }));

            localCandidatesCreated_2 = false;

            if(Object.keys(evt.candidate).length == 0){
                localCandidatesCreated_2 = true;

                addToLog("End of local ICE candidates_2");

                signalMessage(JSON.stringify({
                    params: {
                        "ice_2": iceGathr_2.getLocalParameters(),
                        "dtls_2": dtlsTr_2.getLocalParameters()
                    }
                }));

                if(remoteIceParams_2){
                    iceTr_2.start(iceGathr_2, remoteIceParams_2, (selfInfo.dtlsRole && selfInfo.dtlsRole === "client" ? "controlled" : "controlling" ));

                    dtlsTr_2.start(remoteDtlsParams_2);
                }
            }
            else {
                addToLog("Local ICE candidate_2: " + evt.candidate.ip + ":" + evt.candidate.port);
            }
        };

        // Get a local stream
        renderStream = new MediaStream();
        navigator.mediaDevices.getUserMedia({ 
            "audio": true, 
            "video": {
                width: 640,
                height: 480,
                facingMode: "user" 
            }
        }).then( 
            gotMedia
        ).catch( 
            gotMediaError
        );
        videoRenderer = document.getElementById("rtcRenderer");

        // ice state has changed
        iceTr.onicestatechange = function (evt) {
            addToLog("ICE state changed to |" + iceTr.state + "|");
            document.body.style.cursor = "default";

            if (iceTr.state === "connected") { 
                addToLog("ICE transport has been established");
                showMessage("ICE: Connection with peer established.");
            }

            if (iceTr.state === "disconnected") { 
                showMessage("Failed to establish connection with peer. Please disconnect and try again.", true);

                iceTr = null;

            }
        };

        if(!allowBundle) iceTr_2.onicestatechange = function (evt) {
            addToLog("ICE_2 state changed to |" + iceTr_2.state + "|");
            document.body.style.cursor = "default";

            if (iceTr_2.state === "connected") { 
                addToLog("ICE_2 transport has been established");
                showMessage("ICE: Connection with peer established.");
            }

            if (iceTr_2.state === "disconnected") { 
                showMessage("Failed to establish connection with peer. Please disconnect and try again.", true);

                iceTr_2 = null;

            }
        };

        iceTr.oncandidatepairchange = function (evt) {
            addToLog("ICE candidate pair changed to: " + JSON.stringify(evt.pair));
        };

        if(!allowBundle) iceTr_2.oncandidatepairchange = function (evt) {
            addToLog("ICE candidate_2 pair changed to: " + JSON.stringify(evt.pair));
        };

        iceGathr.onerror = function (evt) {
            showMessage("ICE transport failed. Please disconnect and try again.", true);
        };

        if(!allowBundle) iceGathr_2.onerror = function (evt) {

            showMessage("ICE_2 transport failed. Please disconnect and try again.", true);
        };

        // dtls state has changed
        dtlsTr.ondtlsstatechange = function (evt) {
            addToLog("DTLS state changed to |" + dtlsTr.state + "|");
            document.body.style.cursor = "default";

            if (dtlsTr.state === "connected") {  
                addToLog("DTLS transport has been established");
                showMessage("Connection with peer established.");
            }

            if (dtlsTr.state === "disconnected" ||
                dtlsTr.state === "closed") { 

                addToLog("DTLS transport has been lost");
                showMessage("Connection with peer lost. Please disconnect and try again.", true);

                dtlsTr = null;
            }
        };

        if(!allowBundle) dtlsTr_2.ondtlsstatechange = function (evt) {
            addToLog("DTLS_2 state changed to |" + dtlsTr_2.state + "|");
            document.body.style.cursor = "default";

            if (dtlsTr_2.state === "connected") {  
                addToLog("DTLS_2 transport has been established");
                showMessage("Connection with peer established.");
            }

            if (dtlsTr_2.state === "disconnected" ||
                dtlsTr_2.state === "closed") { 

                addToLog("DTLS_2 transport has been lost");
                showMessage("Connection with peer lost. Please disconnect and try again.", true);

                dtlsTr = null;
            }
        };

        dtlsTr.onerror = function (evt) {
            showMessage("DTLS transport failed. Please disconnect and try again.", true);
        };

        if(!allowBundle) dtlsTr_2.onerror = function (evt) {
            showMessage("DTLS_2 transport failed. Please disconnect and try again.", true);
        };
    }

    function gotMedia(stream) {
        var audioTracks = stream.getAudioTracks(); 

        if (audioTracks.length > 0) {
            var audioTrack = audioTracks[0];
            local_audio_MST = audioTrack;

            audioSender = new RTCRtpSender(audioTrack, dtlsTr);  
            sendAudioCaps = RTCRtpSender.getCapabilities("audio");  

            signalMessage(JSON.stringify({
                params: {
                    "sendAudioCaps": sendAudioCaps,
                    muxId: null
                }
            }));
        }

        var videoTracks = stream.getVideoTracks();

        if (videoTracks.length > 0) {
            var videoTrack = videoTracks[0];
            local_video_MST = videoTrack;

            if(allowPreview) {
                previewStream = new MediaStream();
                previewStream.addTrack(local_video_MST); 
                videoPreview = document.getElementById("previewVideo");
                videoPreview.srcObject = previewStream;
            }

            if(allowBundle)
                videoSender = new RTCRtpSender(videoTrack, dtlsTr);
            else
                videoSender = new RTCRtpSender(videoTrack, dtlsTr_2);

            sendVideoCaps = RTCRtpSender.getCapabilities("video");    

            signalMessage(JSON.stringify({
                params: {
                    "sendVideoCaps": sendVideoCaps,
                    muxId: null
                }
            }));
        }

        audioReceiver = new RTCRtpReceiver(dtlsTr, "audio");         
        receiveAudioCaps = RTCRtpReceiver.getCapabilities("audio");  

        renderStream.addTrack(audioReceiver.track);

        signalMessage(JSON.stringify({
            params: {
                "receiveAudioCaps": receiveAudioCaps
            }
        }));

        if(allowBundle)
            videoReceiver = new RTCRtpReceiver(dtlsTr, "video");   
        else
            videoReceiver = new RTCRtpReceiver(dtlsTr_2, "video");   

        receiveVideoCaps = RTCRtpReceiver.getCapabilities("video");  

        renderStream.addTrack(videoReceiver.track);

        signalMessage(JSON.stringify({
            params: {
                "receiveVideoCaps": receiveVideoCaps
            }
        }));

        if(audioReceiver)
            if(remote_audioRecvParams){
                var remote = remote_audioRecvParams;
                var audioRecvParams = util.myCapsToRecvParams(receiveAudioCaps, remote.sendAudioCaps);
                audioRecvParams.muxId = remote.muxId;
                audioRecvParams.encodings.push(util.RTCRtpEncodingParameters(1001, 0, 0, 0, 1.0)); 
                audioReceiver.receive(audioRecvParams);
                trackCount++;
                if ( trackCount == 2) {
                    videoRenderer.srcObject = renderStream;
                }
            }

        if(videoReceiver)
            if(remote_videoRecvParams) {
                var remote = remote_videoRecvParams;
                var videoRecvParams = util.myCapsToRecvParams(receiveVideoCaps, remote.sendVideoCaps);
                videoRecvParams.muxId = remote.muxId;
                videoRecvParams.encodings.push(util.RTCRtpEncodingParameters(3003, 0, 0, 0, 1.0));
                videoReceiver.receive(videoRecvParams);
                trackCount++;
                if ( trackCount == 2) {
                    videoRenderer.srcObject = renderStream;
                }
            }

        if(audioSender)
            if( remote_audioSendParams ){
                var remote = remote_audioSendParams;
                var audioSendParams = util.myCapsToSendParams(sendAudioCaps, remote.receiveAudioCaps);
                audioSendParams.encodings.push(util.RTCRtpEncodingParameters(1001, 0, 0, 0, 1.0));
                audioSender.send(audioSendParams);
            }

        if(videoSender)
            if( remote_videoSendParams ) {
                var remote = remote_videoSendParams;
                var videoSendParams = util.myCapsToSendParams(sendVideoCaps, remote.receiveVideoCaps);
                videoSendParams.encodings.push(util.RTCRtpEncodingParameters(3003, 0, 0, 0, 1.0));
                videoSender.send(videoSendParams);
            }

    }

    function gotMediaError(e) {
        showMessage(e, true);
        addToLog("Error - gotMediaError: " + e);
        signalMessage(JSON.stringify({ "error": "Media error: " + e + "\n Please hang up and retry." }));
    }

    function updateSelfInformation(details) {

        if (details.id) {
            selfInfo.id = details.id;
            selfInfo.friendlyName = details.friendlyName;

            document.title = "ORTC " + details.friendlyName;
        }

    }

    function getPeerIdFromFname(fName) {
        var id = null;
        var elList = document.getElementsByTagName("span");

        for (var i = 0; i < elList.length; i++) {

            if (elList[i].innerText === fName || elList[i].innerHTML === fName) {
                id = elList[i].title;
                break;
            }
        }

        return id;
    }

    function validatePeer() {
        if (document.getElementById("connect_btn").value === "Connect") {
            var elId = document.getElementById("peer-id");
            var peerId = elId.title;
            var peerFname = elId.value;
            var peerKey = document.getElementById("peer-key").value;

            if (peerFname === "" || peerKey === "") {
                showMessage("Please provide peer details.", true);
            }
            else {
                if (!peerId) {
                    peerId = getPeerIdFromFname(peerFname);
                    elId.title = peerId;
                }

                peerInfo.id = peerId;
                peerInfo.friendlyName = peerFname;
                peerInfo.key = peerKey;

                signalMessage(JSON.stringify({
                    "peervalidaterequest": {
                        id: peerInfo.id,
                        friendlyName: peerInfo.friendlyName,
                        key: peerInfo.key
                    }
                }));
            }
        }
        else {
            signalMessage(JSON.stringify({
                "disconnect": {
                    id: peerInfo.id,
                    friendlyName: peerInfo.friendlyName,
                    key: peerInfo.key
                }
            }));

            closeConnection();
        }
    }

    function onConnectButtonPressed() {
      if (isConnected) {
        disconnectFromServer();
      }
      else {
        connectToServer();
      }
    }

    function onCallButtonPressed() {
       
      if (isBusy) {
        hangup();
      }
      else {
        call();
      }
    }

    function connectToServer() {
      if (sigCh) {
        var elServerAddress = document.getElementById("peer-id");
        var elServerPort = document.getElementById("peer-key");
        var info = JSON.stringify({
          address: elServerAddress.value,
          port: elServerPort.value
        });
        document.body.style.cursor = "wait";
        sigCh.start(info);
      }
    }

    function disconnectFromServer() {
      if (sigCh) {
        document.body.style.cursor = "wait";
        sigCh.close();
      }
    }

    function signalMessage(msg) {
        if (sigCh) {
            msg = JSON.parse(msg);
            msg.selfInfo = selfInfo;
            msg.peerInfo = peerInfo;
            sigCh.send(JSON.stringify(msg));
        }
    }

    util.myCapsToSendParams = function (sendCaps, remoteRecvCaps) {

        if (!sendCaps || !remoteRecvCaps) { return; }

        // compute intersection of both.
        return util.RTCRtpParameters("", util.filterCodecParams(sendCaps.codecs, remoteRecvCaps.codecs),
            util.filterHdrExtParams(sendCaps.headerExtensions, remoteRecvCaps.headerExtensions), [],
            util.RTCRtcpParameters(0, "", false, true));
    };

    // RTCRtpParameters
    util.RTCRtpParameters = function (inMuxId, inCodecs, inHeaderExtensions, inEncodings, inRtcp) {
        return {
            muxId: inMuxId || "",
            codecs: inCodecs,
            headerExtensions: inHeaderExtensions,
            encodings: inEncodings,
            rtcp: inRtcp
        };
    };

    // RTCRtpCodecParameters
    util.RTCRtpCodecParameters = function (inName, inPayloadType, inClockRate, inNumChannels, inRtcpFeedback, inParameters) {
        return {
            name: inName,
            payloadType: inPayloadType,
            clockRate: inClockRate,
            numChannels: inNumChannels,
            rtcpFeedback: inRtcpFeedback,
            parameters: inParameters
        };
    };

    // RTCRtcpParameters 
    util.RTCRtcpParameters = function (inSsrc, inCname, inReducecdSize, inMux) {
        return {
            ssrc: inSsrc,
            cname: inCname,
            reducedSize: inReducecdSize,
            mux: inMux
        };
    };

    util.myCapsToRecvParams = function (recvCaps, remoteSendCaps) {
        return util.myCapsToSendParams(remoteSendCaps, recvCaps);
    };

    util.filterCodecParams = function (left, right) {
        var codecPrms = [];

        if (left && right) {
            left.forEach(function (leftItem) {
                for (var i = 0; i < right.length; i++) {
                    var codec = right[i];
                    if (leftItem.name == codec.name && leftItem.kind === codec.kind &&
                        leftItem.preferredPayloadType === codec.preferredPayloadType &&
                        leftItem.numChannels === codec.numChannels) {

                        codecPrms.push(util.RTCRtpCodecParameters(codec.name, codec.preferredPayloadType,
                            codec.clockRate, codec.numChannels, codec.rtcpFeedback, codec.parameters));

                        break;
                    }
                }
            });
        }

        return codecPrms;
    };

    util.filterHdrExtParams = function (left, right) {

        var hdrExtPrms = [];

        return hdrExtPrms;
    };

    util.RTCRtpEncodingParameters = function (inSsrc, inCodecPayloadType, inFec, inRtx, inPriority, inMaxBitRate, inMinQuality, inFramerateBias, inResolutionScale, inFramerateScale, inQualityScale, inActive, inEncodingId, inDependencyEncodingIds) {
        return {
            ssrc: inSsrc,
            codecPayloadType: inCodecPayloadType,
            fec: inFec,
            rtx: inRtx,
            priority: inPriority || 1.0,
            maxBitrate: inMaxBitRate || 2000000.0,
            minQuality: inMinQuality || 0,
            framerateBias: inFramerateBias || 0.5,
            resolutionScale: inResolutionScale || 1.0,
            framerateScale: inFramerateScale || 1.0,
            active: inActive || true,
            encodingId: inEncodingId,
            dependencyEncodingId: inDependencyEncodingIds
        };
    };

    util.RTCIceServer = function (inUrls, inUsername, inCredentials) {
        return {
            urls: inUrls,
            username: inUsername,
            credentials: inCredentials
        };
    };

    util.RTCIceGatherOptions = function (inGatherPolicy, inIceServers) {
        return {
            gatherPolicy: inGatherPolicy,
            iceServers: inIceServers
        };
    };

}(typeof window === "object" ? window : global));