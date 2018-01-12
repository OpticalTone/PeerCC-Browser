# PeerCC-Browser

Sample that uses ORTC and WebRTC to make a audio/video call between two peers

## Getting Started

This is a sample that you can use to make video call with someone, directly, peer to peer, for that you will need a working camera and microphone.
This sample can run in dual mode eg. if your browser supports both ORTC and WebRTC you can use eather of them.
If both you and the peer you are calling support dual mode, by default your calls will be made using ORTC, otherwise if the browser you or the peer are using supports only one technology (assuming you both support the same one), that technology will automatically be used.
WebRTC is implemented using the adapter: https://github.com/webrtc/adapter

### Prerequisites

To make the sample work you will need the following:  

Visual Studio 2015 or newer.  

Latest Version of browsers:    
* Edge - version 15+   
* Chrome - version 61+
* Opera - version 49+

### Installing

1. Open the project as Web Site in Visual Studio (File->Open->Web Site...)
2. Select the project folder (PeerCC-Browser) and click Open
3. Select the browser you wish to use and run the project
4. Use browser console to debug

