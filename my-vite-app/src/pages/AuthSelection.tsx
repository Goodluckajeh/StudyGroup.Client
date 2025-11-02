import { Box, Button, Container, Typography, Stack, IconButton } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';

const AuthSelection = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
      }}
    >
      {/* Back Button */}
      <IconButton
        onClick={() => navigate('/')}
        sx={{
          position: 'absolute',
          top: 24,
          left: 24,
          color: 'white',
          bgcolor: 'rgba(255, 255, 255, 0.1)',
          '&:hover': {
            bgcolor: 'rgba(255, 255, 255, 0.2)',
          },
        }}
      >
        <ArrowBackIcon />
      </IconButton>

      <Container maxWidth="sm">
        <Stack spacing={4} alignItems="center">
          {/* Title */}
          <Typography
            variant="h3"
            sx={{
              color: 'white',
              fontWeight: 700,
              textAlign: 'center',
              fontSize: { xs: '2rem', sm: '3rem' },
            }}
          >
            Welcome Back!
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
            Choose an option to continue
          </Typography>

          {/* Buttons */}
          <Stack spacing={3} sx={{ width: '100%', maxWidth: 400 }}>
            {/* Log In Button */}
            <Button
              variant="contained"
              size="large"
              startIcon={<LoginIcon />}
              onClick={() => navigate('/login')}
              sx={{
                py: 2.5,
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
              Log In to Your Account
            </Button>

            {/* Divider */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(255, 255, 255, 0.3)' }} />
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
                OR
              </Typography>
              <Box sx={{ flex: 1, height: '1px', bgcolor: 'rgba(255, 255, 255, 0.3)' }} />
            </Box>

            {/* Register Button */}
            <Button
              variant="outlined"
              size="large"
              startIcon={<PersonAddIcon />}
              onClick={() => navigate('/register')}
              sx={{
                py: 2.5,
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
              Create New Account
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
            New to StudyGroup? Creating an account is free and easy
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
};

export default AuthSelection;
