export interface SessionUser {
  email: string;
  password: string;
  displayName: string;
  role: 'user' | 'admin';
}
