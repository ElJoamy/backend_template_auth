export enum RoleName {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MEMBER = 'member',
  GUEST = 'guest',
}

export const ROLE_DESCRIPTIONS: Record<RoleName, string> = {
  [RoleName.SUPER_ADMIN]: 'Super admin: tiene el control de todo',
  [RoleName.ADMIN]: 'Admin: tiene el control limitado',
  [RoleName.MEMBER]: 'Member: solo puede interactuar',
  [RoleName.GUEST]: 'Guest: solo puede ver',
};

export const DEFAULT_ROLES: Array<{ name: RoleName; description: string }> = (
  Object.entries(ROLE_DESCRIPTIONS).map(([name, description]) => ({
    name: name as RoleName,
    description,
  }))
);

export function isValidRoleName(value: string): value is RoleName {
  return Object.values(RoleName).includes(value as RoleName);
}