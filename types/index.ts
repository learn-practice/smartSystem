export type Role = 'admin' | 'manager' | 'user';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';
export type JobStatus = 'open' | 'in_progress' | 'closed';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  created_at?: string;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  manager_id?: string;
  manager_name?: string;
  members: { id: string; name: string }[];
  created_at?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  deadline?: string;
  created_by?: string;
  created_by_name?: string;
  teams: { id: string; name: string }[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  deadline?: string;
  project_id?: string;
  project_name?: string;
  assigned_to?: string;
  assigned_to_name?: string;
  created_at?: string;
}

export interface Job {
  id: string;
  title: string;
  description?: string;
  status: JobStatus;
  assigned_to?: string;
  assigned_to_name?: string;
  team_id?: string;
  team_name?: string;
  deadline?: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total?: number;
  page: number;
  limit: number;
}
