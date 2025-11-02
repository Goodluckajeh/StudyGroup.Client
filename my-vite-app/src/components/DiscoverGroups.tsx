import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Stack,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import PeopleIcon from '@mui/icons-material/People';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import AddIcon from '@mui/icons-material/Add';
import { studyGroupService, type StudyGroup } from '../services/studyGroupService';
import { useAppSelector } from '../store/hooks';
import CreateGroupDialog from './CreateGroupDialog';
import groupMemberService from '../services/groupMemberService';

interface DiscoverGroupsProps {
  onGroupChange?: () => void;
}

const DiscoverGroups = ({ onGroupChange }: DiscoverGroupsProps) => {
  const { user } = useAppSelector((state) => state.auth);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [joiningGroupId, setJoiningGroupId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [userGroupIds, setUserGroupIds] = useState<Set<number>>(new Set());
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  const fetchUserMemberships = useCallback(async () => {
    if (!user?.userId) return;
    
    try {
      const userId = typeof user.userId === 'string' ? parseInt(user.userId, 10) : user.userId;
      const response = await groupMemberService.getUserGroups(userId);
      const memberGroupIds = new Set(response.groups.map(g => g.membership.groupId));
      setUserGroupIds(memberGroupIds);
    } catch (err) {
      console.error('Error fetching user memberships:', err);
    }
  }, [user?.userId]);

  useEffect(() => {
    fetchGroups();
    if (user?.userId) {
      fetchUserMemberships();
    }
  }, [user?.userId, fetchUserMemberships]);

  useEffect(() => {
    // Filter groups based on search query
    if (searchQuery.trim() === '') {
      setFilteredGroups(groups);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = groups.filter(
        (group) =>
          group.courseName.toLowerCase().includes(query) ||
          (group.topic && group.topic.toLowerCase().includes(query)) ||
          (group.description && group.description.toLowerCase().includes(query))
      );
      setFilteredGroups(filtered);
    }
  }, [searchQuery, groups]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await studyGroupService.getAllGroups();
      setGroups(data);
      setFilteredGroups(data);
    } catch (err: unknown) {
      console.error('Error fetching groups:', err);
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Failed to load study groups');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (groupId: number) => {
    if (!user?.userId) {
      setLoginDialogOpen(true);
      return;
    }

    try {
      setJoiningGroupId(groupId);
      setError(null);
      const userId = typeof user.userId === 'string' ? parseInt(user.userId, 10) : user.userId;
      
      await studyGroupService.joinGroup(groupId, userId);
      
      setSuccessMessage('Successfully joined the group! 🎉');
      // Add this group to user's membership set
      setUserGroupIds(prev => new Set(prev).add(groupId));
      // Refresh groups to get updated member counts
      await fetchGroups();
      // Refresh user memberships
      await fetchUserMemberships();
      // Refresh sidebar group list
      if (onGroupChange) {
        onGroupChange();
      }
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: unknown) {
      console.error('Error joining group:', err);
      const error = err as { response?: { data?: { error?: string; Error?: string } } };
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.error || error.response?.data?.Error || 'Failed to join group';
      setError(errorMsg);
    } finally {
      setJoiningGroupId(null);
    }
  };

  const handleCreateSuccess = () => {
    setSuccessMessage('Group created successfully! 🎉');
    fetchGroups();
    // Refresh user memberships after creating a group
    fetchUserMemberships();
    // Refresh sidebar group list
    if (onGroupChange) {
      onGroupChange();
    }
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 4 }}>
      {/* Header with Create Button */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 0 }}>
            Discover Study Groups
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {user?.userId 
              ? 'Browse and join study groups to collaborate with other students'
              : 'Browse study groups - log in to join and create your own'
            }
          </Typography>
        </Box>
        {user?.userId && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              py: 1.5,
            }}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Group
          </Button>
        )}
      </Stack>

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search Bar */}
      <TextField
        fullWidth
        placeholder="Search by course name, topic, or description..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        sx={{ mb: 4 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon />
            </InputAdornment>
          ),
        }}
      />

      {/* Groups Count */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Showing {filteredGroups.length} of {groups.length} groups
      </Typography>

      {filteredGroups.length === 0 ? (
        <Paper elevation={2} sx={{ p: 6, textAlign: 'center' }}>
          <GroupsIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {searchQuery ? 'No groups found' : 'No study groups available'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchQuery
              ? 'Try adjusting your search terms'
              : 'Check back later for available study groups'}
          </Typography>
        </Paper>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
          {filteredGroups.map((group) => (
            <Card
              key={group.groupId}
                elevation={2}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Course Name - Primary identifier */}
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{
                      fontWeight: 600,
                      color: 'primary.main',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {group.courseName}
                  </Typography>

                  {/* Topic - What the group focuses on */}
                  {group.topic && (
                    <Chip
                      label={group.topic}
                      color="secondary"
                      size="small"
                      sx={{ mb: 2 }}
                    />
                  )}

                  {/* Description */}
                  {group.description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                      }}
                    >
                      {group.description}
                    </Typography>
                  )}

                  {/* Group Info */}
                  <Stack spacing={1} sx={{ mt: 'auto' }}>
                    {/* Creator */}
                    {(group.creatorName || group.creatorFirstName) && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PersonIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          Created by{' '}
                          <strong>
                            {group.creatorName || 
                             `${group.creatorFirstName || ''} ${group.creatorLastName || ''}`.trim()}
                          </strong>
                        </Typography>
                      </Stack>
                    )}

                    {/* Time Slot */}
                    {group.timeSlot && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CalendarTodayIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {group.timeSlot}
                        </Typography>
                      </Stack>
                    )}

                    {/* Member Count - if available */}
                    {group.currentMemberCount !== undefined && (
                      <Stack direction="row" spacing={1} alignItems="center">
                        <PeopleIcon fontSize="small" color="action" />
                        <Typography variant="body2" color="text.secondary">
                          {group.currentMemberCount} members
                        </Typography>
                      </Stack>
                    )}

                    {/* Active Status */}
                    {group.isActive !== undefined && (
                      <Chip
                        label={group.isActive ? 'Active' : 'Inactive'}
                        color={group.isActive ? 'success' : 'default'}
                        size="small"
                        sx={{ width: 'fit-content' }}
                      />
                    )}
                  </Stack>
                </CardContent>

                <CardActions sx={{ p: 2, pt: 0 }}>
                  {userGroupIds.has(group.groupId) ? (
                    <Button
                      fullWidth
                      variant="outlined"
                      disabled
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        borderColor: 'success.main',
                        color: 'success.main',
                      }}
                    >
                      Already a Member ✓
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={() => handleJoinGroup(group.groupId)}
                      disabled={joiningGroupId === group.groupId}
                      sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                      }}
                    >
                      {joiningGroupId === group.groupId ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : user?.userId ? (
                        'Join Group'
                      ) : (
                        'Log In to Join'
                      )}
                    </Button>
                  )}
                </CardActions>
              </Card>
          ))}
        </Box>
      )}

      {/* Create Group Dialog */}
      <CreateGroupDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Login Required Dialog */}
      <Dialog
        open={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
        aria-labelledby="login-dialog-title"
        aria-describedby="login-dialog-description"
      >
        <DialogTitle id="login-dialog-title">
          Login Required
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="login-dialog-description">
            You need to be logged in to join a study group. Please log in to continue.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLoginDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setLoginDialogOpen(false);
              window.location.href = '/auth';
            }}
            variant="contained"
            autoFocus
          >
            Log In
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default DiscoverGroups;
