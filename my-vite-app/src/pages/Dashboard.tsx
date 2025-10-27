import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Paper,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <Container component="main" maxWidth="lg">
      <Box sx={{ marginTop: 8 }}>
        <Paper elevation={3} sx={{ padding: 4 }}>
          <Typography component="h1" variant="h4" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Welcome to your Study Group dashboard!
          </Typography>
          <Button variant="contained" color="primary" onClick={handleLogout}>
            Logout
          </Button>
        </Paper>
      </Box>
    </Container>
  );
};

export default Dashboard;
