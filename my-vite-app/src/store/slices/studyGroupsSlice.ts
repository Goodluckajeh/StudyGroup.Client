import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import groupMemberService, { type GroupMembership } from '../../services/groupMemberService';
import { studyGroupService, type StudyGroup } from '../../services/studyGroupService';

interface StudyGroupsState {
  myGroups: GroupMembership[];
  allGroups: StudyGroup[];
  selectedGroup: GroupMembership | null;
  loading: boolean;
  error: string | null;
}

const initialState: StudyGroupsState = {
  myGroups: [],
  allGroups: [],
  selectedGroup: null,
  loading: false,
  error: null,
};

// Async Thunks
export const fetchMyGroups = createAsyncThunk(
  'studyGroups/fetchMyGroups',
  async (userId: number, { rejectWithValue }) => {
    try {
      const response = await groupMemberService.getUserGroups(userId);
      const groups = response.groups.map((g: any) => g.membership);
      return groups;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.Error || 'Failed to fetch groups');
    }
  }
);

export const fetchAllGroups = createAsyncThunk(
  'studyGroups/fetchAllGroups',
  async (_, { rejectWithValue }) => {
    try {
      const response = await studyGroupService.getAllGroups();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.Error || 'Failed to fetch all groups');
    }
  }
);

export const createGroup = createAsyncThunk(
  'studyGroups/createGroup',
  async (groupData: any, { rejectWithValue }) => {
    try {
      const response = await studyGroupService.createGroup(groupData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.Error || 'Failed to create group');
    }
  }
);

export const leaveGroup = createAsyncThunk(
  'studyGroups/leaveGroup',
  async ({ groupMemberId, userId }: { groupMemberId: number; userId: number }, { dispatch, rejectWithValue }) => {
    try {
      await groupMemberService.leaveGroup(groupMemberId);
      // Refetch groups after leaving
      await dispatch(fetchMyGroups(userId));
      return groupMemberId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.Error || 'Failed to leave group');
    }
  }
);

// Slice
const studyGroupsSlice = createSlice({
  name: 'studyGroups',
  initialState,
  reducers: {
    setSelectedGroup: (state, action: PayloadAction<GroupMembership | null>) => {
      state.selectedGroup = action.payload;
    },
    clearSelectedGroup: (state) => {
      state.selectedGroup = null;
    },
    updateGroupMemberCount: (state, action: PayloadAction<{ groupId: number; count: number }>) => {
      const group = state.myGroups.find(g => g.groupId === action.payload.groupId);
      if (group && group.currentMemberCount !== undefined) {
        group.currentMemberCount = action.payload.count;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch My Groups
      .addCase(fetchMyGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.myGroups = action.payload;
        // Auto-select first group if none selected
        if (!state.selectedGroup && action.payload.length > 0) {
          state.selectedGroup = action.payload[0];
        }
      })
      .addCase(fetchMyGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch All Groups
      .addCase(fetchAllGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.allGroups = action.payload;
      })
      .addCase(fetchAllGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Group
      .addCase(createGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGroup.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Leave Group
      .addCase(leaveGroup.fulfilled, (state) => {
        state.selectedGroup = null;
      });
  },
});

export const { setSelectedGroup, clearSelectedGroup, updateGroupMemberCount } = studyGroupsSlice.actions;
export default studyGroupsSlice.reducer;
