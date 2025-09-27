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
  Avatar,
  Card,
  CardContent,
  Alert,
  Snackbar
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
import WarningIcon from '@mui/icons-material/Warning';
import styles from "../styles/VideoMeet.module.css";
import server from '../environent.jsx';

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
  let videoContainerRef = useRef();

  let [videoAvailable, setVideoAvailable] = useState(false);
  let [audioAvailable, setAudioAvailable] = useState(false);
  let [video, setVideo] = useState(false);
  let [audio, setAudio] = useState(false);
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
  let [gridColumns, setGridColumns] = useState(1);
  let [error, setError] = useState("");
  let [hasTriedPermissions, setHasTriedPermissions] = useState(false);

  const isMobile = () => window.innerWidth <= 768;

  // Calculate grid layout based on number of participants
  const calculateGridLayout = (totalParticipants) => {
    if (totalParticipants <= 1) return 1;
    if (totalParticipants <= 4) return 2;
    if (totalParticipants <= 9) return 3;
    return 4;
  };

  // Update grid when participants change
  useEffect(() => {
    const totalParticipants = videos.length + 1;
    const columns = calculateGridLayout(totalParticipants);
    setGridColumns(columns);
  }, [videos]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const totalParticipants = videos.length + 1;
      const columns = calculateGridLayout(totalParticipants);
      setGridColumns(columns);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [videos]);

  useEffect(() => {
    if (!hasTriedPermissions) {
      getPermissions();
    }
  }, [hasTriedPermissions]);

  useEffect(() => {
    if (video !== undefined && audio !== undefined && !askForUsername) {
      getUserMedia();
    }
  }, [video, audio, askForUsername]);

  useEffect(() => {
    if (screen !== undefined && !askForUsername) {
      if (screen) {
        getDislayMedia();
      } else {
        getUserMedia();
      }
    }
  }, [screen, askForUsername]);

  const getPermissions = async () => {
    try {
      setHasTriedPermissions(true);
      
      // First, check what devices are available
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      const audioDevices = devices.filter(device => device.kind === 'audioinput');
      
      console.log('Available video devices:', videoDevices.length);
      console.log('Available audio devices:', audioDevices.length);

      if (videoDevices.length === 0 && audioDevices.length === 0) {
        setError("No camera or microphone found. Please check your devices.");
        setVideoAvailable(false);
        setAudioAvailable(false);
        return;
      }

      // Try to get media with very basic constraints first
      const basicConstraints = {
        video: videoDevices.length > 0 ? {
          width: { min: 320, ideal: 640, max: 1280 },
          height: { min: 240, ideal: 480, max: 720 },
          frameRate: { ideal: 15 }
        } : false,
        audio: audioDevices.length > 0 ? {
          echoCancellation: true,
          noiseSuppression: true
        } : false
      };

      try {
        const userMediaStream = await navigator.mediaDevices.getUserMedia(basicConstraints);
        
        if (userMediaStream) {
          window.localStream = userMediaStream;
          if (localVideoref.current) {
            localVideoref.current.srcObject = userMediaStream;
          }
          
          // Check what tracks we actually got
          const videoTracks = userMediaStream.getVideoTracks();
          const audioTracks = userMediaStream.getAudioTracks();
          
          setVideoAvailable(videoTracks.length > 0);
          setAudioAvailable(audioTracks.length > 0);
          setVideo(videoTracks.length > 0);
          setAudio(audioTracks.length > 0);
          
          // If we got video but it's not working, try simpler constraints
          if (videoTracks.length > 0) {
            videoTracks[0].onended = () => {
              setVideoAvailable(false);
              setVideo(false);
            };
          }
          
          if (audioTracks.length > 0) {
            audioTracks[0].onended = () => {
              setAudioAvailable(false);
              setAudio(false);
            };
          }
        }
      } catch (mediaError) {
        console.warn("Basic constraints failed, trying audio-only:", mediaError);
        
        // Try audio-only if video failed
        try {
          const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: audioDevices.length > 0
          });
          
          if (audioOnlyStream) {
            window.localStream = audioOnlyStream;
            if (localVideoref.current) {
              localVideoref.current.srcObject = audioOnlyStream;
            }
            setVideoAvailable(false);
            setAudioAvailable(true);
            setVideo(false);
            setAudio(true);
          }
        } catch (audioError) {
          console.error("Audio-only also failed:", audioError);
          setError("Unable to access camera or microphone. Please check permissions.");
          setVideoAvailable(false);
          setAudioAvailable(false);
        }
      }

      setScreenAvailable(!!navigator.mediaDevices.getDisplayMedia);

    } catch (error) {
      console.error("Permission error:", error);
      setError("Error accessing media devices. Please check browser permissions.");
      setVideoAvailable(false);
      setAudioAvailable(false);
      setScreenAvailable(false);
    }
  };

  const retryPermissions = () => {
    setError("");
    setHasTriedPermissions(false);
  };

  const getMedia = () => {
    // Only enable what's available
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

    stream.getTracks().forEach(track => {
      track.onended = () => {
        if (track.kind === 'video') {
          setVideo(false);
          setVideoAvailable(false);
        } else if (track.kind === 'audio') {
          setAudio(false);
          setAudioAvailable(false);
        }
      };
    });
  };

  const getUserMedia = () => {
    // Use simpler constraints that are more likely to work
    const constraints = {
      video: video && videoAvailable ? {
        width: { min: 320, ideal: 640 },
        height: { min: 240, ideal: 480 },
        frameRate: { ideal: 15 }
      } : false,
      audio: audio && audioAvailable ? {
        echoCancellation: true,
        noiseSuppression: true
      } : false
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then(getUserMediaSuccess)
      .catch((e) => {
        console.error("getUserMedia error:", e);
        setError(`Media error: ${e.message}`);
        
        // If video failed but audio might work, try audio-only
        if (video && audioAvailable) {
          navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true
          }).then(audioStream => {
            setVideoAvailable(false);
            setVideo(false);
            getUserMediaSuccess(audioStream);
          }).catch(audioError => {
            console.error("Audio-only also failed:", audioError);
          });
        }
      });
  };

  const updateAllConnections = (stream) => {
    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      try {
        const senders = connections[id].getSenders();
        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        const videoSender = senders.find(s => s.track && s.track.kind === 'video');
        const audioSender = senders.find(s => s.track && s.track.kind === 'audio');

        if (videoSender && videoTrack) {
          videoSender.replaceTrack(videoTrack).catch(e => console.error('Error replacing video track:', e));
        }

        if (audioSender && audioTrack) {
          audioSender.replaceTrack(audioTrack).catch(e => console.error('Error replacing audio track:', e));
        }

      } catch (e) {
        console.error("Error updating connections:", e);
      }
    }
  };

  const getDislayMedia = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" },
        audio: audioAvailable
      }).then(getDislayMediaSuccess)
        .catch((e) => {
          console.error("getDisplayMedia error:", e);
          setScreen(false);
          setError("Screen sharing failed or was cancelled");
          getUserMedia();
        });
    } else {
      setScreenAvailable(false);
      setScreen(false);
      setError("Screen sharing not supported in this browser");
    }
  };

  const getDislayMediaSuccess = (stream) => {
    if (window.localStream) {
      window.localStream.getTracks().forEach(track => track.stop());
    }

    window.localStream = stream;
    if (localVideoref.current) {
      localVideoref.current.srcObject = stream;
    }

    updateAllConnections(stream);

    stream.getVideoTracks()[0].onended = () => {
      setScreen(false);
      getUserMedia();
    };
  };

  const gotMessageFromServer = (fromId, message) => {
    try {
      var signal = JSON.parse(message);

      if (fromId !== socketIdRef.current && connections[fromId]) {
        if (signal.sdp) {
          connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp))
            .then(() => {
              if (signal.sdp.type === 'offer') {
                return connections[fromId].createAnswer();
              }
            })
            .then((answer) => {
              if (answer) {
                return connections[fromId].setLocalDescription(answer);
              }
            })
            .then(() => {
              if (connections[fromId].localDescription) {
                socketRef.current.emit('signal', fromId, JSON.stringify({ 'sdp': connections[fromId].localDescription }));
              }
            })
            .catch(error => console.error('Error handling SDP:', error));
        }

        if (signal.ice) {
          connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice))
            .catch(error => console.error('Error adding ICE candidate:', error));
        }
      }
    } catch (error) {
      console.error("Error processing signal:", error);
    }
  };

  const connectToSocketServer = () => {
    socketRef.current = io.connect(server_url, { secure: true });

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
        const otherClients = clients.filter(clientId => clientId !== socketIdRef.current);
        const newParticipants = otherClients.map(clientId => ({
          id: clientId,
          username: `User${otherClients.indexOf(clientId) + 1}`
        }));

        setParticipants(newParticipants);

        otherClients.forEach((socketListId) => {
          if (!connections[socketListId] && socketListId !== socketIdRef.current) {
            connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

            connections[socketListId].onicecandidate = (event) => {
              if (event.candidate) {
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
        const otherUsers = users.filter(user => user !== socketIdRef.current);
        setParticipants(otherUsers.map((user, index) => ({
          id: user,
          username: `User${index + 1}`
        })));

        otherUsers.forEach((userId) => {
          if (!connections[userId] && userId !== socketIdRef.current) {
            connections[userId] = new RTCPeerConnection(peerConfigConnections);

            connections[userId].onicecandidate = (event) => {
              if (event.candidate) {
                socketRef.current.emit('signal', userId, JSON.stringify({ 'ice': event.candidate }));
              }
            };

            connections[userId].ontrack = (event) => {
              if (event.streams && event.streams[0]) {
                handleRemoteStream(userId, event.streams[0]);
              }
            };

            if (window.localStream) {
              window.localStream.getTracks().forEach(track => {
                connections[userId].addTrack(track, window.localStream);
              });
            }

            connections[userId].createOffer()
              .then(offer => connections[userId].setLocalDescription(offer))
              .then(() => {
                socketRef.current.emit('signal', userId, JSON.stringify({ 'sdp': connections[userId].localDescription }));
              })
              .catch(error => console.error('Error creating offer:', error));
          }
        });
      });
    });
  };

  const handleRemoteStream = (socketId, stream) => {
    setVideos(prevVideos => {
      const existingIndex = prevVideos.findIndex(v => v.socketId === socketId);
      if (existingIndex >= 0) {
        const newVideos = [...prevVideos];
        newVideos[existingIndex] = { socketId, stream };
        return newVideos;
      } else {
        return [...prevVideos, { socketId, stream }];
      }
    });
  };

  const createOffersForAll = () => {
    for (let id in connections) {
      if (id === socketIdRef.current) continue;

      connections[id].createOffer()
        .then(offer => connections[id].setLocalDescription(offer))
        .then(() => {
          socketRef.current.emit('signal', id, JSON.stringify({ 'sdp': connections[id].localDescription }));
        })
        .catch(error => console.error('Error creating offer for', id, error));
    }
  };

  const handleVideo = () => {
    if (!videoAvailable) {
      setError("Video not available. No camera found.");
      return;
    }

    const newVideoState = !video;
    setVideo(newVideoState);

    if (window.localStream) {
      const videoTracks = window.localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = newVideoState;
      }
    }
  };

  const handleAudio = () => {
    if (!audioAvailable) {
      setError("Audio not available. No microphone found.");
      return;
    }

    const newAudioState = !audio;
    setAudio(newAudioState);

    if (window.localStream) {
      const audioTracks = window.localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = newAudioState;
      }
    }
  };

  const handleScreen = () => {
    setScreen(!screen);
  };

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

  const openChat = () => {
    setModal(true);
    setNewMessages(0);
  };

  const actualParticipantCount = 1 + participants.length;

  const getVideoStyle = () => {
    const totalVideos = videos.length + 1;
    if (totalVideos <= 4) {
      return { height: '45vh' };
    } else if (totalVideos <= 9) {
      return { height: '35vh' };
    } else {
      return { height: '30vh' };
    }
  };

  return (
    <div className={styles.container}>
      <Snackbar 
        open={!!error} 
        autoHideDuration={6000} 
        onClose={() => setError("")}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          severity="warning" 
          onClose={() => setError("")}
          icon={<WarningIcon />}
        >
          {error}
          {error.includes("permissions") && (
            <Button color="inherit" size="small" onClick={retryPermissions} sx={{ ml: 2 }}>
              Retry
            </Button>
          )}
        </Alert>
      </Snackbar>

      {askForUsername ? (
        <Dialog open={askForUsername} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h4" component="div" color="primary" gutterBottom>
                VoxBridge
              </Typography>
              <Typography variant="subtitle1" component="div" color="textSecondary">
                Join Video Conference
              </Typography>
            </Box>
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
                  style={{ 
                    border: videoAvailable ? '2px solid green' : '2px solid #ccc',
                    maxWidth: '100%',
                    height: 'auto'
                  }}
                />
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  {videoAvailable ? 'Camera preview available' : 'No camera detected'}
                  {audioAvailable ? ' • Microphone available' : ' • No microphone detected'}
                </Typography>
              </Box>

              {(!videoAvailable && !audioAvailable) && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  No camera or microphone detected. You can still join with audio-only or just for chat.
                </Alert>
              )}
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
                <Typography variant="h6" component="div">Chat - VoxBridge</Typography>
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
              <Button 
                variant="contained" 
                onClick={sendMessage}
                disabled={!message.trim()}
                sx={{ ml: 1 }}
              >
                Send
              </Button>
            </DialogActions>
          </Dialog>

          {/* Main Video Conference Interface */}
          <div 
            ref={videoContainerRef}
            className={styles.videoContainer}
            style={{ 
              gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
              gap: '10px',
              padding: '10px'
            }}
          >
            {/* Local Video */}
            <div className={styles.videoWrapper}>
              <Card className={styles.videoCard}>
                <CardContent className={styles.videoCardContent}>
                  {videoAvailable ? (
                    <video
                      ref={localVideoref}
                      autoPlay
                      muted
                      playsInline
                      className={styles.videoElement}
                      style={getVideoStyle()}
                    />
                  ) : (
                    <Box 
                      className={styles.videoElement} 
                      style={getVideoStyle()}
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5'
                      }}
                    >
                      <Avatar sx={{ width: 80, height: 80, fontSize: '2rem' }}>
                        {username.charAt(0).toUpperCase()}
                      </Avatar>
                    </Box>
                  )}
                  <Typography variant="caption" component="div" className={styles.videoLabel}>
                    {username} (You) 
                    {!videoAvailable && " (No Camera)"}
                    {videoAvailable && !video && " (Video Off)"}
                  </Typography>
                </CardContent>
              </Card>
            </div>

            {/* Remote Videos */}
            {videos.map((video) => (
              <div key={video.socketId} className={styles.videoWrapper}>
                <Card className={styles.videoCard}>
                  <CardContent className={styles.videoCardContent}>
                    <video
                      autoPlay
                      playsInline
                      className={styles.videoElement}
                      style={getVideoStyle()}
                      ref={(el) => {
                        if (el) el.srcObject = video.stream;
                      }}
                    />
                    <Typography variant="caption" component="div" className={styles.videoLabel}>
                      {participants.find(p => p.id === video.socketId)?.username || 'User'}
                    </Typography>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>

          {/* Controls Section */}
          <Box className={styles.controlsContainer}>
            <Box className={styles.controls}>
              <IconButton
                onClick={handleVideo}
                disabled={!videoAvailable}
                className={`${styles.controlButton} ${!video ? styles.controlButtonOff : ''}`}
                size="large"
                title={videoAvailable ? (video ? "Turn off camera" : "Turn on camera") : "No camera available"}
              >
                {video ? <VideocamIcon /> : <VideocamOffIcon />}
              </IconButton>

              <IconButton
                onClick={handleAudio}
                disabled={!audioAvailable}
                className={`${styles.controlButton} ${!audio ? styles.controlButtonOff : ''}`}
                size="large"
                title={audioAvailable ? (audio ? "Mute microphone" : "Unmute microphone") : "No microphone available"}
              >
                {audio ? <MicIcon /> : <MicOffIcon />}
              </IconButton>

              <IconButton
                onClick={handleScreen}
                disabled={!screenAvailable}
                className={`${styles.controlButton} ${screen ? styles.controlButtonActive : ''}`}
                size="large"
                title={screenAvailable ? (screen ? "Stop screen share" : "Share screen") : "Screen sharing not available"}
              >
                {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
              </IconButton>

              <Badge badgeContent={newMessages} color="error">
                <IconButton
                  onClick={openChat}
                  className={styles.controlButton}
                  size="large"
                  title="Open chat"
                >
                  <ChatIcon />
                </IconButton>
              </Badge>

              <IconButton
                onClick={handleEndCall}
                className={`${styles.controlButton} ${styles.endCallButton}`}
                size="large"
                title="End call"
              >
                <CallEndIcon />
              </IconButton>
            </Box>

            {/* Participant Info */}
            <Box className={styles.participantInfo}>
              <PersonIcon fontSize="small" />
              <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                {actualParticipantCount} participant{actualParticipantCount !== 1 ? 's' : ''}
                {!videoAvailable && !audioAvailable && " (Audio/Video unavailable)"}
              </Typography>
            </Box>
          </Box>
        </div>
      )}
    </div>
  );
}