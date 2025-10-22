import { SetMetadata } from '@nestjs/common';

export enum Permission {
  READ = 'read',
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
}

export type Role = 'Admin' | 'FruitGuy' | 'VegetableGuy' | string;
export type ProductClassName = 'Fruits' | 'Vegetables' | string;

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

export const PERMISSIONS_MAPPING: Record<Role, Partial<Record<ProductClassName, Permission[]>>> = {
  Admin: {
    Fruits: [
      Permission.READ,
      Permission.CREATE,
      Permission.UPDATE,
      Permission.DELETE,
    ],
    Vegetables: [
      Permission.READ,
      Permission.CREATE,
      Permission.UPDATE,
      Permission.DELETE,
    ],
  },
  FruitGuy: {
    Fruits: [
      Permission.READ,
      Permission.CREATE,
      Permission.UPDATE,
      Permission.DELETE,
    ],
    Vegetables: [
      Permission.READ,
    ],
  },
  VegetableGuy: {
    Vegetables: [
      Permission.READ,
      Permission.CREATE,
      Permission.UPDATE,
      Permission.DELETE,
    ],
    Fruits: [
      Permission.READ,
    ],
  },
};
