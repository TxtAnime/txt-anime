import axios from 'axios';
import type { AxiosInstance, AxiosResponse } from 'axios';
import type {
  CreateTaskRequest,
  CreateTaskResponse,
  GetTaskResponse,
  GetTasksResponse,
  AnimeArtifacts,
} from '../types';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

class ApiClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 30000, // 30 seconds timeout
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => {
        console.log(`API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('API Response Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url);
    return response.data;
  }

  async post<T, D = any>(url: string, data?: D): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data);
    return response.data;
  }
}

// Create API client instance
const apiClient = new ApiClient(API_BASE_URL);

// Task service implementation
export class TaskService {
  /**
   * Create a new conversion task
   */
  static async createTask(novel: string): Promise<CreateTaskResponse> {
    const request: CreateTaskRequest = { novel };
    return apiClient.post<CreateTaskResponse>('/v1/tasks/', request);
  }

  /**
   * Get task details by ID
   */
  static async getTask(id: string): Promise<GetTaskResponse> {
    return apiClient.get<GetTaskResponse>(`/v1/tasks/${id}`);
  }

  /**
   * Get all tasks
   */
  static async getTasks(): Promise<GetTasksResponse> {
    return apiClient.get<GetTasksResponse>('/v1/tasks/');
  }

  /**
   * Get task artifacts (anime scenes)
   */
  static async getTaskArtifacts(id: string): Promise<AnimeArtifacts> {
    return apiClient.get<AnimeArtifacts>(`/v1/tasks/${id}/artifacts`);
  }
}

// Error handling utilities
export class ApiError extends Error {
  public status?: number;
  public data?: any;

  constructor(message: string, status?: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

export const handleApiError = (error: any): ApiError => {
  if (error.response) {
    // Server responded with error status
    return new ApiError(
      error.response.data?.message || 'Server error occurred',
      error.response.status,
      error.response.data
    );
  } else if (error.request) {
    // Network error
    return new ApiError('Network error - please check your connection');
  } else {
    // Other error
    return new ApiError(error.message || 'An unexpected error occurred');
  }
};