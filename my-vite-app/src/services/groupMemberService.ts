import apiClient from '../config/api';

export interface GroupMembership {
  groupMemberId: number;
  groupId: number;
  userId: number;
  statusId: number;
  joinedAt?: string;
  courseName: string;
  topic?: string;
  timeSlot?: string;
  description?: string;
  currentMemberCount?: number;
  creatorId?: number;
  creatorName?: string;
}

export interface GroupWithRole {
  membership: GroupMembership;
  yourRole: string;
  rights: string[];
  privacyAccess: string;
}

export interface UserGroupsResponse {
  message: string;
  userId: number;
  totalGroups: number;
  groups: GroupWithRole[];
  privacyNote: string;
}

const groupMemberService = {
  // Get all groups that a user is a member of
  getUserGroups: async (userId: number): Promise<UserGroupsResponse> => {
    const response = await apiClient.get(`/groupmembers/users/${userId}/groups`);
    return response.data;
  },

  // Leave a group
  leaveGroup: async (groupMemberId: number): Promise<void> => {
    await apiClient.delete(`/groupmembers/${groupMemberId}`);
  },
};

export default groupMemberService;
