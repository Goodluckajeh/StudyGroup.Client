import { Box, Button, Container, Typography, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import GroupsIcon from '@mui/icons-material/Groups';

const Landing = () => {
  const navigate = useNavigate();

  const handleContinueAsGuest = () => {
    // Clear any existing authentication token
    localStorage.removeItem('token');
    console.log('🔓 Cleared authentication token for guest mode');
    navigate('/discover');
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={4} alignItems="center">
          {/* Logo/Icon */}
          <Box
            sx={{
              width: 120,
              height: 120,
              borderRadius: '24px',
              background: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
          >
            <GroupsIcon sx={{ fontSize: 70, color: '#667eea' }} />
          </Box>

          {/* App Name */}
          <Typography
            variant="h2"
            sx={{
              color: 'white',
              fontWeight: 700,
              textAlign: 'center',
              fontSize: { xs: '2.5rem', sm: '3.5rem' },
            }}
          >
            StudyGroup
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(255, 255, 255, 0.9)',
              textAlign: 'center',
              fontWeight: 400,
              mb: 2,
            }}
          >
            Connect, Collaborate, and Succeed Together
          </Typography>

          {/* Buttons */}
          <Stack spacing={2} sx={{ width: '100%', maxWidth: 400 }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/login')}
              sx={{
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                bgcolor: 'white',
                color: '#667eea',
                borderRadius: '12px',
                textTransform: 'none',
                boxShadow: '0 4px 14px rgba(0,0,0,0.2)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.95)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Sign In
            </Button>

            <Button
              variant="outlined"
              size="large"
              onClick={handleContinueAsGuest}
              sx={{
                py: 2,
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'white',
                borderColor: 'rgba(255, 255, 255, 0.5)',
                borderRadius: '12px',
                textTransform: 'none',
                borderWidth: 2,
                '&:hover': {
                  borderColor: 'white',
                  borderWidth: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Continue as Guest
            </Button>
          </Stack>

          {/* Footer Text */}
          <Typography
            variant="body2"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center',
              mt: 4,
            }}
          >
            Join thousands of students collaborating effectively
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
};

export default Landing;
