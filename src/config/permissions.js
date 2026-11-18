// Permissions ("resource:action") and the roles that hold them. The template has one
// page; a customer app adds its own permissions, roles and routes here.

const ROLE_TEMPLATES = {
  user: ['conversations:read'],
  admin: ['*'],
  super_admin: ['*'],
};

export const ROUTE_PERMISSIONS = {
  '/conversations': 'conversations:read',
};

export function getPermissionsForRole(role) {
  return ROLE_TEMPLATES[role] || [];
}
