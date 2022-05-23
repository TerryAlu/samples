/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';

let socket = io("http://118.150.23.0:7777");
let isServer = false;

let localConnection;
let sendChannel;
let receiveChannel;
const dataChannelSend = document.querySelector('textarea#dataChannelSend');
const dataChannelReceive = document.querySelector('textarea#dataChannelReceive');
const startClientButton = document.querySelector('button#startClientButton');
const startServerButton = document.querySelector('button#startServerButton');
const sendButton = document.querySelector('button#sendButton');
const closeButton = document.querySelector('button#closeButton');

startClientButton.onclick = createClientConnection;
startServerButton.onclick = createServerConnection;
sendButton.onclick = sendData;
closeButton.onclick = closeDataChannels;

function enableStartButton() {
  startClientButton.disabled = false;
  startServerButton.disabled = false;
}

function disableSendButton() {
  sendButton.disabled = true;
}

function createClientConnection() {
  isServer = false;
  dataChannelSend.placeholder = '';
  //const servers = null;
  const servers = {
    "iceServers": [
      {"url": "stun:stun.l.google.com:19302"}
    ]
  };
  console.log("alu: ", servers);
  window.localConnection = localConnection = new RTCPeerConnection(servers);
  console.log('Created local peer connection object localConnection');
  localConnection.onconnectionstatechange = event => { console.log("ALU: ", localConnection.connectionState); };
  registerRecvAnswer();
  registerIce();

  sendChannel = localConnection.createDataChannel('sendDataChannel');
  console.log('Created send data channel');

  localConnection.onicecandidate = e => {
    onIceCandidate(localConnection, e);
  };
  sendChannel.onopen = onSendChannelStateChange;
  sendChannel.onclose = onSendChannelStateChange;

  localConnection.createOffer().then(
      offerDesc,
      onCreateSessionDescriptionError
  );
  startClientButton.disabled = true;
  closeButton.disabled = false;
}

function createServerConnection() {
  isServer = false;
  dataChannelSend.placeholder = '';
  //const servers = null;
  const servers = {
    "iceServers": [
      {"url": "stun:stun.l.google.com:19302"}
    ]
  };
  console.log("alu: ", servers);
  window.localConnection = localConnection = new RTCPeerConnection(servers);
  console.log('Created local peer connection object localConnection');
  localConnection.onconnectionstatechange = event => { console.log("ALU: ", localConnection.connectionState); };
  registerRecvOffer();
  registerIce();

  localConnection.onicecandidate = e => {
    onIceCandidate(localConnection, e);
  };
  localConnection.ondatachannel = receiveChannelCallback;


  startServerButton.disabled = true;
  closeButton.disabled = false;
}

function onCreateSessionDescriptionError(error) {
  console.log('Failed to create session description: ' + error.toString());
}

function sendData() {
  const data = dataChannelSend.value;
  sendChannel.send(data);
  console.log('Sent Data: ' + data);
}

function closeDataChannels() {
  console.log('Closing data channels');
  sendChannel.close();
  console.log('Closed data channel with label: ' + sendChannel.label);
  receiveChannel.close();
  console.log('Closed data channel with label: ' + receiveChannel.label);
  localConnection.close();
  localConnection = null;
  console.log('Closed peer connections');
  sendButton.disabled = true;
  closeButton.disabled = true;
  dataChannelSend.value = '';
  dataChannelReceive.value = '';
  dataChannelSend.disabled = true;
  disableSendButton();
  enableStartButton();
}

// client
function offerDesc(desc) {
  localConnection.setLocalDescription(desc);
  console.log(`Offer from localConnection\n${desc.sdp}`);
  socket.emit('web_desc', desc);
}

// server
function registerRecvOffer() {
  socket.on('web_desc', function(desc) {
    console.log('recv web_desc: ');
    console.log(desc);
    localConnection.setRemoteDescription(desc);
    localConnection.createAnswer().then(
        offerAnswer,
        onCreateSessionDescriptionError
    );
  });
}

// server
function offerAnswer(desc) {
  localConnection.setLocalDescription(desc);
  console.log(`Answer from serverConnection\n${desc.sdp}`);
  socket.emit('server_desc', desc);
  //localConnection.setRemoteDescription(desc);
}

// client
function registerRecvAnswer() {
  socket.on('server_desc', function(desc) {
    console.log('recv server_desc: ');
    console.log(desc);
    localConnection.setRemoteDescription(desc);
  });
}

function onIceCandidate(pc, event) {
  socket.emit('ice', event.candidate);
  console.log(`ICE candidate: ${event.candidate ? event.candidate.candidate : '(null)'}`);
}

// remote
function registerIce() {
  socket.on('ice', function(candidate) {
    console.log('recv ice: ');
    console.log(candidate);
    localConnection
        .addIceCandidate(candidate)
        .then(
            onAddIceCandidateSuccess,
            onAddIceCandidateError
        );
  });
}

function onAddIceCandidateSuccess() {
  console.log('AddIceCandidate success.');
}

function onAddIceCandidateError(error) {
  console.log(`Failed to add Ice Candidate: ${error.toString()}`);
}

// server
function receiveChannelCallback(event) {
  console.log('Receive Channel Callback');
  receiveChannel = event.channel;
  receiveChannel.onmessage = onReceiveMessageCallback;
  receiveChannel.onopen = onReceiveChannelStateChange;
  receiveChannel.onclose = onReceiveChannelStateChange;
}

function onReceiveMessageCallback(event) {
  console.log('Received Message');
  dataChannelReceive.value = event.data;
}

// client
function onSendChannelStateChange() {
  const readyState = sendChannel.readyState;
  console.log('Send channel state is: ' + readyState);
  if (readyState === 'open') {
    dataChannelSend.disabled = false;
    dataChannelSend.focus();
    sendButton.disabled = false;
    closeButton.disabled = false;
  } else {
    dataChannelSend.disabled = true;
    sendButton.disabled = true;
    closeButton.disabled = true;
  }
}

function onReceiveChannelStateChange() {
  const readyState = receiveChannel.readyState;
  console.log(`Receive channel state is: ${readyState}`);
}
