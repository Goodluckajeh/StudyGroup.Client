import apiClient from '../config/api';
import type { JoinGroupResponse } from '../types/common';

export interface StudyGroup {
  groupId: number;
  courseName: string;
  courseId?: number;
  topic?: string;
  timeSlot?: string;
  description?: string;
  creatorId?: number;
  creatorName?: string;
  creatorFirstName?: string;
  creatorLastName?: string;
  createdAt?: string;
  isActive?: boolean;
  // Deprecated fields (for backward compatibility)
  groupName?: string;
  maxMembers?: number;
  currentMemberCount?: number;
  meetingSchedule?: string;
}

export interface StudyGroupResponse {
  message: string;
  totalGroups: number;
  studyGroups: StudyGroup[];
}

export const studyGroupService = {
  /**
   * Get all study groups (public endpoint - no auth required)
   */
  getAllGroups: async (): Promise<StudyGroup[]> => {
    const response = await apiClient.get<StudyGroupResponse>('/studygroups');
    return response.data.studyGroups;
  },

  /**
   * Get a specific study group by ID
   */
  getGroupById: async (id: number): Promise<StudyGroup> => {
    const response = await apiClient.get<{ studyGroup: StudyGroup }>(`/studygroups/${id}`);
    return response.data.studyGroup;
  },

  /**
   * Get study groups by course name
   */
  getGroupsByCourse: async (courseName: string): Promise<StudyGroup[]> => {
    const response = await apiClient.get<{ studyGroups: StudyGroup[] }>(`/studygroups/by-course/${courseName}`);
    return response.data.studyGroups;
  },

  /**
   * Join a study group (requires authentication)
   * Creates a group membership with StatusId=2 (Active)
   */
  joinGroup: async (groupId: number, userId: number): Promise<JoinGroupResponse> => {
    const response = await apiClient.post('/groupmembers', {
      groupId,
      userId,
      statusId: 2, // 2 = Active member
    });
    return response.data;
  },

  /**
   * Leave a study group (requires authentication)
   */
  leaveGroup: async (membershipId: number): Promise<void> => {
    await apiClient.delete(`/groupmembers/${membershipId}`);
  },

  /**
   * Create a new study group (requires authentication)
   */
  createGroup: async (groupData: {
    courseName: string;
    creatorId: number;
    topic?: string;
    timeSlot?: string;
    description?: string;
  }): Promise<StudyGroup> => {
    const response = await apiClient.post<StudyGroup>('/studygroups', groupData);
    return response.data;
  },
};
