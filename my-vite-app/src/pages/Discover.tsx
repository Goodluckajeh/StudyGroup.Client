import { Box, AppBar, Toolbar, Typography, Button, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LoginIcon from '@mui/icons-material/Login';
import DiscoverGroups from '../components/DiscoverGroups';
import { useAppDispatch } from '../store/hooks';
import { logout } from '../store/slices/authSlice';

const Discover = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Ensure we're in guest mode (no token) when accessing this page
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // If there's a token, clear it and Redux state to ensure guest mode
      console.log('🔓 Clearing token for guest mode in Discover page');
      localStorage.removeItem('token');
      dispatch(logout());
    }
  }, [dispatch]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="static" sx={{ bgcolor: '#667eea' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => navigate('/')}
            sx={{ mr: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 600 }}>
            Discover Study Groups
          </Typography>
          <Button
            color="inherit"
            startIcon={<LoginIcon />}
            onClick={() => navigate('/login')}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Log In
          </Button>
        </Toolbar>
      </AppBar>

      {/* Content */}
      <Box sx={{ flex: 1 }}>
        <DiscoverGroups />
      </Box>
    </Box>
  );
};

export default Discover;