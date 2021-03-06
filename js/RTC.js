(function(global) {
  "use strict";

  var pc;
  var serverAddress;
  var serverPort;
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
  var localStream = null;
  var videoPreview = null;
  var selectedResolution = new Array();
  var renderStream = null;
  var previewStream = null;
  var trackCount = 0;
  var remote_audioRecvParams = null;
  var remote_videoRecvParams = null;
  var remote_audioSendParams = null;
  var remote_videoSendParams = null;
  var local_video_MST = null;
  var local_audio_MST = null;
  var supportedAudioCodecs = new Array();
  var supportedVideoCodecs = new Array();

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
  var selectedAudioCodec = null;
  var selectedVideoCodec = null;

  var trickleIce = true;
  var trickleCheckbox;
  var earlyCandidates = [];

  var util = {};
  var configuration;

  var mediaConstraints = {
    audio: true,
    video: {
      mandatory: {
        maxWidth: 640,
        maxHeight: 480
      },
      optional: []
    }
  };

  //Edge does not support stun server at this time
  if (window.navigator.userAgent.indexOf("Edge") > -1) {
    configuration = {
      gatherPolicy: "all",
      iceServers: [
        {
          urls: "turn:turn-testdrive.cloudapp.net:3478?transport=udp",
          username: "redmond",
          credential: "redmond123"
        }
      ]
    };
  } else {
    configuration = {
      gatherPolicy: "all",
      iceServers: [
        {
          urls: "stun: stun.l.google.com:19302"
        },
        {
          urls: "turn:turn-testdrive.cloudapp.net:3478?transport=udp",
          username: "redmond",
          credential: "redmond123"
        }
      ]
    };
  }
  window.onload = function() {
    document.getElementById("connect_btn").value = "Connect";
    document.getElementById("connect_btn").enabled;
    document.getElementById("call_btn").value = "Call";
    document.getElementById("call_btn").disabled;
    document.getElementById("phone_icon").style.backgroundImage =
      'url("./images/phone_icon_gray.png")';
    document.getElementById("changeName").style.display = "initial";
    document.getElementsByClassName("disable_mic")[0].style.display = "none";
    document.getElementsByClassName("disable_cam")[0].style.display = "none";
    trickleCheckbox = document.getElementById("toggleTrickleIce");
    if (!(checkIfORTC && checkIfWebRTC)) {
      document.getElementById("selectTechWrap").style.display = "none";
    }

    initialize();
  };

  function initialize() {
    try {
      serverAddress = document.getElementById("server_address").value;
      serverPort = document.getElementById("server_port").value;

      browserCodecs();

      document.getElementById("toggle_contacts").onclick = function() {
        toggleSidebar("contacts");
      };
      document.getElementById("toggle_options").onclick = function() {
        toggleSidebar("options");
      };
      document.getElementById("changeName").onsubmit = function() {
        changeName();
      };
      document
        .getElementById("connect_btn")
        .addEventListener("click", onConnectButtonPressed);

      document
        .getElementById("call_btn")
        .addEventListener("click", onCallButtonPressed);

      document
        .getElementById("resolution")
        .addEventListener("change", updateMediaConstraints);

      muteTracks();

      var ul = document.getElementById("contactList");
      ul.onclick = function(event) {
        var target = getEventTarget(event);
        selectedContactName = target.innerHTML;
        selectedContactId = contacts.get(selectedContactName);
      };

      global.fName = window.location.pathname.substring(
        window.location.pathname.indexOf("/", 0) + 1
      );

      contacts = new Map();
      sigCh = new global.SignallingChannel();
      sigCh.onmessage = handleMessages;

      if (localStorage["name"]) {
        document.getElementById("name").innerHTML = localStorage["name"];
      }
    } catch (e) {
      showMessage("Initilization error: " + e.message || e, true);
    }
  }

  function muteTracks() {
    let disableMic = document.getElementById("disable_mic");
    disableMic.onclick = function() {
      if (localStream !== null)
        if (localStream.getAudioTracks()[0].enabled) {
          localStream.getAudioTracks()[0].enabled = false;
          document.getElementById("disable_mic_icon").style.backgroundImage =
            'url("./images/microphone_icon_black.png")';
          console.log("Microphone disabled");
        } else {
          localStream.getAudioTracks()[0].enabled = true;
          document.getElementById("disable_mic_icon").style.backgroundImage =
            'url("./images/microphone_icon_red.png")';
          console.log("Microphone enabled");
        }

      if (local_audio_MST !== null) {
        if (local_audio_MST.enabled === false) {
          local_audio_MST.enabled = true;
          document.getElementById("disable_mic_icon").style.backgroundImage =
            'url("./images/microphone_icon_red.png")';
          console.log("Microphone enabled");
        } else {
          local_audio_MST.enabled = false;
          document.getElementById("disable_mic_icon").style.backgroundImage =
            'url("./images/microphone_icon_black.png")';
          console.log("Microphone disabled");
        }
      }
    };

    let disableCam = document.getElementById("disable_cam");
    disableCam.onclick = function() {
      if (localStream !== null)
        if (localStream.getVideoTracks()[0].enabled) {
          localStream.getVideoTracks()[0].enabled = false;
          document.getElementById("webcam_icon").style.backgroundImage =
            'url("./images/webcam_icon_black.png")';
          console.log("Camera disabled");
        } else {
          localStream.getVideoTracks()[0].enabled = true;
          document.getElementById("webcam_icon").style.backgroundImage =
            'url("./images/webcam_icon_red.png")';
          console.log("Camera enabled");
        }

      if (local_video_MST !== null) {
        if (local_video_MST.enabled === false) {
          local_video_MST.enabled = true;
          document.getElementById("webcam_icon").style.backgroundImage =
            'url("./images/webcam_icon_red.png")';
          console.log("Camera enabled");
        } else {
          local_video_MST.enabled = false;
          document.getElementById("webcam_icon").style.backgroundImage =
            'url("./images/webcam_icon_black.png")';
          console.log("Camera disabled");
        }
      }
    };
  }
  function updateMediaConstraints() {
    let resolution = document.getElementById("resolution");
    let selectedOption = resolution.options[resolution.selectedIndex].value;
    
    selectedResolution["width"] = selectedOption.substr(
      0.0,
      selectedOption.indexOf("x")
    );

    selectedResolution["height"] = selectedOption.substr(
      selectedOption.indexOf("x") + 1,
      selectedOption.length
    );

    let constraints = new Object();
    constraints.audio = true;
    constraints.video = new Object();

    if (document.getElementById("webcam_selected").checked) {
      constraints.audio = true;
      constraints.video.width = { max: selectedResolution["width"] };
      constraints.video.height = { max: selectedResolution["height"] };
    } else if(
      "getDisplayMedia" in window.navigator &&
      document.getElementById("screen_selected").checked){        
        constraints.video = true;
    }
     else {
        if (adapter.browserDetails.browser == "firefox") {
          constraints.video.mediaSource = "screen";
        } else if (adapter.browserDetails.browser == "chrome") {
          constraints.audio = false;
          constraints.video.mandatory = {chromeMediaSource: "desktop"};
        } else {
          constraints.audio = false;
          constraints.video.mandatory = {chromeMediaSource: "screen"};
        }      
    }
    mediaConstraints = JSON.parse(JSON.stringify(constraints));
    console.log(mediaConstraints);
    console.log("Media constraints changed.");
  }

  /*=========================================
=            Connect to server            =
=========================================*/

  function onConnectButtonPressed() {
    if (isConnected) {
      disconnectFromServer();
    } else {
      connectToServer();
    }
  }

  function connectToServer() {
    if (sigCh) {
      serverAddress = document.getElementById("server_address").value;
      serverPort = document.getElementById("server_port").value;
      var elServerAddress = serverAddress;
      var elServerPort = serverPort;
      var info = JSON.stringify({
        address: elServerAddress,
        port: elServerPort
      });
      document.body.style.cursor = "progress";

      document.getElementById("changeName").style.display = "none";

      sigCh.start(info);
      toggleSidebar("contacts", true);
    }
  }

  function disconnectFromServer() {
    if (sigCh) {
      document.body.style.cursor = "progress";
      sigCh.close();
      document.getElementById("changeName").style.display = "initial";
      toggleSidebar("contacts", false);
    }
  }

  function updateServerStatus(on) {
    if (on) {
      document.getElementById("connect_btn").value = "Connect";
      isConnected = false;
      document.body.style.cursor = "default";
    } else {
      document.getElementById("connect_btn").value = "Disconnect";
      isConnected = true;
      document.body.style.cursor = "default";

      document.getElementById("call_btn").disabled = false;
      showMessage("Connected to Peer Connection Server");
      document.getElementById("phone_icon").style.backgroundImage =
        'url("./images/phone_icon_green.png")';
    }
  }

  function clearPeerDetails() {
    var elPeerId = serverAddress;

    if (elPeerId) {
      elPeerId.value = "";
      elPeerId.title = "";
    }

    peerInfo = {};
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
    pc = null;

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
    selectedContactName = null;
    selectedContactId = null;

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

    if (previewStream) {
      previewStream = null;
    }
    if (local_video_MST) {
      local_video_MST.stop();
      local_video_MST = null;
    }
    if (local_audio_MST) {
      local_audio_MST.stop();
      local_audio_MST = null;
    }
    trackCount = 0;

    // reset video tags and release capture devices
    if (videoRenderer) {
      videoRenderer.src = null;
      videoRenderer.srcObject = null;
      videoRenderer = null;
    }
    if (videoPreview) {
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

    if (!softClose) {
      if (pc) {
        pc.close();
      }
      selfInfo = {};
      window.location.reload();
    }

    updateCallStatus(true);
  }

  function updateSelfInformation(details) {
    if (details.id) {
      selfInfo.id = details.id;
      selfInfo.friendlyName = details.friendlyName;
    }
  }

  /*=====  End of Connect to server  ======*/

  /*=================================
=            Call peer            =
=================================*/

  function getEventTarget(e) {
    e = e || window.event;
    return e.target || e.srcElement;
  }

  function onCallButtonPressed() {
    if (isBusy) {
      hangup();
    } else {
      call();
    }
  }

  function call() {
    if (selectedContactId === null || selectedContactName === null) {
      alert("Please select contact before making call.");
    } else {
      if (!pc && checkIfWebRTC) startWebRTC();
      peerInfo.id = selectedContactId;
      peerInfo.friendlyName = selectedContactName;
      toggleSidebar("contacts", false);
      if (
        checkPeerSupport(JSON.stringify(peerInfo.friendlyName)) !== false &&
        checkIfORTC &&
        document.getElementById("ORTC_selected").checked
      ) {
        signalMessage(
          JSON.stringify({
            connectrequest: "connectrequest",
            peerId: peerInfo.id
          })
        );
      } else getMedia();
    }
  }

  function hangup() {
    if (isBusy) {
      signalMessage(JSON.stringify({ disconnect: "disconnect" }));
    } else {
      alert("Not in call, cannot hangup");
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

  function updateCallStatus(on) {
    if (on) {
      document.getElementById("phone_icon").style.backgroundImage =
        'url("./images/phone_icon_green.png")';
      document.getElementsByClassName("disable_mic")[0].style.display = "none";
      document.getElementsByClassName("disable_cam")[0].style.display = "none";
      isBusy = false;
    } else {
      document.getElementById("phone_icon").style.backgroundImage =
        'url("./images/phone_icon_red.png")';
      document.getElementsByClassName("disable_mic")[0].style.display = "block";
      document.getElementsByClassName("disable_cam")[0].style.display = "block";
      isBusy = true;
      document.body.style.cursor = "progress";
    }
  }

  function handleCallRequest(message) {
    showMessage(
      "Peer: " + message.connectrequest.peerInfo.id + " requested to connect."
    );

    if (isBusy) {
      peerInfo = message.connectrequest.peerInfo;

      // reject
      signalMessage(
        JSON.stringify({
          connectresponse: "reject"
        })
      );

      peerInfo = {};
      showMessage(
        "Rejected Peer: " +
          message.connectrequest.peerInfo.id +
          " connection request."
      );
    } else {
      // accept
      peerInfo = message.connectrequest.peerInfo;

      signalMessage(
        JSON.stringify({
          connectresponse: "accept"
        })
      );

      showMessage(
        "Accepted Peer: " +
          message.connectrequest.peerInfo.id +
          " connection request."
      );

      toggleSidebar("contacts", false);
    }
  }

  //Used by both ORTC and WebRTC
  function gotMediaError(e) {
    showMessage(e, true);
    console.log("Error - gotMediaError: " + e);
    signalMessage(
      JSON.stringify({
        error: "Media error: " + e + "\n Please hang up and retry."
      })
    );
  }

  /*===================================
=            Webrtc part            =
===================================*/

  function startWebRTC() {
    pc = new RTCPeerConnection(configuration);

    if (trickleCheckbox.checked) trickleIce = true;
    else trickleIce = false;

    pc.onicegatheringstatechange = function() {
      if (pc.iceGatheringState === "complete" && !trickleIce) {
        signalMessage(
          JSON.stringify({
            sdp: pc.localDescription
          })
        );
      }
    };

    //display remote track in the video element
    pc.ontrack = function(event) {
      videoRenderer = document.getElementById("rtcRenderer");
      videoRenderer.srcObject = event.streams[0];
      console.log("Remote track resceved");
      document.body.style.cursor = "default";
    };
    updateServerStatus();
  }

  function getMedia() {
    // Get a local stream
    updateMediaConstraints();
    if (
      "getDisplayMedia" in window.navigator &&
      document.getElementById("screen_selected").checked
    ) {
      navigator
        .getDisplayMedia(mediaConstraints)
        .then(gotMediaSDP)
        .catch(gotMediaError);
    } else {
      navigator.mediaDevices
        .getUserMedia(mediaConstraints)
        .then(gotMediaSDP)
        .catch(gotMediaError);
    }
  }

  function gotMediaSDP(stream) {
    updateCallStatus();

    //add local stream to the video element.
    localStream = stream;

    //add local stream to the RTCPeerConnection
    localStream.getTracks().forEach(function(track) {
      console.log("Using device: " + track.label);
      pc.addTrack(track, localStream);
    });

    videoPreview = document.getElementById("previewVideo");
    videoPreview.srcObject = localStream;

    if (pc.remoteDescription && pc.remoteDescription.type === "offer")
      pc.createAnswer({ iceRestart: true }).then(localDescCreated, logError);
    else pc.createOffer({ iceRestart: true }).then(localDescCreated, logError);
  }

  //function called upon successful creation of offer or answer
  function localDescCreated(desc) {
    getSelectedCodecs();

    if (selectedAudioCodec !== "Default" || selectedVideoCodec !== "Default") {
      desc = changeSdpCodec(desc);
    }

    pc.setLocalDescription(
      desc,
      function() {
        if (trickleIce) {
          signalMessage(
            JSON.stringify({
              sdp: desc
            })
          );
        }
      },
      logError
    );

    // send ice candidates to the other peer
    if (trickleIce) {
      pc.onicecandidate = function(evt) {
        signalMessage(
          JSON.stringify({
            candidateSDP: evt.candidate
          })
        );
      };
    } else
      pc.onicecandidate = function(evt) {
        return pc.localDescription;
      };
  }

  function getSelectedCodecs() {
    selectedAudioCodec = audioCodec.options[audioCodec.selectedIndex].value;
    selectedVideoCodec = videoCodec.options[videoCodec.selectedIndex].value;
  }

  function browserCodecs() {
    supportedAudioCodecs.push("Default");
    supportedVideoCodecs.push("Default");
    if (window.navigator.userAgent.indexOf("Edge") > -1) {
      supportedAudioCodecs.push("opus/48000/2");
      supportedAudioCodecs.push("SILK/16000");
      supportedAudioCodecs.push("SILK/8000");
      supportedAudioCodecs.push("PCMU/8000");
      supportedAudioCodecs.push("PCMA/8000");

      supportedVideoCodecs.push("X-H264UC/90000");
      supportedVideoCodecs.push("H264/90000");
      supportedVideoCodecs.push("VP8/90000");
    } else if (
      navigator.userAgent.indexOf("Chrome") > -1 ||
      navigator.userAgent.indexOf("OPR") !== -1
    ) {
      supportedAudioCodecs.push("opus/48000/2");
      supportedAudioCodecs.push("ISAC/16000");
      supportedAudioCodecs.push("ISAC/32000");
      supportedAudioCodecs.push("G722/8000");
      supportedAudioCodecs.push("PCMU/8000");
      supportedAudioCodecs.push("PCMA/8000");

      supportedVideoCodecs.push("H264/90000");
      supportedVideoCodecs.push("VP9/90000");
      supportedVideoCodecs.push("VP8/90000");
    } else if (navigator.userAgent.indexOf("Firefox") > -1) {
      supportedAudioCodecs.push("opus/48000/2");
      supportedAudioCodecs.push("G722/8000");
      supportedAudioCodecs.push("PCMU/8000");
      supportedAudioCodecs.push("PCMA/8000");

      supportedVideoCodecs.push("H264/90000");
      supportedVideoCodecs.push("VP9/90000");
      supportedVideoCodecs.push("VP8/90000");
    }
    let selectAudioCodec = document.getElementById("audioCodec");
    supportedAudioCodecs.forEach(function(codecName) {
      let option = document.createElement("option");
      option.text = codecName;
      option.value = codecName;
      selectAudioCodec.add(option);
    });

    let selectVideoCodec = document.getElementById("videoCodec");
    supportedVideoCodecs.forEach(function(codecName) {
      let option = document.createElement("option");
      option.text = codecName;
      option.value = codecName;
      selectVideoCodec.add(option);
    });
  }

  //clear blank elements from array
  function cleanArray(sourceArr) {
    var newArray = new Array();
    for (var i = 0; i < sourceArr.length; i++) {
      if (sourceArr[i]) {
        newArray.push(sourceArr[i]);
      }
    }
    return newArray;
  }

  function changeSdpCodec(SDP) {
    //Convert sdp into array
    let sdpArr = SDP.sdp.split("\r\n");

    let audioCodecIndex;
    let videoCodecIndex;
    sdpArr.forEach(function(element, index) {
      //get index of line with audio and video codecs order in sdp(array)
      if (element.includes("m=audio")) audioCodecIndex = index;

      if (element.includes("m=video")) videoCodecIndex = index;
    });

    let audioCodec = document.getElementById("audioCodec");

    //get the order of audio codecs from the m=audio line in sdp
    let audioCodecOrder = sdpArr[audioCodecIndex].substring(
      sdpArr[audioCodecIndex].indexOf("UDP/TLS/RTP/SAVPF") + 18,
      sdpArr[audioCodecIndex].length
    );

    audioCodecOrder = audioCodecOrder.split(" ");

    let audioCodecList = [];

    //get the list of codecs from sdp by comparing every elemend
    //of sdp array with every element of the audioCodecOrder array
    sdpArr.forEach(function(element, index) {
      audioCodecOrder.forEach(function(codecNo, codecNoIndex) {
        supportedAudioCodecs.forEach(function(supportedCodec) {
          if (element.includes("a=rtpmap:" + codecNo) && codecNo) {
            let codecName = element.substring(element.indexOf(" ") + 1);

            if (supportedCodec === codecName && codecName)
              if (audioCodecList[supportedCodec])
                audioCodecList[supportedCodec].push(codecNo);
              else audioCodecList[supportedCodec] = [codecNo];
          }
        });
      });
    });
    audioCodecOrder = " " + audioCodecOrder.join(" ");

    //change order of codecs from the selected if the selected codec is supported
    for (let key in audioCodecList) {
      if (key === selectedAudioCodec) {
        audioCodecList[key].forEach(function(codeElement, codeIndex) {
          audioCodecOrder = audioCodecOrder.replace(codeElement + " ", "");
          audioCodecOrder = " " + codeElement + audioCodecOrder;
        });
      }
    }

    //replace the initial order of codecs with the new one in m=audio line in sdp
    sdpArr[audioCodecIndex] =
      sdpArr[audioCodecIndex].substring(
        0,
        sdpArr[audioCodecIndex].indexOf("UDP/TLS/RTP/SAVPF") + 17
      ) + audioCodecOrder;

    let videoCodec = document.getElementById("videoCodec");

    //get the order of video codecs from the m=video line in sdp
    let videoCodecOrder = sdpArr[videoCodecIndex].substring(
      sdpArr[videoCodecIndex].indexOf("UDP/TLS/RTP/SAVPF") + 18,
      sdpArr[videoCodecIndex].length
    );
    videoCodecOrder = videoCodecOrder.split(" ");

    let videoCodecList = [];

    //get the list of codecs from sdp by comparing every elemend
    //of sdp array with every element of the videoCodecOrder array
    sdpArr.forEach(function(element, index) {
      videoCodecOrder.forEach(function(codecNo, codecNoIndex) {
        supportedVideoCodecs.forEach(function(supportedCodec) {
          if (element.includes("a=rtpmap:" + codecNo) && codecNo) {
            let codecName = element.substring(element.indexOf(" ") + 1);

            if (supportedCodec === codecName && codecName)
              if (videoCodecList[supportedCodec])
                videoCodecList[supportedCodec].push(codecNo);
              else videoCodecList[supportedCodec] = [codecNo];
          }
        });
      });
    });
    videoCodecOrder = " " + videoCodecOrder.join(" ");

    //change order of codecs if the selected codec is supported
    for (let key in videoCodecList) {
      if (key === selectedVideoCodec) {
        videoCodecList[key].forEach(function(codeElement, codeIndex) {
          videoCodecOrder = videoCodecOrder.replace(codeElement + " ", "");
          videoCodecOrder = " " + codeElement + videoCodecOrder;
        });
      }
    }

    //replace the initial order of codecs with the new one in m=video line in sdp
    sdpArr[videoCodecIndex] =
      sdpArr[videoCodecIndex].substring(
        0,
        sdpArr[videoCodecIndex].indexOf("UDP/TLS/RTP/SAVPF") + 17
      ) + videoCodecOrder;

    sdpArr = cleanArray(sdpArr);
    sdpArr = sdpArr.join("\r\n") + "\r\n";

    SDP.sdp = sdpArr;

    return SDP;
  }

  /*=====  End of Webrtc part  ======*/

  /*=================================
=            ORTC part            =
=================================*/

  function initiateConnection() {
    updateCallStatus();

    iceGathr = new RTCIceGatherer(configuration);
    iceTr = new RTCIceTransport();
    dtlsTr = new RTCDtlsTransport(iceTr);

    if (!allowBundle) {
      iceGathr_2 = new RTCIceGatherer(configuration);
      iceTr_2 = new RTCIceTransport();
      dtlsTr_2 = new RTCDtlsTransport(iceTr_2);
    }

    // Apply any local ICE candidate and send it to the remote
    iceGathr.onlocalcandidate = function(evt) {
      signalMessage(JSON.stringify({ candidate: evt.candidate }));

      localCandidatesCreated = false;

      if (Object.keys(evt.candidate).length === 0) {
        localCandidatesCreated = true;

        console.log("End of local ICE candidates");

        signalMessage(
          JSON.stringify({
            params: {
              ice: iceGathr.getLocalParameters(),
              dtls: dtlsTr.getLocalParameters()
            }
          })
        );

        if (remoteIceParams) {
          iceTr.start(
            iceGathr,
            remoteIceParams,
            selfInfo.dtlsRole && selfInfo.dtlsRole === "client"
              ? "controlled"
              : "controlling"
          );

          dtlsTr.start(remoteDtlsParams);
        }
      } else {
        console.log(
          "Local ICE candidate: " + evt.candidate.ip + ":" + evt.candidate.port
        );
      }
    };

    if (!allowBundle)
      iceGathr_2.onlocalcandidate = function(evt) {
        signalMessage(JSON.stringify({ candidate_2: evt.candidate }));

        localCandidatesCreated_2 = false;

        if (Object.keys(evt.candidate).length === 0) {
          localCandidatesCreated_2 = true;

          console.log("End of local ICE candidates_2");

          signalMessage(
            JSON.stringify({
              params: {
                ice_2: iceGathr_2.getLocalParameters(),
                dtls_2: dtlsTr_2.getLocalParameters()
              }
            })
          );

          if (remoteIceParams_2) {
            iceTr_2.start(
              iceGathr_2,
              remoteIceParams_2,
              selfInfo.dtlsRole && selfInfo.dtlsRole === "client"
                ? "controlled"
                : "controlling"
            );

            dtlsTr_2.start(remoteDtlsParams_2);
          }
        } else {
          console.log(
            "Local ICE candidate_2: " +
              evt.candidate.ip +
              ":" +
              evt.candidate.port
          );
        }
      };

    updateMediaConstraints();
    // Get a local stream
    renderStream = new MediaStream();
    navigator.mediaDevices
      .getUserMedia(mediaConstraints)
      .then(gotMedia)
      .catch(gotMediaError);
    videoRenderer = document.getElementById("rtcRenderer");

    // ice state has changed
    iceTr.onicestatechange = function(evt) {
      console.log("ICE state changed to |" + iceTr.state + "|");
      document.body.style.cursor = "default";

      if (iceTr.state === "connected") {
        console.log("ICE transport has been established");
        showMessage("ICE: Connection with peer established.");
      }

      if (iceTr.state === "disconnected") {
        showMessage(
          "Failed to establish connection with peer. Please disconnect and try again.",
          true
        );

        iceTr = null;
      }
    };

    if (!allowBundle)
      iceTr_2.onicestatechange = function(evt) {
        console.log("ICE_2 state changed to |" + iceTr_2.state + "|");
        document.body.style.cursor = "default";

        if (iceTr_2.state === "connected") {
          console.log("ICE_2 transport has been established");
          showMessage("ICE: Connection with peer established.");
        }

        if (iceTr_2.state === "disconnected") {
          showMessage(
            "Failed to establish connection with peer. Please disconnect and try again.",
            true
          );

          iceTr_2 = null;
        }
      };

    iceTr.oncandidatepairchange = function(evt) {
      console.log("ICE candidate pair changed to: " + JSON.stringify(evt.pair));
    };

    if (!allowBundle)
      iceTr_2.oncandidatepairchange = function(evt) {
        console.log(
          "ICE candidate_2 pair changed to: " + JSON.stringify(evt.pair)
        );
      };

    iceGathr.onerror = function(evt) {
      showMessage(
        "ICE transport failed. Please disconnect and try again.",
        true
      );
    };

    if (!allowBundle)
      iceGathr_2.onerror = function(evt) {
        showMessage(
          "ICE_2 transport failed. Please disconnect and try again.",
          true
        );
      };

    // dtls state has changed
    dtlsTr.ondtlsstatechange = function(evt) {
      console.log("DTLS state changed to |" + dtlsTr.state + "|");
      document.body.style.cursor = "default";

      if (dtlsTr.state === "connected") {
        console.log("DTLS transport has been established");
        showMessage("Connection with peer established.");
      }

      if (dtlsTr.state === "disconnected" || dtlsTr.state === "closed") {
        console.log("DTLS transport has been lost");
        showMessage(
          "Connection with peer lost. Please disconnect and try again.",
          true
        );

        dtlsTr = null;
      }
    };

    if (!allowBundle)
      dtlsTr_2.ondtlsstatechange = function(evt) {
        console.log("DTLS_2 state changed to |" + dtlsTr_2.state + "|");
        document.body.style.cursor = "default";

        if (dtlsTr_2.state === "connected") {
          console.log("DTLS_2 transport has been established");
          showMessage("Connection with peer established.");
        }

        if (dtlsTr_2.state === "disconnected" || dtlsTr_2.state === "closed") {
          console.log("DTLS_2 transport has been lost");
          showMessage(
            "Connection with peer lost. Please disconnect and try again.",
            true
          );

          dtlsTr = null;
        }
      };

    dtlsTr.onerror = function(evt) {
      showMessage(
        "DTLS transport failed. Please disconnect and try again.",
        true
      );
    };

    if (!allowBundle)
      dtlsTr_2.onerror = function(evt) {
        showMessage(
          "DTLS_2 transport failed. Please disconnect and try again.",
          true
        );
      };
  }

  function gotMedia(stream) {
    var audioTracks = stream.getAudioTracks();

    if (audioTracks.length > 0) {
      var audioTrack = audioTracks[0];
      local_audio_MST = audioTrack;

      audioSender = new RTCRtpSender(audioTrack, dtlsTr);
      sendAudioCaps = RTCRtpSender.getCapabilities("audio");

      signalMessage(
        JSON.stringify({
          params: {
            sendAudioCaps: sendAudioCaps,
            muxId: null
          }
        })
      );
    }

    var videoTracks = stream.getVideoTracks();

    if (videoTracks.length > 0) {
      var videoTrack = videoTracks[0];
      local_video_MST = videoTrack;

      if (allowPreview) {
        previewStream = new MediaStream();
        previewStream.addTrack(local_video_MST);
        videoPreview = document.getElementById("previewVideo");
        videoPreview.srcObject = previewStream;
      }

      if (allowBundle) videoSender = new RTCRtpSender(videoTrack, dtlsTr);
      else videoSender = new RTCRtpSender(videoTrack, dtlsTr_2);

      sendVideoCaps = RTCRtpSender.getCapabilities("video");

      signalMessage(
        JSON.stringify({
          params: {
            sendVideoCaps: sendVideoCaps,
            muxId: null
          }
        })
      );
    }

    audioReceiver = new RTCRtpReceiver(dtlsTr, "audio");
    receiveAudioCaps = RTCRtpReceiver.getCapabilities("audio");

    renderStream.addTrack(audioReceiver.track);

    signalMessage(
      JSON.stringify({
        params: {
          receiveAudioCaps: receiveAudioCaps
        }
      })
    );

    if (allowBundle) videoReceiver = new RTCRtpReceiver(dtlsTr, "video");
    else videoReceiver = new RTCRtpReceiver(dtlsTr_2, "video");

    receiveVideoCaps = RTCRtpReceiver.getCapabilities("video");

    renderStream.addTrack(videoReceiver.track);

    signalMessage(
      JSON.stringify({
        params: {
          receiveVideoCaps: receiveVideoCaps
        }
      })
    );

    if (audioReceiver)
      if (remote_audioRecvParams) {
        var remote = remote_audioRecvParams;
        var audioRecvParams = util.myCapsToRecvParams(
          receiveAudioCaps,
          remote.sendAudioCaps
        );

        audioRecvParams.muxId = remote.muxId;

        audioRecvParams.encodings.push(
          util.RTCRtpEncodingParameters(1001, 0, 0, 0, 1.0)
        );

        audioReceiver.receive(audioRecvParams);
        trackCount++;
        if (trackCount === 2) {
          videoRenderer.srcObject = renderStream;
        }
      }

    if (videoReceiver)
      if (remote_videoRecvParams) {
        remote = remote_videoRecvParams;
        var videoRecvParams = util.myCapsToRecvParams(
          receiveVideoCaps,
          remote.sendVideoCaps
        );

        videoRecvParams.muxId = remote.muxId;

        videoRecvParams.encodings.push(
          util.RTCRtpEncodingParameters(3003, 0, 0, 0, 1.0)
        );

        videoReceiver.receive(videoRecvParams);
        trackCount++;
        if (trackCount === 2) {
          videoRenderer.srcObject = renderStream;
        }
      }

    if (audioSender)
      if (remote_audioSendParams) {
        remote = remote_audioSendParams;
        var audioSendParams = util.myCapsToSendParams(
          sendAudioCaps,
          remote.receiveAudioCaps
        );

        audioSendParams.encodings.push(
          util.RTCRtpEncodingParameters(1001, 0, 0, 0, 1.0)
        );

        audioSender.send(audioSendParams);
      }

    if (videoSender)
      if (remote_videoSendParams) {
        remote = remote_videoSendParams;
        var videoSendParams = util.myCapsToSendParams(
          sendVideoCaps,
          remote.receiveVideoCaps
        );

        videoSendParams.encodings.push(
          util.RTCRtpEncodingParameters(3003, 0, 0, 0, 1.0)
        );

        videoSender.send(videoSendParams);
      }
  }

  util.myCapsToSendParams = function(sendCaps, remoteRecvCaps) {
    if (!sendCaps || !remoteRecvCaps) {
      return;
    }

    // compute intersection of both.
    return util.RTCRtpParameters(
      "",
      util.filterCodecParams(sendCaps.codecs, remoteRecvCaps.codecs),
      util.filterHdrExtParams(
        sendCaps.headerExtensions,
        remoteRecvCaps.headerExtensions
      ),
      [],
      util.RTCRtcpParameters(0, "", false, true)
    );
  };

  util.RTCRtpParameters = function(
    inMuxId,
    inCodecs,
    inHeaderExtensions,
    inEncodings,
    inRtcp
  ) {
    return {
      muxId: inMuxId || "",
      codecs: inCodecs,
      headerExtensions: inHeaderExtensions,
      encodings: inEncodings,
      rtcp: inRtcp
    };
  };

  util.RTCRtpCodecParameters = function(
    inName,
    inPayloadType,
    inClockRate,
    inNumChannels,
    inRtcpFeedback,
    inParameters
  ) {
    return {
      name: inName,
      payloadType: inPayloadType,
      clockRate: inClockRate,
      numChannels: inNumChannels,
      rtcpFeedback: inRtcpFeedback,
      parameters: inParameters
    };
  };

  util.RTCRtcpParameters = function(inSsrc, inCname, inReducecdSize, inMux) {
    return {
      ssrc: inSsrc,
      cname: inCname,
      reducedSize: inReducecdSize,
      mux: inMux
    };
  };

  util.myCapsToRecvParams = function(recvCaps, remoteSendCaps) {
    return util.myCapsToSendParams(remoteSendCaps, recvCaps);
  };

  util.filterCodecParams = function(left, right) {
    var codecPrms = [];

    if (left && right) {
      left.forEach(function(leftItem) {
        for (var i = 0; i < right.length; i++) {
          var codec = right[i];
          if (
            leftItem.name === codec.name &&
            leftItem.kind === codec.kind &&
            leftItem.preferredPayloadType === codec.preferredPayloadType &&
            leftItem.numChannels === codec.numChannels
          ) {
            codecPrms.push(
              util.RTCRtpCodecParameters(
                codec.name,
                codec.preferredPayloadType,
                codec.clockRate,
                codec.numChannels,
                codec.rtcpFeedback,
                codec.parameters
              )
            );

            break;
          }
        }
      });
    }

    return codecPrms;
  };

  util.filterHdrExtParams = function(left, right) {
    var hdrExtPrms = [];

    return hdrExtPrms;
  };

  util.RTCRtpEncodingParameters = function(
    inSsrc,
    inCodecPayloadType,
    inFec,
    inRtx,
    inPriority,
    inMaxBitRate,
    inMinQuality,
    inFramerateBias,
    inResolutionScale,
    inFramerateScale,
    inQualityScale,
    inActive,
    inEncodingId,
    inDependencyEncodingIds
  ) {
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

  util.RTCIceServer = function(inUrls, inUsername, inCredentials) {
    return {
      urls: inUrls,
      username: inUsername,
      credentials: inCredentials
    };
  };

  util.RTCIceGatherOptions = function(inGatherPolicy, inIceServers) {
    return {
      gatherPolicy: inGatherPolicy,
      iceServers: inIceServers
    };
  };

  /*=====  End of ORTC part  ======*/

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
    console.warn(error.name + ": " + error.message);
  }

  // Function that handles messages received through signaling channel(server)
  function handleMessages(evt) {
    if (!pc && checkIfWebRTC) startWebRTC();
    var message = JSON.parse(evt.data);

    console.log(JSON.stringify(message));

    if (message.contacts) {
      var values = message.contacts.split("\n");
      for (var i = 0; i < values.length; i++) {
        if (values[i] !== "") {
          var peer_information = values[0].split(",");

          if (peer_information[2] === "0") {
            contacts.delete(peer_information[0]);

            var item = document.getElementById("contact" + peer_information[1]);
            item.parentNode.removeChild(item);
          } else {
            contacts.set(peer_information[0], peer_information[1]);

            ul = document.getElementById("contactList");
            var li = document.createElement("li");

            li.setAttribute("id", "contact" + peer_information[1]);
            li.className = "contact";

            var a = document.createElement("a");
            a.textContent = peer_information[0];
            a.setAttribute("href", "#");
            li.appendChild(a);
            ul.appendChild(li);
          }
        }
      }
    }

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
      } else {
        clearPeerDetails();
        showMessage("Invalid peer details.", true);
      }
    }

    if (message.connectrequest) {
      handleCallRequest(message);
      if (
        checkPeerSupport(JSON.stringify(peerInfo.friendlyName)) !== false &&
        checkIfORTC
      ) {
        selfInfo.dtlsRole = "client";
        initiateConnection();
      }
    }

    if (message.connectresponse) {
      if (message.connectresponse === "reject") {
        showMessage("Peer rejected offer.", true);
        clearPeerDetails();
      } else if (message.connectresponse === "accept") {
        if (
          checkPeerSupport(JSON.stringify(peerInfo.friendlyName)) !== false &&
          checkIfORTC
        ) {
          selfInfo.dtlsRole = "server";
          initiateConnection();
        } else getMedia();
      } else {
        showMessage("Bad response", true);
      }
    }

    if (
      message.start &&
      checkPeerSupport(JSON.stringify(peerInfo.friendlyName)) !== false &&
      checkIfORTC
    ) {
      selfInfo.dtlsRole = message.dtlsrole;
      initiateConnection();
    }

    if (message.disconnect && isBusy) {
      if (!pc.localDescription) {
        showMessage(
          "Peer terminated connection. Please disconnect and try again."
        );
      } else {
        showMessage("Peer terminated connection.");
      }
      closeConnection(true);
    }

    if (message.serverDisconnected) {
      showMessage("Disconnected from Peer Connection Server");
      if (isBusy) {
        closeConnection();
      } else {
        document.getElementById("call_btn").disabled = true;
        document.getElementById("phone_icon").style.backgroundImage =
          'url("./images/phone_icon_gray.png")';
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

    //when resceiving candidates from WebRTC
    if (message.DirectCandidate && (!iceTr || !dtlsTr)) {
      //fixes DOMException: Error processing ICE candidate
      //by only setting candidates when remoteDescription is not set
      if (pc.remoteDescription && pc.remoteDescription.type) {
        console.log(
          "Remote SDP candidate:\n" + JSON.stringify(message.DirectCandidate)
        );
        pc.addIceCandidate(new RTCIceCandidate(message.DirectCandidate));
      } else {
        console.log("Ice candidate postponed!");
        earlyCandidates.push(message.DirectCandidate);
      }
    }

    if (message.SDP) {
      getSelectedCodecs();

      if (
        selectedAudioCodec !== "Default" ||
        selectedVideoCodec !== "Default"
      ) {
        message.SDP = changeSdpCodec(message.SDP);
      }

      peerInfo = message.SDP.peerInfo;

      //set remote description after getting offer or answer from the other peer
      pc.setRemoteDescription(
        message.SDP,
        function() {
          if (earlyCandidates.length > 0) {
            earlyCandidates.forEach(function(candidate) {
              pc.addIceCandidate(new RTCIceCandidate(candidate));
              console.log("Postponed ice candidate added.");
            });
          } else {
            console.log("No early ice candidates to add.");
          }

          // if we received an offer, we need set up the stream to send the answer
          if (pc.remoteDescription.type === "offer") {
            getMedia();
          }
        },
        logError
      );
      toggleSidebar("contacts", false);
    }

    if (iceTr && dtlsTr) {
      if (message.candidate) {
        console.log(
          "Remote ICE candidate: " +
            message.candidate.ip +
            ":" +
            message.candidate.port
        );

        if (Object.keys(message.candidate).length > 0) {
          remoteCandidates.push(message.candidate);
        } else {
          iceTr.setRemoteCandidates(remoteCandidates);
        }
      }

      if (message.params) {
        var remote = message.params;

        if (remote.ice) {
          remoteIceParams = remote.ice;
          remoteDtlsParams = remote.dtls;

          if (localCandidatesCreated) {
            iceTr.start(
              iceGathr,
              remoteIceParams,
              selfInfo.dtlsRole && selfInfo.dtlsRole === "client"
                ? "controlled"
                : "controlling"
            );
            dtlsTr.start(remoteDtlsParams);
          }
        }

        if (remote.sendAudioCaps) {
          if (audioReceiver) {
            var audioRecvParams = util.myCapsToRecvParams(
              receiveAudioCaps,
              remote.sendAudioCaps
            );
            audioRecvParams.muxId = remote.muxId;
            audioRecvParams.encodings.push(
              util.RTCRtpEncodingParameters(1001, 0, 0, 0, 1.0)
            );
            audioReceiver.receive(audioRecvParams);

            trackCount++;
            if (trackCount === 2) {
              videoRenderer.srcObject = renderStream;
            }
          } else {
            remote_audioRecvParams = remote;
          }
        }

        if (remote.sendVideoCaps) {
          if (videoReceiver) {
            var videoRecvParams = util.myCapsToRecvParams(
              receiveVideoCaps,
              remote.sendVideoCaps
            );
            videoRecvParams.muxId = remote.muxId;
            videoRecvParams.encodings.push(
              util.RTCRtpEncodingParameters(3003, 0, 0, 0, 1.0)
            );
            videoReceiver.receive(videoRecvParams);

            trackCount++;
            if (trackCount === 2) {
              videoRenderer.srcObject = renderStream;
            }
          } else {
            remote_videoRecvParams = remote;
          }
        }

        if (remote.receiveAudioCaps) {
          if (audioSender) {
            var audioSendParams = util.myCapsToSendParams(
              sendAudioCaps,
              remote.receiveAudioCaps
            );
            audioSendParams.encodings.push(
              util.RTCRtpEncodingParameters(1001, 0, 0, 0, 1.0)
            );
            audioSender.send(audioSendParams);
          } else {
            remote_audioSendParams = remote;
          }
        }

        if (remote.receiveVideoCaps) {
          if (videoSender) {
            var videoSendParams = util.myCapsToSendParams(
              sendVideoCaps,
              remote.receiveVideoCaps
            );
            videoSendParams.encodings.push(
              util.RTCRtpEncodingParameters(3003, 0, 0, 0, 1.0)
            );
            videoSender.send(videoSendParams);
          } else {
            remote_videoSendParams = remote;
          }
        }
      }
    }

    if (iceTr_2 && dtlsTr_2) {
      if (message.candidate_2) {
        console.log(
          "Remote ICE candidate_2: " +
            message.candidate_2.ip +
            ":" +
            message.candidate_2.port
        );

        if (Object.keys(message.candidate_2).length > 0) {
          remoteCandidates_2.push(message.candidate_2);
        } else {
          iceTr_2.setRemoteCandidates(remoteCandidates_2);
        }
      }

      if (message.params) {
        remote = message.params;
        if (remote.ice_2) {
          remoteIceParams_2 = remote.ice_2;
          remoteDtlsParams_2 = remote.dtls_2;

          if (localCandidatesCreated_2) {
            iceTr_2.start(
              iceGathr_2,
              remoteIceParams_2,
              selfInfo.dtlsRole && selfInfo.dtlsRole === "client"
                ? "controlled"
                : "controlling"
            );

            dtlsTr_2.start(remoteDtlsParams_2);
          }
        }
      }
    }
  }
})(typeof window === "object" ? window : global);
