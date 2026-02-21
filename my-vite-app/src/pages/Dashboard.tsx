import { useNavigate } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
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
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ChatIcon from '@mui/icons-material/Chat';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import SchoolIcon from '@mui/icons-material/School';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PeopleIcon from '@mui/icons-material/People';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logout } from '../store/slices/authSlice';
import DiscoverGroups from '../components/DiscoverGroups';
import Profile from '../components/Profile';
import groupMemberService, { type GroupMembership } from '../services/groupMemberService';
import apiClient from '../config/api';

type ViewType = 'messages' | 'discover' | 'profile' | 'groupChat';

interface GroupMember {
  groupMemberId: number;
  userId: number;
  firstName: string;
  lastName: string;
  email: string;
}

const Dashboard = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const [currentView, setCurrentView] = useState<ViewType>('groupChat');
  const [selectedGroup, setSelectedGroup] = useState<GroupMembership | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [myGroups, setMyGroups] = useState<GroupMembership[]>([]);
  const [groupsOpen, setGroupsOpen] = useState(true);
  const [dmsOpen, setDmsOpen] = useState(false);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [groupMembers, setGroupMembers] = useState<Map<number, GroupMember[]>>(new Map());
  const [showMembers, setShowMembers] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const fetchMyGroups = useCallback(async (options?: { preserveCurrentView?: boolean }) => {
    if (!user?.userId) {
      return;
    }
    
    try {
      setLoadingGroups(true);
      const userId = typeof user.userId === 'string' ? parseInt(user.userId, 10) : user.userId;
      
      const response = await groupMemberService.getUserGroups(userId);
      
      // Extract the Membership objects from the response
      const groups = response.groups.map(g => g.membership);
      
      setMyGroups(groups);
      
      // Auto-select first group if no group is selected and groups exist
      if (groups.length > 0 && !options?.preserveCurrentView) {
        let autoSelected = false;
        setSelectedGroup((prev) => {
          if (prev) {
            return prev;
          }
          autoSelected = true;
          return groups[0] ?? null;
        });

        if (autoSelected) {
          setCurrentView('groupChat');
        }
      }
    } catch (error: unknown) {
      console.error('Failed to fetch user groups:', error);
      const err = error as { response?: { data?: unknown; status?: number } };
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
    } finally {
      setLoadingGroups(false);
    }
  }, [user?.userId]);

  // Fetch user's groups
  useEffect(() => {
    if (user?.userId) {
      fetchMyGroups();
    }
  }, [user?.userId, fetchMyGroups]);

  const fetchGroupMembers = async (groupId: number) => {
    try {
      const response = await apiClient.get(`/groupmembers/groups/${groupId}/members`);
      const members = response.data.Members || response.data.members || [];
      setGroupMembers(prev => new Map(prev).set(groupId, members));
    } catch (error) {
      console.error('Failed to fetch group members:', error);
    }
  };

  const handleGroupClick = (group: GroupMembership) => {
    setSelectedGroup(group);
    setCurrentView('groupChat');
    setShowMembers(false); // Reset members view when switching groups
  };

  const handleShowMembers = () => {
    setShowMembers(!showMembers);
    // Fetch members if we don't have them and we're showing the panel
    if (!showMembers && selectedGroup && !groupMembers.has(selectedGroup.groupId)) {
      fetchGroupMembers(selectedGroup.groupId);
    }
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
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
      {/* User Profile Section */}
      <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
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

      {/* Navigation Menu */}
      <List sx={{ flex: 1, pt: 2 }}>
        {/* Direct Messages Collapsible Section */}
        <ListItem disablePadding>
          <ListItemButton
            onClick={() => setDmsOpen(!dmsOpen)}
            sx={{
              py: 1.5,
              px: 3,
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.08)',
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40, color: 'white' }}>
              <ChatIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Direct Messages"
              primaryTypographyProps={{
                sx: { color: 'white', fontWeight: 500 }
              }}
            />
            {dmsOpen ? <ExpandLess sx={{ color: 'white' }} /> : <ExpandMore sx={{ color: 'white' }} />}
          </ListItemButton>
        </ListItem>

        <Collapse in={dmsOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItem sx={{ pl: 7, py: 1 }}>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontStyle: 'italic' }}>
                No direct messages yet
              </Typography>
            </ListItem>
            {/* TODO: Add DM list here when backend is ready */}
          </List>
        </Collapse>

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

      {/* Logout Button */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }}>
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
                  onClick={handleShowMembers}
                  sx={{
                    color: showMembers ? 'primary.main' : 'text.secondary',
                    '&:hover': {
                      color: 'primary.main',
                    },
                  }}
                >
                  <PeopleIcon />
                </IconButton>
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
                p: 3, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <ChatIcon sx={{ fontSize: 80, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h5" gutterBottom color="text.secondary">
                    Group Chat Coming Soon
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Chat functionality will be implemented here
                  </Typography>
                </Box>
              </Box>

              {/* Members Sidebar */}
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
                    <Typography variant="subtitle1" fontWeight={600}>
                      Members ({selectedGroup.currentMemberCount})
                    </Typography>
                  </Box>
                  
                  <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
                    {groupMembers.get(selectedGroup.groupId) ? (
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
                              {selectedGroup.creatorId === member.userId && (
                                <Chip 
                                  label="Creator" 
                                  size="small" 
                                  color="primary"
                                  sx={{ fontSize: '0.7rem', height: 18 }}
                                />
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
                    )}
                  </Box>
                </Paper>
              )}
            </Box>
          </Box>
        );

      case 'messages':
        return (
          <Box sx={{ p: 4 }}>
            <Typography variant="h4" gutterBottom>
              Direct Messages
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
              Coming soon! Direct messages with other students will appear here.
            </Typography>
          </Box>
        );
      
      case 'discover':
        return <DiscoverGroups onGroupChange={() => fetchMyGroups({ preserveCurrentView: true })} />;
      
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
    </Box>
  );
};

export default Dashboard;
