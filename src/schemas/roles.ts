export enum RoleName {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  MEMBER = 'member',
  GUEST = 'guest',
  INVITED = 'invited',
}

export const ROLE_DESCRIPTIONS: Record<RoleName, string> = {
  [RoleName.SUPER_ADMIN]: 'Super admin: tiene el control de todo',
  [RoleName.ADMIN]: 'Admin: tiene el control limitado',
  [RoleName.MEMBER]: 'Member: solo puede interactuar',
  [RoleName.GUEST]: 'Guest: solo puede ver',
  [RoleName.INVITED]: 'Invited: no puede hacer nada hasta que lo cambie un administrador',
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

// DB reflection helpers: read roles and descriptions directly from DB
// Inserted roles are returned as-is; if DB access fails, falls back to DEFAULT_ROLES.
import { prisma } from '../config/db_config';

export async function getRolesFromDb(): Promise<Array<{ name: RoleName; description: string }>> {
  try {
    const rows: Array<{ name: string; description: string }> = await prisma.roles.findMany({
      select: { name: true, description: true },
    });
    return rows.map((r) => ({ name: r.name as RoleName, description: r.description }));
  } catch (_err) {
    return DEFAULT_ROLES;
  }
}

export async function getRoleDescriptionsFromDb(): Promise<Record<RoleName, string>> {
  const list = await getRolesFromDb();
  const map = {} as Record<RoleName, string>;
  for (const r of list) map[r.name] = r.description;
  return map;
}

export async function existsRoleNameInDb(value: string): Promise<boolean> {
  const found = await prisma.roles.findFirst({ where: { name: value as any } });
  return !!found;
}