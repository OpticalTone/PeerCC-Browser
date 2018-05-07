# PeerCC-Browser

Sample that uses ORTC and WebRTC to make a audio/video call between two peers  <br />
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

1. Connect to the server using the connect button.
2. When you connect, contacts sidebar will show up that shows other users currently connected to the server (it can be hidden and shown by clicking the contact button next to the sidebar).
3. Select the contact you wish to make a call with, and click the green phone icon to initiate the call.
4. You can now mute and unmute audio and video with the buttons next to the phone icon.
5. When you wish to end the call click the red phone icon.
6. Click the disconnect button to disconnect from the server before exiting.


### Options

By clicking the cogs button on the right side, you can show and hide the options.
While disconnected from the server, you can change the name, uncheck the trickle ice checkbox if you want to send candidates trough sdp only (Only works with WebRtc).
While not in a call, you can chose the resolution you want your video to be displayed at.
You can chose to use either ORTC or WebRTC on browsers that support both technologies.


