import apiClient from '../config/api';

export interface Course {
  courseId: number;
  courseName: string;
  courseCode?: string;
  description?: string;
  department?: string;
}

export const courseService = {
  /**
   * Get all courses (requires authentication)
   */
  getAllCourses: async (): Promise<Course[]> => {
    const response = await apiClient.get<Course[]>('/courses');
    return response.data;
  },

  /**
   * Get a specific course by ID
   */
  getCourseById: async (id: number): Promise<Course> => {
    const response = await apiClient.get<Course>(`/courses/${id}`);
    return response.data;
  },

  /**
   * Create a new course
   */
  createCourse: async (courseData: {
    courseName: string;
    courseCode?: string;
    description?: string;
    department?: string;
  }): Promise<Course> => {
    const response = await apiClient.post<Course>('/courses', courseData);
    return response.data;
  },
};
