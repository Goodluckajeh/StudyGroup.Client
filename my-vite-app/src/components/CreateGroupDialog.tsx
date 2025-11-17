import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  CircularProgress,
  Alert,
  Autocomplete,
} from '@mui/material';
import { courseService, type Course } from '../services/courseService';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { createGroup, fetchMyGroups } from '../store/slices/studyGroupsSlice';

interface CreateGroupDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateGroupDialog = ({ open, onClose, onSuccess }: CreateGroupDialogProps) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    selectedCourse: null as Course | null,
    topic: '',
    timeSlot: '',
    description: '',
  });
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch courses when dialog opens
  useEffect(() => {
    if (open) {
      fetchCourses();
    }
  }, [open]);

  const fetchCourses = async () => {
    try {
      setLoadingCourses(true);
      const data = await courseService.getAllCourses();
      setCourses(data);
    } catch (err: unknown) {
      console.error('Error fetching courses:', err);
      setError('Failed to load courses. You can still create a group without selecting a course.');
    } finally {
      setLoadingCourses(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.selectedCourse) {
      setError('Please select a course');
      return;
    }

    if (!formData.topic.trim()) {
      setError('Please enter a topic for the study group');
      return;
    }

    if (!user?.userId) {
      setError('You must be logged in to create a group');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const userId = typeof user.userId === 'string' ? parseInt(user.userId) : user.userId;

      const groupData = {
        courseName: formData.selectedCourse.courseName,
        creatorId: userId,
        topic: formData.topic.trim(),
        timeSlot: formData.timeSlot.trim() || undefined,
        description: formData.description.trim() || undefined,
      };

      // Create group using Redux thunk
      await dispatch(createGroup(groupData)).unwrap();
      
      // Refresh the groups list
      await dispatch(fetchMyGroups(userId)).unwrap();
      
      // Reset form
      setFormData({
        selectedCourse: null,
        topic: '',
        timeSlot: '',
        description: '',
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      console.error('Error creating group:', err);
      const error = err as { response?: { data?: { error?: string; Error?: string } } };
      const errorMsg = error.response?.data?.error || error.response?.data?.Error || 'Failed to create group';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        selectedCourse: null,
        topic: '',
        timeSlot: '',
        description: '',
      });
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: '12px' }
      }}
    >
      <DialogTitle sx={{ fontWeight: 600, fontSize: '1.5rem' }}>
        Create New Study Group
      </DialogTitle>
      
      <form onSubmit={handleSubmit}>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2.5}>
            <Autocomplete
              options={courses}
              getOptionLabel={(option) => option.courseName}
              value={formData.selectedCourse}
              onChange={(_, newValue) => {
                setFormData((prev) => ({
                  ...prev,
                  selectedCourse: newValue,
                }));
                setError(null);
              }}
              loading={loadingCourses}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Course"
                  required
                  placeholder="Search and select a course..."
                  helperText="Required - Start typing to search for courses"
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {loadingCourses ? <CircularProgress size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.courseId}>
                  <Stack>
                    <span style={{ fontWeight: 500 }}>{option.courseName}</span>
                    {option.courseCode && (
                      <span style={{ fontSize: '0.875rem', color: '#666' }}>
                        {option.courseCode}
                      </span>
                    )}
                  </Stack>
                </li>
              )}
              noOptionsText="No courses found"
              isOptionEqualToValue={(option, value) => option.courseId === value.courseId}
            />

            <TextField
              name="topic"
              label="Topic"
              fullWidth
              required
              value={formData.topic}
              onChange={handleChange}
              placeholder="e.g., Exam Prep, Homework Help, Final Project"
              helperText="What will this study group focus on?"
            />

            <TextField
              name="timeSlot"
              label="Meeting Time (Optional)"
              fullWidth
              value={formData.timeSlot}
              onChange={handleChange}
              placeholder="e.g., Mondays 6-8 PM, Weekends"
              helperText="When does the group meet?"
            />

            <TextField
              name="description"
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your study group's goals, approach, or any other details..."
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={handleClose}
            disabled={loading}
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
            }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Create Group'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default CreateGroupDialog;
