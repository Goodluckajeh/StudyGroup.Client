import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Stack,
  Chip,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Collapse,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert,
  Snackbar,
  Menu,
  MenuItem,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import SchoolIcon from '@mui/icons-material/School';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import LinkIcon from '@mui/icons-material/Link';
import CloseIcon from '@mui/icons-material/Close';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import { fetchMyGroups, leaveGroup as leaveGroupThunk, setSelectedGroup } from '../store/slices/studyGroupsSlice';
import DiscoverGroups from '../components/DiscoverGroups';
import Profile from '../components/Profile';
import Chat from '../components/Chat';
import ErrorBoundary from '../components/ErrorBoundary';
import groupMemberService, { type GroupMembership } from '../services/groupMemberService';
import messageService from '../services/messageService';
import apiClient from '../config/api';

type ViewType = 'discover' | 'profile' | 'groupChat';

interface GroupMember {
  groupMemberId: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
}

interface MediaItem {
  messageId: number;
  messageType: 'Image' | 'Link';
  mediaUrl?: string;
  content?: string;
  senderName: string;
  sentAt: string;
}

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const { myGroups, selectedGroup, loading: loadingGroups } = useAppSelector((state) => state.studyGroups);
  
  // Preserve the current view in localStorage to prevent unwanted view changes
  const [currentView, setCurrentViewState] = useState<ViewType>(() => {
    const savedView = localStorage.getItem('dashboardCurrentView');
    return (savedView as ViewType) || 'groupChat';
  });

  // Wrapper to save view to localStorage whenever it changes
  const setCurrentView = (view: ViewType) => {
    localStorage.setItem('dashboardCurrentView', view);
    setCurrentViewState(view);
  };
  const [mobileOpen, setMobileOpen] = useState(false);
  const [groupsOpen, setGroupsOpen] = useState(true);
  const [groupMembers, setGroupMembers] = useState<Map<number, GroupMember[]>>(new Map());
  const [showMembers, setShowMembers] = useState(false);
  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [removeMemberDialog, setRemoveMemberDialog] = useState<{ open: boolean; member: GroupMember | null }>({ open: false, member: null });
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const [sidebarAnchorEl, setSidebarAnchorEl] = useState<null | HTMLElement>(null);
  const [sidebarView, setSidebarView] = useState<'members' | 'media'>('members');
  const [groupMedia, setGroupMedia] = useState<Map<number, MediaItem[]>>(new Map());
  const [loadingMedia, setLoadingMedia] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  // Fetch user's groups using Redux thunk - only when userId actually changes
  useEffect(() => {
    if (user?.userId && myGroups.length === 0) {
      // Only fetch if we don't have groups yet
      const userId = typeof user.userId === 'string' ? parseInt(user.userId, 10) : user.userId;
      dispatch(fetchMyGroups(userId));
    }
  }, [user?.userId, dispatch, myGroups.length]);

  const fetchGroupMembers = async (groupId: number) => {
    try {
      const response = await apiClient.get(`/groupmembers/groups/${groupId}/members`);
      const members = response.data.Members || response.data.members || [];
      setGroupMembers(prev => new Map(prev).set(groupId, members));
    } catch (error) {
      console.error('Failed to fetch group members:', error);
    }
  };

  const fetchGroupMedia = async (groupId: number) => {
    try {
      setLoadingMedia(true);
      // Get or create conversation for the group
      const conversation = await messageService.getOrCreateGroupConversation(groupId);
      if (!conversation || !conversation.conversationId) return;

      // Fetch all messages
      const messages = await messageService.getConversationMessages(conversation.conversationId);
      
      // Filter for media messages (Images and Links)
      const mediaMessages: MediaItem[] = messages
        .filter((msg: any) => msg.messageType === 'Image' || msg.messageType === 'Link')
        .map((msg: any) => ({
          messageId: msg.messageId,
          messageType: msg.messageType,
          mediaUrl: msg.mediaUrl,
          content: msg.content,
          senderName: msg.senderName,
          sentAt: msg.sentAt,
        }));

      setGroupMedia(prev => new Map(prev).set(groupId, mediaMessages));
    } catch (error) {
      console.error('Failed to fetch group media:', error);
    } finally {
      setLoadingMedia(false);
    }
  };

  const handleGroupClick = (group: GroupMembership) => {
    dispatch(setSelectedGroup(group));
    setCurrentView('groupChat');
    setShowMembers(false); // Reset members view when switching groups
  };

  const handleSidebarMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setSidebarAnchorEl(event.currentTarget);
  };

  const handleSidebarMenuClose = () => {
    setSidebarAnchorEl(null);
  };

  const handleSidebarOptionSelect = (option: 'members' | 'media') => {
    setSidebarView(option);
    setShowMembers(true);
    handleSidebarMenuClose();
    
    if (selectedGroup) {
      // Fetch members if we're showing members and don't have them
      if (option === 'members' && !groupMembers.has(selectedGroup.groupId)) {
        fetchGroupMembers(selectedGroup.groupId);
      }
      // Always fetch fresh media when switching to media view
      if (option === 'media') {
        fetchGroupMedia(selectedGroup.groupId);
      }
    }
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const handleLeaveGroup = async () => {
    if (!selectedGroup || !user?.userId) return;

    try {
      const userId = typeof user.userId === 'string' ? parseInt(user.userId, 10) : user.userId;
      await dispatch(leaveGroupThunk({ groupMemberId: selectedGroup.groupMemberId, userId })).unwrap();
      setSnackbar({ open: true, message: 'Successfully left the group', severity: 'success' });
      setLeaveDialogOpen(false);
      setCurrentView('discover');
    } catch (error) {
      console.error('Error leaving group:', error);
      setSnackbar({ open: true, message: 'Failed to leave group', severity: 'error' });
    }
  };

  const handleRemoveMember = async () => {
    if (!removeMemberDialog.member || !selectedGroup || !user?.userId) return;

    try {
      await groupMemberService.removeMember(removeMemberDialog.member.groupMemberId);
      setSnackbar({ open: true, message: 'Member removed successfully', severity: 'success' });
      setRemoveMemberDialog({ open: false, member: null });
      
      // Refresh member list for this group
      await fetchGroupMembers(selectedGroup.groupId);
      // Refresh groups to update member count
      const userId = typeof user.userId === 'string' ? parseInt(user.userId, 10) : user.userId;
      dispatch(fetchMyGroups(userId));
    } catch (error) {
      console.error('Error removing member:', error);
      setSnackbar({ open: true, message: 'Failed to remove member', severity: 'error' });
    }
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  if (!user) {
    return null;
  }

  // Get user initials for avatar
  const getInitials = () => {
    const firstInitial = user.firstName?.charAt(0) || '';
    const lastInitial = user.lastName?.charAt(0) || '';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  const drawerWidth = 280;

  // Sidebar content
  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#3f0e40' }}>
      {/* User Profile Section - Fixed at top */}
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: '#667eea',
              fontSize: '1.2rem',
            }}
          >
            {getInitials()}
          </Avatar>
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <Typography 
              variant="subtitle1" 
              sx={{ 
                color: 'white', 
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.firstName} {user.lastName}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255,255,255,0.7)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
              }}
            >
              {user.email}
            </Typography>
          </Box>
        </Stack>
      </Box>

      {/* Navigation Menu - Scrollable section */}
      <List sx={{ 
        flex: 1, 
        pt: 2, 
        overflowY: 'auto',
        overflowX: 'hidden',
        '&::-webkit-scrollbar': {
          width: '8px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'rgba(255,255,255,0.05)',
        },
        '&::-webkit-scrollbar-thumb': {
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '4px',
          '&:hover': {
            background: 'rgba(255,255,255,0.3)',
          },
        },
      }}>
        {/* My Groups Collapsible Section */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setGroupsOpen(!groupsOpen)}
            sx={{
              py: 1.5,
              px: 3,
              pr: 1,
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.08)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'white' }}>
              <GroupsIcon />
            </ListItemIcon>
            <ListItemText 
              primary={`Study Groups (${myGroups.length})`}
              primaryTypographyProps={{
                sx: { color: 'white', fontWeight: 500 }
              }}
            />
            {loadingGroups ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : (
              groupsOpen ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />
            )}
          </ListItemButton>
        </ListItem>

        <Collapse in={groupsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {myGroups.length === 0 ? (
              <ListItem sx={{ pl: 7, py: 1 }}>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                  No groups yet
                </Typography>
              </ListItem>
            ) : (
              myGroups.map((group) => (
                <Box key={group.groupMemberId}>
                  <ListItem 
                    disablePadding
                    sx={{
                      bgcolor: selectedGroup?.groupId === group.groupId ? 'rgba(255,255,255,0.15)' : 'transparent',
                    }}
                  >
                    <ListItemButton
                      onClick={() => handleGroupClick(group)}
                      sx={{
                        pl: 7,
                        py: 1,
                        pr: 1,
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.08)',
                        },
                      }}
                    >
                      <ListItemIcon sx={{ minWidth: 32, color: 'rgba(255,255,255,0.7)' }}>
                        <SchoolIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={group.courseName}
                        secondary={group.topic || 'General Study Group'}
                        primaryTypographyProps={{
                          sx: { 
                            color: 'white', 
                            fontSize: '0.875rem',
                            fontWeight: selectedGroup?.groupId === group.groupId ? 600 : 500,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }
                        }}
                        secondaryTypographyProps={{
                          sx: { 
                            color: 'rgba(255,255,255,0.6)', 
                            fontSize: '0.75rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }
                        }}
                      />
                      <Chip
                        label={group.currentMemberCount}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.7rem',
                          bgcolor: 'rgba(102, 126, 234, 0.3)',
                          color: 'white',
                          fontWeight: 600,
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                  
                </Box>
              ))
            )}
          </List>
        </Collapse>

        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setCurrentView('discover')}
            selected={currentView === 'discover'}
            sx={{
              py: 1.5,
              px: 3,
              '&.Mui-selected': {
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.15)',
                },
              },
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.08)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'white' }}>
              <SearchIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Discover Groups" 
              primaryTypographyProps={{
                sx: { color: 'white', fontWeight: currentView === 'discover' ? 600 : 400 }
              }}
            />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setCurrentView('profile')}
            selected={currentView === 'profile'}
            sx={{
              py: 1.5,
              px: 3,
              '&.Mui-selected': {
                bgcolor: 'rgba(255,255,255,0.1)',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.15)',
                },
              },
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.08)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'white' }}>
              <PersonIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Profile" 
              primaryTypographyProps={{
                sx: { color: 'white', fontWeight: currentView === 'profile' ? 600 : 400 }
              }}
            />
          </ListItemButton>
        </ListItem>
      </List>

      {/* Logout Button - Fixed at bottom */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
        <ListItemButton
          onClick={handleLogout}
          sx={{
            borderRadius: '8px',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.08)',
            },
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'white' }}>
            <LogoutIcon />
          </ListItemIcon>
          <ListItemText 
            primary="Logout" 
            primaryTypographyProps={{
              sx: { color: 'white' }
            }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  // Render content based on current view
  const renderContent = () => {
    switch (currentView) {
      case 'groupChat':
        if (!selectedGroup) {
          return (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%',
              p: 4 
            }}>
              <GroupsIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h5" gutterBottom color="text.secondary">
                No study group selected
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Select a study group from the sidebar to view details
              </Typography>
            </Box>
          );
        }

        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Group Header */}
            <Paper 
              elevation={1} 
              sx={{ 
                p: 2, 
                borderRadius: 0,
                borderBottom: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ bgcolor: '#667eea', width: 48, height: 48 }}>
                  <SchoolIcon />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={600}>
                    {selectedGroup.courseName}
                  </Typography>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {selectedGroup.topic && (
                      <Chip 
                        label={selectedGroup.topic} 
                        size="small" 
                        sx={{ height: 20, fontSize: '0.75rem' }}
                      />
                    )}
                    <Typography variant="caption" color="text.secondary">
                      {selectedGroup.currentMemberCount} {selectedGroup.currentMemberCount === 1 ? 'member' : 'members'}
                    </Typography>
                  </Stack>
                </Box>
                <IconButton
                  onClick={handleSidebarMenuClick}
                  sx={{
                    color: showMembers ? 'primary.main' : 'text.secondary',
                    '&:hover': {
                      color: 'primary.main',
                    },
                  }}
                >
                  <MoreVertIcon />
                </IconButton>
                <Menu
                  anchorEl={sidebarAnchorEl}
                  open={Boolean(sidebarAnchorEl)}
                  onClose={handleSidebarMenuClose}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                  }}
                  transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                  }}
                >
                  <MenuItem onClick={() => handleSidebarOptionSelect('members')}>
                    <ListItemIcon>
                      <PeopleIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Members</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={() => handleSidebarOptionSelect('media')}>
                    <ListItemIcon>
                      <PhotoLibraryIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Media</ListItemText>
                  </MenuItem>
                </Menu>
              </Stack>

              {/* Group Details */}
              {(selectedGroup.timeSlot || selectedGroup.description) && (
                <Box sx={{ mt: 2 }}>
                  {selectedGroup.timeSlot && (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <CalendarTodayIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" color="text.secondary">
                        {selectedGroup.timeSlot}
                      </Typography>
                    </Stack>
                  )}
                  {selectedGroup.description && (
                    <Typography variant="body2" color="text.secondary">
                      {selectedGroup.description}
                    </Typography>
                  )}
                </Box>
              )}
            </Paper>

            {/* Main Content Area */}
            <Box sx={{ flex: 1, display: 'flex' }}>
              {/* Chat Area */}
              <Box sx={{ 
                flex: 1, 
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
              }}>
                <ErrorBoundary>
                  <Chat 
                    studyGroupId={selectedGroup.groupId} 
                    studyGroupName={selectedGroup.courseName}
                  />
                </ErrorBoundary>
              </Box>

              {/* Right Sidebar (Members/Media) */}
              {showMembers && (
                <Paper 
                  elevation={0} 
                  sx={{ 
                    width: 300,
                    borderLeft: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column',
                    animation: 'slideIn 0.3s ease-out',
                    '@keyframes slideIn': {
                      from: { transform: 'translateX(100%)', opacity: 0 },
                      to: { transform: 'translateX(0)', opacity: 1 },
                    },
                  }}
                >
                  <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="subtitle1" fontWeight={600}>
                        {sidebarView === 'media' ? 'Media' : `Members (${selectedGroup.currentMemberCount})`}
                      </Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        {sidebarView === 'members' && selectedGroup.creatorId !== (typeof user?.userId === 'string' ? parseInt(user.userId) : user?.userId) && (
                          <Button
                            size="small"
                            startIcon={<ExitToAppIcon />}
                            onClick={() => setLeaveDialogOpen(true)}
                            color="error"
                            sx={{ textTransform: 'none' }}
                          >
                            Leave Group
                          </Button>
                        )}
                        <IconButton
                          size="small"
                          onClick={() => setShowMembers(false)}
                          sx={{ ml: 1 }}
                        >
                          <CloseIcon />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </Box>
                  
                  <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                    {sidebarView === 'media' ? (
                      loadingMedia ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <CircularProgress size={24} />
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            Loading media...
                          </Typography>
                        </Box>
                      ) : groupMedia.get(selectedGroup.groupId)?.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                          <PhotoLibraryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                          <Typography variant="body2" color="text.secondary">
                            No media shared yet
                          </Typography>
                        </Box>
                      ) : (
                        <Stack spacing={2}>
                          {groupMedia.get(selectedGroup.groupId)?.map((media) => (
                            <Paper
                              key={media.messageId}
                              elevation={0}
                              sx={{
                                p: 1.5,
                                bgcolor: 'grey.50',
                                borderRadius: 1,
                              }}
                            >
                              {media.messageType === 'Image' ? (
                                <Box>
                                  <img
                                    src={media.mediaUrl?.startsWith('http') ? media.mediaUrl : `https://localhost:43960${media.mediaUrl}`}
                                    alt="Shared"
                                    style={{
                                      width: '100%',
                                      borderRadius: '4px',
                                      marginBottom: '8px',
                                    }}
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                    }}
                                  />
                                  <Typography variant="caption" color="text.secondary">
                                    Shared by {media.senderName}
                                  </Typography>
                                </Box>
                              ) : (
                                <Box>
                                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.5 }}>
                                    <LinkIcon fontSize="small" color="primary" />
                                    <Typography variant="body2" fontWeight={600}>
                                      {media.content || 'Link'}
                                    </Typography>
                                  </Stack>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      display: 'block',
                                      mb: 0.5,
                                      wordBreak: 'break-all',
                                      color: 'primary.main',
                                      textDecoration: 'none',
                                      cursor: 'pointer',
                                      '&:hover': { textDecoration: 'underline' },
                                    }}
                                    component="a"
                                    href={media.mediaUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {media.mediaUrl}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    Shared by {media.senderName}
                                  </Typography>
                                </Box>
                              )}
                            </Paper>
                          ))}
                        </Stack>
                      )
                    ) : (
                      groupMembers.get(selectedGroup.groupId) ? (
                        groupMembers.get(selectedGroup.groupId)!.length === 0 ? (
                          <Box sx={{ textAlign: 'center', py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                              No members yet
                            </Typography>
                          </Box>
                        ) : (
                          <Stack spacing={1}>
                            {groupMembers.get(selectedGroup.groupId)!.map((member) => (
                            <Paper 
                              key={member.groupMemberId}
                              elevation={0}
                              sx={{ 
                                p: 1.5,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                                bgcolor: 'grey.50',
                                borderRadius: 1,
                              }}
                            >
                              <Avatar sx={{ bgcolor: '#667eea', width: 32, height: 32 }}>
                                {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                              </Avatar>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" fontWeight={500} noWrap>
                                  {member.firstName} {member.lastName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" noWrap>
                                  {member.email}
                                </Typography>
                              </Box>
                              {selectedGroup.creatorId === member.userId ? (
                                <Chip 
                                  label="Creator" 
                                  size="small" 
                                  color="primary"
                                  sx={{ fontSize: '0.7rem', height: 18 }}
                                />
                              ) : (
                                selectedGroup.creatorId === (typeof user?.userId === 'string' ? parseInt(user.userId) : user?.userId) && (
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => setRemoveMemberDialog({ open: true, member })}
                                    sx={{ ml: 1 }}
                                  >
                                    <RemoveCircleOutlineIcon fontSize="small" />
                                  </IconButton>
                                )
                              )}
                            </Paper>
                          ))}
                        </Stack>
                      )
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 4 }}>
                        <CircularProgress size={24} />
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          Loading members...
                        </Typography>
                      </Box>
                    )
                    )}
                  </Box>
                </Paper>
              )}
            </Box>
          </Box>
        );
      
      case 'discover':
        return <DiscoverGroups onGroupChange={() => {
          if (user?.userId) {
            const userId = typeof user.userId === 'string' ? parseInt(user.userId, 10) : user.userId;
            dispatch(fetchMyGroups(userId));
          }
        }} />;
      
      case 'profile':
        return <Profile />;
      
      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* App Bar for mobile */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          display: { sm: 'none' },
          bgcolor: '#3f0e40',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div">
            StudyGroup
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              border: 'none',
            },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              border: 'none',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          height: '100vh',
          overflow: 'auto',
          bgcolor: '#f8f9fa',
        }}
      >
        <Toolbar sx={{ display: { sm: 'none' } }} />
        {renderContent()}
      </Box>

      {/* Leave Group Dialog */}
      <Dialog
        open={leaveDialogOpen}
        onClose={() => setLeaveDialogOpen(false)}
      >
        <DialogTitle>Leave Study Group</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to leave "{selectedGroup?.courseName}"? You'll need to join again if you change your mind.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleLeaveGroup} color="error" variant="contained">
            Leave Group
          </Button>
        </DialogActions>
      </Dialog>

      {/* Remove Member Dialog */}
      <Dialog
        open={removeMemberDialog.open}
        onClose={() => setRemoveMemberDialog({ open: false, member: null })}
      >
        <DialogTitle>Remove Member</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove {removeMemberDialog.member?.firstName} {removeMemberDialog.member?.lastName} from the group?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoveMemberDialog({ open: false, member: null })}>Cancel</Button>
          <Button onClick={handleRemoveMember} color="error" variant="contained">
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Dashboard;
