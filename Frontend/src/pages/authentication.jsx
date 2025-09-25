import * as React from 'react';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Typography from '@mui/material/Typography';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../contexts/AuthContext';
import { Snackbar, Fade, Tabs, Tab, AppBar, Alert, CircularProgress } from '@mui/material';
import { styled } from '@mui/material/styles';

// Create a custom theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#FF9839',
      light: '#FFB570',
      dark: '#D97500',
    },
    secondary: {
      main: '#2D3748',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h5: {
      fontWeight: 600,
    },
  },
  shape: {
    borderRadius: 12,
  },
});

// Styled components for better customization
const StyledPaper = styled(Paper)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(4, 3),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
  backgroundColor: 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
}));

const StyledAvatar = styled(Avatar)(({ theme }) => ({
  margin: theme.spacing(1),
  backgroundColor: theme.palette.primary.main,
  width: 56,
  height: 56,
}));

const StyledForm = styled('form')(({ theme }) => ({
  width: '100%',
  marginTop: theme.spacing(2),
}));

const StyledSubmitButton = styled(Button)(({ theme }) => ({
  margin: theme.spacing(3, 0, 2),
  padding: theme.spacing(1.5),
  borderRadius: theme.shape.borderRadius * 2,
  fontWeight: 600,
  fontSize: '1rem',
  textTransform: 'none',
  boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  '&:hover': {
    boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
    transform: 'translateY(-2px)',
    transition: 'all 0.3s ease',
  },
}));

const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: 'none',
  fontWeight: 600,
  fontSize: '1rem',
}));

// Array of beautiful background images
const backgroundImages = [
  'https://images.unsplash.com/photo-1579546929662-711aa81148cf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
  'https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80',
  'https://images.unsplash.com/photo-1558591710-4b4a1ae0f04d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1374&q=80',
  'https://images.unsplash.com/photo-1550745165-9bc0b252726f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
  'https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1472&q=80'
];

// Function to get a random image from the array
const getRandomImage = () => {
  const randomIndex = Math.floor(Math.random() * backgroundImages.length);
  return backgroundImages[randomIndex];
};

// Background container with random image
const BackgroundContainer = styled(Grid)(({ theme, bgimage }) => ({
  backgroundImage: `url(${bgimage})`,
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: theme.spacing(4),
  color: 'white',
  textAlign: 'center',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 1,
  }
}));

const ContentBox = styled(Box)({
  position: 'relative',
  zIndex: 2,
});

// TabPanel component for accessibility
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function Authentication() {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [name, setName] = React.useState('');
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [tabValue, setTabValue] = React.useState(0);
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [bgImage, setBgImage] = React.useState('');

  const { handleRegister, handleLogin } = React.useContext(AuthContext);

  // Set random background image on component mount
  React.useEffect(() => {
    setBgImage(getRandomImage());
  }, []);

  // Handle tab change
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError(''); // Clear errors when switching tabs
  };

  // Handle authentication
  const handleAuth = async () => {
    setLoading(true);
    setError('');
    
    try {
      if (tabValue === 0) {
        // Login
        await handleLogin(username, password);
      } else {
        // Register
        const result = await handleRegister(name, username, password);
        console.log(result);
        setMessage(result);
        setOpen(true);
        setTabValue(0); // Switch to login tab after successful registration
        setName('');
        setUsername('');
        setPassword('');
      }
    } catch (err) {
      console.log(err);
      const errorMsg = err.response?.data?.message || 'An error occurred. Please try again.';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = (event) => {
    event.preventDefault();
    handleAuth();
  };

  // Handle snackbar close
  const handleClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  return (
    <ThemeProvider theme={theme}>
      <Grid container sx={{ height: '100vh' }}>
        <CssBaseline />
        <Grid item xs={12} sm={6} md={7}>
          <BackgroundContainer bgimage={bgImage}>
            <ContentBox>
              <Typography variant="h3" fontWeight="bold" gutterBottom>
                VoxBridge
              </Typography>
              <Typography variant="h6">
                Connect with crystal clear video calls
              </Typography>
              <Typography variant="body1" sx={{ mt: 2, opacity: 0.9 }}>
                Bridging hearts, not just connections
              </Typography>
            </ContentBox>
          </BackgroundContainer>
        </Grid>
        <Grid item xs={12} sm={6} md={5} component={Paper} elevation={6} square sx={{ borderRadius: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Box
            sx={{
              my: 8,
              mx: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <StyledPaper elevation={0}>
              <StyledAvatar>
                <LockOutlinedIcon />
              </StyledAvatar>
              <Typography component="h1" variant="h5" sx={{ mt: 1, mb: 2 }}>
                {tabValue === 0 ? 'Sign in to VoxBridge' : 'Create an Account'}
              </Typography>

              <AppBar position="static" color="transparent" elevation={0}>
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  indicatorColor="primary"
                  textColor="primary"
                  variant="fullWidth"
                  aria-label="auth tabs"
                >
                  <StyledTab label="Sign In" />
                  <StyledTab label="Sign Up" />
                </Tabs>
              </AppBar>

              <StyledForm onSubmit={handleSubmit}>
                <TabPanel value={tabValue} index={0}>
                  <Fade in={tabValue === 0} timeout={500}>
                    <div>
                      <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="login-username"
                        label="Username"
                        name="username"
                        value={username}
                        autoComplete="username"
                        autoFocus
                        onChange={(e) => setUsername(e.target.value)}
                        variant="outlined"
                      />
                      <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="login-password"
                        value={password}
                        autoComplete="current-password"
                        onChange={(e) => setPassword(e.target.value)}
                        variant="outlined"
                      />
                    </div>
                  </Fade>
                </TabPanel>

                <TabPanel value={tabValue} index={1}>
                  <Fade in={tabValue === 1} timeout={500}>
                    <div>
                      <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="register-name"
                        label="Full Name"
                        name="name"
                        value={name}
                        autoComplete="name"
                        autoFocus
                        onChange={(e) => setName(e.target.value)}
                        variant="outlined"
                      />
                      <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="register-username"
                        label="Username"
                        name="username"
                        value={username}
                        autoComplete="username"
                        onChange={(e) => setUsername(e.target.value)}
                        variant="outlined"
                      />
                      <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type="password"
                        id="register-password"
                        value={password}
                        autoComplete="new-password"
                        onChange={(e) => setPassword(e.target.value)}
                        variant="outlined"
                      />
                    </div>
                  </Fade>
                </TabPanel>

                {error && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    {error}
                  </Alert>
                )}

                <StyledSubmitButton
                  type="submit"
                  fullWidth
                  variant="contained"
                  disabled={loading}
                >
                  {loading ? 'Please wait...' : (tabValue === 0 ? 'Sign In' : 'Create Account')}
                </StyledSubmitButton>
              </StyledForm>
            </StyledPaper>
          </Box>
        </Grid>
      </Grid>

      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}