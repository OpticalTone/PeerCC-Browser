
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
    'use strict';

    var self = null;
    var clientSocket = null;
    var peer_id = null;
    var pollHttp = null;
    var isConnected = false;
    var peerConnectionServer = null;
    var signInMethod = '/sign_in?';
    var waitMethod = "/wait?peer_id=";
    var signOutMethod = "/sign_out?peer_id=";
    var selfId = null;

    function SignallingChannel() {
        EventTarget.call(this);

        self = this;
        this.defineEventProperty('message');

        //start();
    }

    Object.inherits(SignallingChannel, EventTarget);

    var HttpClient = function () {
      this.get = function (aUrl, responseCallback) {
        var anHttpRequest = new XMLHttpRequest();
        anHttpRequest.onreadystatechange = function () {
          if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200) {
            console.log(anHttpRequest.getAllResponseHeaders());
            var pragmaHeaderValue = anHttpRequest.getResponseHeader("Pragma");
            responseCallback(pragmaHeaderValue, anHttpRequest.responseText);
          }
        }

        anHttpRequest.open("GET", aUrl, true);
        anHttpRequest.send(null);
      }

      this.post = function (aUrl, message, responseCallback) {
        var anHttpRequest = new XMLHttpRequest();
        anHttpRequest.onreadystatechange = function () {
          if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200) {
            console.log(anHttpRequest.getAllResponseHeaders());
            var pragmaHeaderValue = anHttpRequest.getResponseHeader("Pragma");
            responseCallback(pragmaHeaderValue, anHttpRequest.responseText);
          }
        }

        anHttpRequest.open("POST", aUrl, true);
        if(window.navigator.userAgent.indexOf("Edge") > -1)
            anHttpRequest.setRequestHeader('Content-Length', message.lenght);
        anHttpRequest.setRequestHeader('Content-Type', "text/plain");
        anHttpRequest.send(message);
      }
      
    }

    var HttpClientForPolling = function () {

      this.getLongPolling = function (aUrl, responseCallback, timeoutCallback) {
        var anHttpRequest = new XMLHttpRequest();
        anHttpRequest.timeout = 20000;

        anHttpRequest.ontimeout = function () {
          //if you get this you probably should try to make the connection again.
          //the browser should've killed the connection.
          timeoutCallback();
        }

        anHttpRequest.onreadystatechange = function () {
          if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200) {
            console.log(anHttpRequest.getAllResponseHeaders());
            var pragmaHeaderValue = anHttpRequest.getResponseHeader("Pragma");
            responseCallback(pragmaHeaderValue, anHttpRequest.responseText);
          }
        }

        anHttpRequest.open("GET", aUrl, true);
        anHttpRequest.send(null);
      }
    }

    // send data to other peer
    SignallingChannel.prototype.send = function (data) {

        data = JSON.parse(data);

        var selfInfo = data.selfInfo;
        var peerInfo = data.peerInfo;

        selfId = selfInfo.id;

        if (data.clientlist) {
            console.log('SEND clientlist');

            clientSocket.emit('message',
            {
                kind: 'clientlist'
            });

            return;
        }

        if (data.peervalidaterequest) {
            console.log('SEND peervalidaterequest');

            clientSocket.emit('message',
            {
                kind: 'peervalidaterequest',
                details: data.peervalidaterequest
            });

            return;
        }

        if (data.connectrequest) {
          console.log('SEND connectrequest');

          var message = JSON.stringify({
              kind: 'connectrequest',
              selfInfo: selfInfo,
              peerInfo: peerInfo
          });
          console.log(message);

          var aClient = new HttpClient();
          var response = 0;
          
          var postRequest = createPostUrl(selfInfo.id, peerInfo.id);
          aClient.post(postRequest, message, function (header, response) {
            // do something with response
            console.log(response);
            onMessageReceived(header, response);
          });

            return;
        }

        if (data.connectresponse) {
            console.log('SEND connectresponse');

            var message = JSON.stringify({
                kind: 'connectresponse',
                selfInfo: selfInfo,
                peerInfo: peerInfo,
                response: data.connectresponse
            });
            console.log(message);
            
            var aClient = new HttpClient();
            var response = 0;

            var postRequest = createPostUrl(selfInfo.id, peerInfo.id);
            aClient.post(postRequest, message, function (header, response) {
              // do something with response
              console.log(response);
              onMessageReceived(header, response);
            });

            return;
        }

        if (data.params) {
            console.log('SEND params');

            var message = JSON.stringify({
                kind: 'params',
                selfInfo: selfInfo,
                peerInfo: peerInfo,
                params: data.params
            });

            var aClient = new HttpClient();
            var response = 0;

            var postRequest = createPostUrl(selfInfo.id, peerInfo.id);
            aClient.post(postRequest, message, function (header, response) {
              // do something with response
              console.log(response);
              onMessageReceived(header, response);
            });
            return;
        }

         if (data.sdp) {
            console.log('SEND sdp');

            message = JSON.stringify({
                kind: 'sdp',
                selfInfo: selfInfo,
                peerInfo: peerInfo,
                sdp: data.sdp
            });

            aClient = new HttpClient();
            response = 0;

            postRequest = createPostUrl(selfInfo.id, peerInfo.id);
            aClient.post(postRequest, message, function (header, response) {
              // do something with response
              console.log(response);
              onMessageReceived(header, response);
            });
            return;
        }

        if (data.candidate) {

          console.log('SEND candidate');
          var message = JSON.stringify({
              kind: 'remotecandidate',
              selfInfo: selfInfo,
              peerInfo: peerInfo,
              candidate: data.candidate
          });
          var aClient = new HttpClient();
          var response = 0;

          var postRequest = createPostUrl(selfInfo.id, peerInfo.id);
          aClient.post(postRequest, message, function (header, response) {
            // do something with response
            console.log(response);
            onMessageReceived(header, response);
          });
          return;
        }

        if (data.candidate_2) {

            console.log('SEND candidate_2');
            var message = JSON.stringify({
                kind: 'remotecandidate_2',
                selfInfo: selfInfo,
                peerInfo: peerInfo,
                candidate_2: data.candidate_2
            });
            var aClient = new HttpClient();
            var response = 0;

            var postRequest = createPostUrl(selfInfo.id, peerInfo.id);
            aClient.post(postRequest, message, function (header, response) {
              // do something with response
              console.log(response);
              onMessageReceived(header, response);
            });
            return;
        }
        
        if (data.error) {

            console.log('SEND error');
            var message = JSON.stringify({
                kind: 'error',
                selfInfo: selfInfo,
                peerInfo: peerInfo,
                error: data.error
            });
            var aClient = new HttpClient();
            var response = 0;

            var postRequest = createPostUrl(selfInfo.id, peerInfo.id);
            aClient.post(postRequest, message, function (header, response) {
              // do something with response
              console.log(response);
              onMessageReceived(header, response);
            });
            return;
        }

        if (data.disconnect) {

            console.log('SEND disconnect');
            var message = "BYE";
            var aClient = new HttpClient();
            var response = 0;

            var postRequest = createPostUrl(selfInfo.id, peerInfo.id);
            aClient.post(postRequest, message, function (header, response) {
              // do something with response
              console.log("Call hangup= " + response);
              dispatchMessage(JSON.stringify({ disconnect: 'disconnect' }));
            });
            return;
        }
    };

  // dispatch received messages
    function createPostUrl(localPeer, remotePeer) {

      let message = "/message?peer_id=" + localPeer + "&to=" + remotePeer;
      //live only
      message = encodeURIComponent(message);
      var postRequest = peerConnectionServer + message;// + "HTTP/1.0\r\n"
      
      return postRequest;
    }

    function onMessageReceived(header, response) {

      // console.warn("OnMessageResceived type: " + typeof response);
      // console.warn(JSON.stringify(response));

      console.log(response);
      // console.warn("Header: " + header);

      if (response != "") {
        if (peer_id == header) {
          dispatchMessage(JSON.stringify({ contacts: response }));
        }
        else if (response == "BYE")
        {
          console.log("Received hangup");
          dispatchMessage(JSON.stringify({ disconnect: 'disconnect' }));
        }
        else {
          handleReceivedPeerMsg(response);
        }
      }

      pollHttp = null;
      sendLongPollingRequest();
    }

    function sendLongPollingRequest() {
      if (isConnected) {
        pollHttp = new HttpClientForPolling();
        var response = 0;
        let wait;

        wait =  waitMethod + peer_id;
        //live only
        wait = encodeURIComponent(wait);
        
        pollHttp.getLongPolling(peerConnectionServer + wait, function (header, response) {
          onMessageReceived(header, response);
        }, sendLongPollingRequest);
      }
    }

    // open channel
    SignallingChannel.prototype.start = function(info) {

      var aClient = new HttpClient();
      var response = 0;
      var url;

      info = JSON.parse(info);
      console.log("Info: " + info);

      
      var name;  
      var randomName;
      if(!localStorage['name']){
        randomName = "Peer:" + Math.floor((Math.random() * 100000) + 1);
        document.getElementById('name').innerHTML = randomName;
      } else{
        randomName = localStorage['name'] || 'defaultValue';
      }
      
      if (checkIfWebRTC && checkIfORTC)
          name = randomName + "-dual";
      else if (checkIfORTC && checkIfWebRTC !== true)
          name = randomName + "-json";
      else
          name = randomName;



     
      //live only
      url = "http://" + info.address + ":" + info.port;
      peerConnectionServer= "https://www.webrtcpeer.com/signaling.php?url="+url;


      //local only
      // peerConnectionServer = "http://" + info.address + ":" + info.port;

      aClient.get(peerConnectionServer + signInMethod + name, function (header, response) {
        // do something with response
        console.log("start responce: "+response);

        var contacts = response.split("\n");

        if (contacts.length > 1)
        {
          console.log(contacts);
          for (var i = 1; i < contacts.length; i++) {
            if (contacts[i] != "") {
              dispatchMessage(JSON.stringify({ contacts: contacts[i] }));
            }
          }

        }
        var peerDetails = contacts[0].split(",");

        var selfDetails = JSON.stringify({
          registerdone: {
            id: peerDetails[1],
            friendlyName: peerDetails[0]
          }
        });
        dispatchMessage(selfDetails);
        peer_id = peerDetails[1];

        isConnected = true;
        sendLongPollingRequest();

      });
    }

  // close channel
    SignallingChannel.prototype.close = function () {
      var aClient = new HttpClient();
      var response = 0;

      console.log('SignallingChannel: close');
      aClient.get(peerConnectionServer + signOutMethod + peer_id, function (header, response) {
        // do something with response
        console.log(response);

        // notify upper layer to update UI and clean up

        dispatchMessage(JSON.stringify({ serverDisconnected: "disconnected" }));

        // cleaning up
        var self = null;
        var clientSocket = null;
        var peer_id = null;
        var pollHttp = null;
        var peerConnectionServer = null;
        isConnected = false;
      });
    };

    // dispatch received messages
    function dispatchMessage(msg, type) {

        var evt = new Event('message');
        evt.data = msg;
        self.dispatchEvent(evt);
    }

    // handle websocket messages
    function handleReceivedPeerMsg(e) {

      // console.warn("type of handleReceivedPeerMsg: " + typeof e);

      // console.warn("handleReceivedPeerMsg: " + e);
      e = JSON.parse(e);
      // console.log(e);
      // console.warn("handleReceivedPeerMsg json parsed: " + e);


        if (e.kind === 'connect') {
            console.log('RECV: connect');

            clientSocket.emit('message', { kind: 'register', friendlyName: global.fName });
        }
        else if (e.kind === 'registerdone') {
            console.log('RECV: registerdone');
            dispatchMessage(JSON.stringify({ registerdone: e.registerationdetails }));
        }
        else if (e.kind === 'clientlist') {
            console.log('RECV: clientlist');
            dispatchMessage(JSON.stringify({ clientlist: e.clients }));
        }
        else if (e.kind === 'peervalidateresponse') {
            console.log('RECV: peervalidateresponse');
            dispatchMessage(JSON.stringify({ peervalidateresponse: e.response }));
        }
        else if (e.kind === 'connectrequest') {
            console.log('RECV: connectrequest');
            dispatchMessage(JSON.stringify({ connectrequest: { peerInfo: e.selfInfo } }));
        }
        else if (e.kind === 'connectresponse') {
            console.log('RECV: connectresponse');
            dispatchMessage(JSON.stringify({ connectresponse: e.response }));
        }
        else if (e.kind === 'start') {
            console.log('RECV: start');
            dispatchMessage(JSON.stringify({ start: 'start', dtlsrole: e.dtlsrole }));
        }
        else if (e.kind === 'remotecandidate') {
            console.log('RECV: remotecandidate');
            dispatchMessage(JSON.stringify({ candidate: e.candidate }));
        }
        else if (e.kind === 'remotecandidate_2') {
            console.log('RECV: remotecandidate_2');
            dispatchMessage(JSON.stringify({ candidate_2: e.candidate_2 }));
        }
        else if (e.kind === 'disconnect') {
            console.log('RECV: disconnect');
            dispatchMessage(JSON.stringify({ disconnect: 'disconnect' }));
        }
        else if (e.kind === 'params') {
            console.log('RECV: params');
            dispatchMessage(JSON.stringify({ params: e.params }));
        }
        else if (e.kind === 'sdp') {
            console.log('RECV: sdp');
            dispatchMessage(JSON.stringify({ sdp: e.sdp }));
        }
        else if (e.kind === 'error') {
            console.log('RECV: error');
            dispatchMessage(JSON.stringify({ error: e.error || "remote error" }));
        }
        else if (e.kind === 'duplicate') {
            console.log('RECV: duplicate');
            dispatchMessage(JSON.stringify({ duplicate: true }));
        }
    }

    // connect to websocket
    function connect(messageHandlerCb, disconnectCb) {
        var resultSocket = io.connect(window.document.location.origin, { 'force new connection': true }); // as per https://github.com/LearnBoost/socket.io-client/issues/318
        resultSocket.on('message', messageHandlerCb);

        if (messageHandlerCb) {
            resultSocket.on('connect', function () {
                messageHandlerCb({ kind: 'connect' });
            });
        }

        if (disconnectCb) {
            resultSocket.on('disconnect', function () {
                disconnectCb({ kind: 'disconnect' });
            });
        }

        return resultSocket;
    }


    global.SignallingChannel = SignallingChannel;


}(typeof window === 'object' ? window : global));