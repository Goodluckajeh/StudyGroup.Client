import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Stack,
  Chip,
  Button,
  TextField,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import WorkIcon from '@mui/icons-material/Work';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import userService, { type UpdateUserDto } from '../services/userService';
import { setUser } from '../store/slices/authSlice';

const Profile = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<UpdateUserDto>({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    skills: user?.skills || '',
    bio: user?.bio || '',
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        skills: user.skills || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  const handleInputChange = (field: keyof UpdateUserDto, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await userService.updateMyProfile(formData);
      
      // Update the user in Redux store
      dispatch(setUser({
        ...user!,
        firstName: formData.firstName,
        lastName: formData.lastName,
        skills: formData.skills,
        bio: formData.bio,
      }));

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to current user data
    if (user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        skills: user.skills || '',
        bio: user.bio || '',
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const getInitials = () => {
    if (!user) return 'U';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  };

  const skillsArray = formData.skills
    ? formData.skills.split(',').map((s) => s.trim()).filter((s) => s)
    : [];

  return (
    <Box sx={{ p: 4, maxWidth: 1200, mx: 'auto' }}>
      {/* Header Section */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold">
          My Profile
        </Typography>
        {!isEditing && (
          <Button
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => setIsEditing(true)}
            sx={{ bgcolor: '#5e35b1', '&:hover': { bgcolor: '#4527a0' } }}
          >
            Edit Profile
          </Button>
        )}
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Main Profile Card */}
      <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
        <Stack spacing={4}>
          {/* Avatar and Name Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                bgcolor: '#5e35b1',
                fontSize: '2rem',
                fontWeight: 'bold',
              }}
            >
              {getInitials()}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              {isEditing ? (
                <Stack spacing={2}>
                  <TextField
                    label="First Name"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    fullWidth
                    required
                    InputProps={{
                      startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                  <TextField
                    label="Last Name"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    fullWidth
                    required
                    InputProps={{
                      startAdornment: <PersonIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Stack>
              ) : (
                <>
                  <Typography variant="h5" fontWeight="bold" gutterBottom>
                    {user?.firstName} {user?.lastName}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <EmailIcon sx={{ color: 'text.secondary', fontSize: '1.2rem' }} />
                    <Typography variant="body1" color="text.secondary">
                      {user?.email}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>
          </Box>

          <Divider />

          {/* Skills Section */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <WorkIcon color="primary" />
              <Typography variant="h6" fontWeight="bold">
                Skills & Expertise
              </Typography>
            </Box>
            {isEditing ? (
              <TextField
                label="Skills"
                value={formData.skills}
                onChange={(e) => handleInputChange('skills', e.target.value)}
                fullWidth
                multiline
                rows={2}
                placeholder="Enter your skills separated by commas (e.g., React, TypeScript, Node.js)"
                helperText="Separate skills with commas. These help others find you for study groups!"
              />
            ) : (
              <Box>
                {skillsArray.length > 0 ? (
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {skillsArray.map((skill, index) => (
                      <Chip
                        key={index}
                        label={skill}
                        color="primary"
                        variant="outlined"
                        size="medium"
                        sx={{ fontWeight: 500 }}
                      />
                    ))}
                  </Stack>
                ) : (
                  <Typography variant="body2" color="text.secondary" fontStyle="italic">
                    No skills added yet. Add skills to help others discover you!
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          <Divider />

          {/* Bio Section */}
          <Box>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              About Me
            </Typography>
            {isEditing ? (
              <TextField
                label="Bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                fullWidth
                multiline
                rows={4}
                placeholder="Tell others about yourself, your interests, and your learning goals..."
                helperText="Share a bit about yourself to help connect with like-minded students"
              />
            ) : (
              <Box>
                {formData.bio ? (
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {formData.bio}
                  </Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary" fontStyle="italic">
                    No bio added yet. Share something about yourself!
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {/* Action Buttons */}
          {isEditing && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={handleSave}
                disabled={loading || !formData.firstName || !formData.lastName}
                sx={{ bgcolor: '#5e35b1', '&:hover': { bgcolor: '#4527a0' } }}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </Box>
          )}
        </Stack>
      </Paper>

      {/* Profile Stats Card */}
      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight="bold" gutterBottom>
          Profile Statistics
        </Typography>
        <Stack spacing={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Skills Listed
            </Typography>
            <Chip label={skillsArray.length} color="primary" size="small" />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Bio Status
            </Typography>
            <Chip
              label={formData.bio ? 'Complete' : 'Incomplete'}
              color={formData.bio ? 'success' : 'warning'}
              size="small"
            />
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default Profile;
