import React, { useEffect, useRef, useState } from 'react';
import io from "socket.io-client";
import {
  Badge,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Avatar
} from '@mui/material';
import { Button } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ChatIcon from '@mui/icons-material/Chat';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import styles from "../styles/VideoMeet.module.css";
import server  from '../environent.jsx';

const server_url = server;

var connections = {};
const peerConfigConnections = {
  "iceServers": [
    { "urls": "stun:stun.l.google.com:19302" }
  ]
};

export default function VideoMeetComponent() {
  var socketRef = useRef();
  let socketIdRef = useRef();
  let localVideoref = useRef();

  let [videoAvailable, setVideoAvailable] = useState(true);
  let [audioAvailable, setAudioAvailable] = useState(true);
  let [video, setVideo] = useState(true);
  let [audio, setAudio] = useState(true);
  let [screen, setScreen] = useState(false);
  let [showModal, setModal] = useState(false);
  let [screenAvailable, setScreenAvailable] = useState(false);
  let [messages, setMessages] = useState([]);
  let [message, setMessage] = useState("");
  let [newMessages, setNewMessages] = useState(0);
  let [askForUsername, setAskForUsername] = useState(true);
  let [username, setUsername] = useState("");
  let [videos, setVideos] = useState([]);
  let [participants, setParticipants] = useState([]);

  const isMobile = () => window.innerWidth <= 768;

  useEffect(() => {
    getPermissions();
  }, []);

  useEffect(() => {
    if (video !== undefined && audio !== undefined) {
      getUserMedia();
    }
  }, [video, audio]);

  useEffect(() => {
    if (screen !== undefined) {
      if (screen) {
        getDislayMedia();
      } else {
        getUserMedia();
      }
    }
  }, [screen]);

  const getPermissions = async () => {
    try {
      const constraints = {
        video: {
          width: { ideal: isMobile() ? 640 : 1280 },
          height: { ideal: isMobile() ? 480 : 720 },
          frameRate: { ideal: isMobile() ? 24 : 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true
        }
      };

      const userMediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      if (userMediaStream) {
        window.localStream = userMediaStream;
        if (localVideoref.current) {
          localVideoref.current.srcObject = userMediaStream;
        }
        setVideoAvailable(true);
        setAudioAvailable(true);
      }

      setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

    } catch (error) {
      console.error("Permission error:", error);
    }
  };

  const getMedia = () => {
    setVideo(videoAvailable);
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  const getUserMediaSuccess = (stream) => {
    try {
      if (window.localStream) {
        window.localStream.getTracks().forEach(track => track.stop());
      }
    } catch (e) { }

    window.localStream = stream;
    if (localVideoref.current) {
      localVideoref.current.srcObject = stream;
    }

    updateAllConnections(stream);

    stream.getTracks().forEach(track => track.onended = () => {
      handleTrackEnded();
    });
  };

  const getUserMedia = () => {
    if ((video && videoAvailable) || (audio && audioAvailable)) {
      const constraints = {
        video: video ? {
          width: { ideal: isMobile() ? 640 : 1280 },
          height: { ideal: isMobile() ? 480 : 720 }
        } : false,
        audio: audio
      };

      navigator.mediaDevices.getUserMedia(constraints)
        .then(getUserMediaSuccess)
        .catch((e) => console.error("getUserMedia error:", e));
    } else {
      handleNoMedia();
    }
  };

  const handleNoMedia = () => {
    let blackSilence = (...args) => new MediaStream([black(...args), silence()]);
    window.localStream = blackSilence();
    if (localVideoref.current) {
      localVideoref.current.srcObject = window.localStream;
    }
    updateAllConnections(window.localStream);
  };

  const updateAllConnections = (stream) => {
    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      try {
        const senders = connections[id].getSenders();
        senders.forEach(s => connections[id].removeTrack(s));

        stream.getTracks().forEach(track => {
          connections[id].addTrack(track, stream);
        });
      } catch (e) { }

      connections[id].createOffer().then((description) => {
        connections[id].setLocalDescription(description)
          .then(() => {
            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }));
          });
      });
    }
  };

  const getDislayMedia = () => {
    if (navigator.mediaDevices.getDisplayMedia) {
      navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: true
      }).then(getDislayMediaSuccess)
        .catch((e) => console.error("getDisplayMedia error:", e));
    }
  };

  const getDislayMediaSuccess = (stream) => {
    try {
      if (window.localStream) {
        window.localStream.getTracks().forEach(track => track.stop());
      }
    } catch (e) { }

    window.localStream = stream;
    if (localVideoref.current) {
      localVideoref.current.srcObject = stream;
    }

    updateAllConnections(stream);

    stream.getTracks().forEach(track => track.onended = () => {
      setScreen(false);
      getUserMedia();
    });
  };

  const handleTrackEnded = () => {
    setVideo(false);
    setAudio(false);
    handleNoMedia();
  };

  const gotMessageFromServer = (fromId, message) => {
    try {
      var signal = JSON.parse(message);

      if (fromId !== socketIdRef.current && connections[fromId]) {
        if (signal.sdp) {
          connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
            if (signal.sdp.type === 'offer') {
              connections[fromId].createAnswer().then((description) => {
                connections[fromId].setLocalDescription(description).then(() => {
                  socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }));
                });
              });
            }
          });
        }

        if (signal.ice) {
          connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice));
        }
      }
    } catch (error) {
      console.error("Error processing signal:", error);
    }
  };

  const connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: false });

    socketRef.current.on('signal', gotMessageFromServer);

    socketRef.current.on('connect', () => {
      socketRef.current.emit('join-call', window.location.href);
      socketIdRef.current = socketRef.current.id;

      socketRef.current.on('chat-message', addMessage);

      socketRef.current.on('user-left', (id) => {
        setVideos((videos) => videos.filter((video) => video.socketId !== id));
        setParticipants((participants) => participants.filter((p) => p.id !== id));

        if (connections[id]) {
          connections[id].close();
          delete connections[id];
        }
      });

      socketRef.current.on('user-joined', (id, clients) => {
        setParticipants(prev => [...prev, { id, username: `User${clients.length}` }]);

        clients.forEach((socketListId) => {
          if (!connections[socketListId]) {
            connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

            connections[socketListId].onicecandidate = function (event) {
              if (event.candidate != null) {
                socketRef.current.emit('signal', socketListId, JSON.stringify({ 'ice': event.candidate }));
              }
            };

            connections[socketListId].ontrack = (event) => {
              if (event.streams && event.streams[0]) {
                handleRemoteStream(socketListId, event.streams[0]);
              }
            };

            if (window.localStream) {
              window.localStream.getTracks().forEach(track => {
                connections[socketListId].addTrack(track, window.localStream);
              });
            }
          }
        });

        if (id === socketIdRef.current) {
          createOffersForAll();
        }
      });

      socketRef.current.on('user-list', (users) => {
        setParticipants(users.map((user, index) => ({ id: user, username: `User${index + 1}` })));
      });
    });
  };

  const handleRemoteStream = (socketId, stream) => {
    setVideos(prevVideos => {
      const existingVideo = prevVideos.find(v => v.socketId === socketId);
      if (existingVideo) {
        return prevVideos.map(v =>
          v.socketId === socketId ? { ...v, stream } : v
        );
      } else {
        return [...prevVideos, { socketId, stream }];
      }
    });
  };

  const createOffersForAll = () => {
    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].createOffer().then((description) => {
        connections[id].setLocalDescription(description)
          .then(() => {
            socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }));
          });
      });
    }
  };

  const silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    ctx.resume();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };

  const black = ({ width = 640, height = 480 } = {}) => {
    let canvas = Object.assign(document.createElement("canvas"), { width, height });
    canvas.getContext('2d').fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  const handleVideo = () => { setVideo(!video); };
  const handleAudio = () => { setAudio(!audio); };
  const handleScreen = () => { setScreen(!screen); };

  const handleEndCall = () => {
    try {
      if (localVideoref.current?.srcObject) {
        let tracks = localVideoref.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }
    } catch (e) { }

    Object.values(connections).forEach(connection => {
      if (connection) {
        connection.close();
      }
    });
    connections = {};

    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    window.location.href = "/";
  };

  const addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender: sender, data: data, timestamp: new Date() }
    ]);
    if (socketIdSender !== socketIdRef.current && !showModal) {
      setNewMessages((prevNewMessages) => prevNewMessages + 1);
    }
  };

  const sendMessage = () => {
    if (message.trim() && socketRef.current) {
      socketRef.current.emit('chat-message', message.trim(), username);
      setMessage("");
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  const connect = () => {
    if (username.trim()) {
      setAskForUsername(false);
      getMedia();
    }
  };

  return (
    <div className={styles.container}>
      {askForUsername ? (
        <Dialog open={askForUsername} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Typography variant="h4" align="center" color="primary">
              VoxBridge
            </Typography>
            <Typography variant="subtitle1" align="center">
              Join Video Conference
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ p: 3 }}>
              <TextField
                fullWidth
                label="Your Name"
                value={username}
                onChange={e => setUsername(e.target.value)}
                variant="outlined"
                margin="normal"
                onKeyPress={(e) => e.key === 'Enter' && connect()}
              />
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <video
                  ref={localVideoref}
                  autoPlay
                  muted
                  playsInline
                  className={styles.previewVideo}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEndCall}>Cancel</Button>
            <Button
              variant="contained"
              onClick={connect}
              disabled={!username.trim()}
            >
              Join Conference
            </Button>
          </DialogActions>
        </Dialog>
      ) : (
        <div className={styles.meetContainer}>
          {/* Chat Modal */}
          <Dialog
            open={showModal}
            onClose={() => setModal(false)}
            maxWidth="sm"
            fullWidth
            className={styles.chatDialog}
          >
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">Chat - VoxBridge</Typography>
                <IconButton onClick={() => setModal(false)}>
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent className={styles.chatContent}>
              <div className={styles.messagesContainer}>
                {messages.length > 0 ? messages.map((item, index) => (
                  <div key={index} className={`${styles.message} ${item.sender === username ? styles.ownMessage : ''}`}>
                    <div className={styles.messageHeader}>
                      <strong>{item.sender}</strong>
                      <span className={styles.timestamp}>
                        {item.timestamp?.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className={styles.messageBody}>
                      {item.data}
                    </div>
                  </div>
                )) : (
                  <Typography variant="body2" color="textSecondary" align="center">
                    No messages yet. Start the conversation!
                  </Typography>
                )}
              </div>
            </DialogContent>
            <DialogActions className={styles.chatActions}>
              <TextField
                fullWidth
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                variant="outlined"
                size="small"
              />
              <Button variant="contained" onClick={sendMessage}>
                Send
              </Button>
            </DialogActions>
          </Dialog>

          {/* Main Video Grid */}
          <div className={styles.videoGrid}>
            {/* Local Video */}
            <div className={styles.videoTile}>
              <video
                ref={localVideoref}
                autoPlay
                muted
                playsInline
                className={styles.videoElement}
              />
              <div className={styles.videoOverlay}>
                <Typography variant="caption" className={styles.participantName}>
                  {username} (You)
                </Typography>
                {!video && (
                  <Avatar className={styles.videoOffAvatar}>
                    <PersonIcon />
                  </Avatar>
                )}
              </div>
            </div>

            {/* Remote Videos */}
            {videos.map((video) => (
              <div key={video.socketId} className={styles.videoTile}>
                <video
                  ref={ref => {
                    if (ref && video.stream) {
                      ref.srcObject = video.stream;
                    }
                  }}
                  autoPlay
                  playsInline
                  className={styles.videoElement}
                />
                <div className={styles.videoOverlay}>
                  <Typography variant="caption" className={styles.participantName}>
                    {participants.find(p => p.id === video.socketId)?.username || 'Participant'}
                  </Typography>
                </div>
              </div>
            ))}
          </div>

          {/* Controls */}
          <div className={styles.controlsContainer}>
            <IconButton
              onClick={handleVideo}
              className={`${styles.controlButton} ${!video ? styles.controlButtonOff : ''}`}
            >
              {video ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>

            <IconButton
              onClick={handleAudio}
              className={`${styles.controlButton} ${!audio ? styles.controlButtonOff : ''}`}
            >
              {audio ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            <IconButton
              onClick={handleEndCall}
              className={styles.endCallButton}
            >
              <CallEndIcon />
            </IconButton>

            {screenAvailable && (
              <IconButton
                onClick={handleScreen}
                className={`${styles.controlButton} ${screen ? styles.controlButtonActive : ''}`}
              >
                {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
              </IconButton>
            )}

            <Badge badgeContent={newMessages} max={99} color="error">
              <IconButton
                onClick={() => {
                  setModal(true);
                  setNewMessages(0);
                }}
                className={styles.controlButton}
              >
                <ChatIcon />
              </IconButton>
            </Badge>
          </div>

          {/* Participants Counter */}
          <div className={styles.participantsCounter}>
            <Typography variant="caption">
              {participants.length + 1} participants in call
            </Typography>
          </div>
        </div>
      )}
    </div>
  );
}
