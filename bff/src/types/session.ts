export interface SessionUser {
  email: string;
  password: string;
  displayName: string;
  role: 'user' | 'admin';
}

// Set after a correct password but before a 2FA challenge is satisfied.
// The session is NOT yet authenticated while this is present.
export interface Pending2FA {
  email: string;
  password: string;
  displayName: string;
  role: 'user' | 'admin';
  since: number;
}
