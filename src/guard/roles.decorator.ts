import { SetMetadata } from '@nestjs/common';
import { Permission, PERMISSIONS_MAPPING, Role as RoleType, ProductClassName } from './permissions.enum';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

export const ACTION_KEY = 'action';
export type ActionType = Permission;
export const Action = (action: ActionType) => SetMetadata(ACTION_KEY, action);

export function hasPermission(role: RoleType | undefined, action: Permission, productClass?: ProductClassName): boolean {
  if (!role) return false;
  if (role === 'Admin') return true;
  if (!productClass) {
    return action === Permission.READ;
  }
  const rolePerms = PERMISSIONS_MAPPING[role];
  if (!rolePerms) return false;
  const allowed = rolePerms[productClass];
  if (!allowed) return false;
  return allowed.includes(action);
}
