export type UserRole = 'admin' | 'user' | 'artist';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  is_verified: boolean;
}

export const ROLES = {
  ADMIN: 'admin' as const,
  USER: 'user' as const,
  ARTIST: 'artist' as const,
} as const;

export const PERMISSIONS = {
  // User permissions
  VIEW_PROFILE: 'view_profile',
  EDIT_PROFILE: 'edit_profile',
  
  // Artist permissions
  CREATE_ARTWORK: 'create_artwork',
  EDIT_ARTWORK: 'edit_artwork',
  DELETE_ARTWORK: 'delete_artwork',
  MANAGE_PORTFOLIO: 'manage_portfolio',
  
  // Admin permissions
  MANAGE_USERS: 'manage_users',
  MANAGE_ARTISTS: 'manage_artists',
  MANAGE_CONTENT: 'manage_content',
  VIEW_ANALYTICS: 'view_analytics',
  MANAGE_SETTINGS: 'manage_settings',
} as const;

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  [ROLES.USER]: [
    PERMISSIONS.VIEW_PROFILE,
    PERMISSIONS.EDIT_PROFILE,
  ],
  [ROLES.ARTIST]: [
    PERMISSIONS.VIEW_PROFILE,
    PERMISSIONS.EDIT_PROFILE,
    PERMISSIONS.CREATE_ARTWORK,
    PERMISSIONS.EDIT_ARTWORK,
    PERMISSIONS.DELETE_ARTWORK,
    PERMISSIONS.MANAGE_PORTFOLIO,
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.VIEW_PROFILE,
    PERMISSIONS.EDIT_PROFILE,
    PERMISSIONS.CREATE_ARTWORK,
    PERMISSIONS.EDIT_ARTWORK,
    PERMISSIONS.DELETE_ARTWORK,
    PERMISSIONS.MANAGE_PORTFOLIO,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_ARTISTS,
    PERMISSIONS.MANAGE_CONTENT,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_SETTINGS,
  ],
};

export const hasPermission = (user: User, permission: string): boolean => {
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
};

export const hasRole = (user: User, role: UserRole): boolean => {
  return user.role === role;
};

export const hasAnyRole = (user: User, roles: UserRole[]): boolean => {
  return roles.includes(user.role);
};

export const isAdmin = (user: User): boolean => {
  return hasRole(user, ROLES.ADMIN);
};

export const isArtist = (user: User): boolean => {
  return hasRole(user, ROLES.ARTIST);
};

export const isVerified = (user: User): boolean => {
  return user.is_verified;
};
