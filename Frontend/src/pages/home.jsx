import React, { useContext, useState } from 'react'
import withAuth from '../utils/withAuth'
import { useNavigate } from 'react-router-dom'
import "../App.css";
import { 
  Button, 
  TextField, 
  Box, 
  Typography,
  Card,
  CircularProgress
} from '@mui/material';
import {
  Restore,
  Videocam,
  Security,
  Group,
  CheckCircle
} from '@mui/icons-material';
import { AuthContext } from '../contexts/AuthContext';

function HomeComponent() {
  let navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const { addToUserHistory } = useContext(AuthContext);

  const validateMeetingCode = (code) => {
    return code.length >= 3 && /^[a-zA-Z0-9-]+$/.test(code);
  };

  let handleJoinVideoCall = async () => {
    if (!validateMeetingCode(meetingCode)) {
      setError("Please enter a valid meeting code (minimum 3 characters, letters, numbers and hyphens only)");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      await addToUserHistory(meetingCode);
      navigate(`/${meetingCode}`);
    } catch (err) {
      setError("Failed to join meeting. Please try again.");
      console.error("Join meeting error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleJoinVideoCall();
    }
  };

  const features = [
    { icon: <Videocam color="primary" />, text: "Crystal-clear HD video" },
    { icon: <Security color="primary" />, text: "End-to-end encryption" },
    { icon: <Group color="primary" />, text: "Unlimited participants" },
    { icon: <CheckCircle color="primary" />, text: "No time limits" }
  ];

  return (
    <>
      <div className="navBar">
        <div style={{ display: "flex", alignItems: "center" }}>
          <Videocam sx={{ mr: 1, fontSize: '2rem' }} />
          <h2>VoxBridge</h2>
        </div>

        <div className="navRight">
          <Button 
            className="historyButton"
            startIcon={<Restore />}
            onClick={() => navigate("/history")}
            sx={{ color: 'white' }}
          >
            History
          </Button>
          <Button 
            variant="outlined" 
            sx={{ 
              color: 'white', 
              borderColor: 'white',
              '&:hover': {
                borderColor: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/auth");
            }}
          >
            Logout
          </Button>
        </div>
      </div>

      <div className="meetContainer">
        <div className="leftPanel">
          <Card sx={{ p: 4, borderRadius: 3, boxShadow: 3, background: 'rgba(255, 255, 255, 0.95)' }}>
            <Typography 
              variant="h3" 
              component="h1" 
              gutterBottom 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textFillColor: 'transparent'
              }}
            >
              Bridge Distances with Crystal Clear Video
            </Typography>
            
            <Typography 
              variant="h5" 
              component="h2" 
              gutterBottom 
              sx={{ 
                fontWeight: 600,
                color: '#2d3748',
                mb: 3,
                fontStyle: 'italic'
              }}
            >
              Where voices meet vision
            </Typography>
            
            <Typography variant="h6" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
              Experience seamless video communication that feels like you're in the same room. 
              Start connecting instantly with just a meeting code.
            </Typography>

            <Box className="featureList">
              {features.map((feature, index) => (
                <Box key={index} className="featureItem">
                  {feature.icon}
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{feature.text}</Typography>
                </Box>
              ))}
            </Box>

            <Box className="joinContainer">
              <TextField
                className="joinInput"
                label="Enter Meeting Code"
                variant="outlined"
                value={meetingCode}
                onChange={(e) => {
                  setMeetingCode(e.target.value);
                  setError("");
                }}
                onKeyPress={handleKeyPress}
                placeholder="e.g., ABC-123"
                error={!!error}
                helperText={error}
                disabled={isLoading}
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2
                  }
                }}
              />
              <Button
                className={`joinButton ${isLoading ? 'buttonLoading' : ''}`}
                variant="contained"
                size="large"
                onClick={handleJoinVideoCall}
                disabled={isLoading || !meetingCode.trim()}
                startIcon={isLoading ? <CircularProgress size={20} /> : <Videocam />}
                sx={{
                  borderRadius: 2,
                  textTransform: 'none',
                  fontSize: '1.1rem',
                  padding: '12px 30px'
                }}
              >
                {isLoading ? 'Joining...' : 'Connect Now'}
              </Button>
            </Box>

            <Button
              variant="outlined"
              sx={{ 
                mt: 2,
                borderRadius: 2,
                textTransform: 'none'
              }}
              onClick={() => {
                const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                setMeetingCode(randomCode);
              }}
            >
              🎲 Generate Unique Code
            </Button>
          </Card>
        </div>
        
        <div className="rightPanel">
          <img 
            src='/logo3.png' 
            alt="VoxBridge video communication" 
            className="heroImage"
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1558655146-9f40138edfeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
            }}
          />
        </div>
      </div>
    </>
  );
}

export default withAuth(HomeComponent);