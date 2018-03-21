# PeerCC-Browser

<<<<<<< HEAD
Sample that uses ORTC and WebRTC to make a audio/video call between two peers  <br />
=======
Sample that uses ORTC and WebRTC to make a audio/video call between two peers
>>>>>>> e39d9f93215c725d778897d37e37d5f362ed64ee
**Live sample: [webrtcpeer.com](https://www.webrtcpeer.com/)**

## Getting Started

This is a sample that you can use to make video call with someone, directly, peer to peer, for that you will need a working camera and microphone.
This sample can run in dual mode eg. if your browser supports both ORTC and WebRTC you can use eather of them.
If both you and the peer you are calling support dual mode, your calls will be made using ORTC, otherwise if the browser you or the peer are using supports only one technology (assuming you both support the same one), that technology will be used.
**WebRTC is implemented using the [adapter](https://github.com/webrtc/adapter)**

### Prerequisites

To make the sample work you will need the following:  
Latest Version of browsers.

>Browsers currently supporting WebRTC:
*Edge, Chrome, Firefox, Opera*

>Browsers currently supporting ORTC:
*Edge*

To run localy you will need *Visual Studio 2015* or newer.  

### Installing

1. Open the project as Web Site in Visual Studio (File->Open->Web Site...)
2. Select the project folder (PeerCC-Browser) and click Open
3. If you want to run localy you set the **live** variable to **false** (*scripts/signallingchannel.js line:19*)
4. Select the browser you wish to use and run the project
5. Use browser console to debug


### How to use

1. (Optional) Chose your name
2. (Optional) Uncheck the trickle ice checkbox if you want to send candidates trough sdp only (Only works with WebRtc)
3. Connect to the server using the connect button.
4. Select the peer that you wish to make a video call with and click the call button to initiate the connection.



