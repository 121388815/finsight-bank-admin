import type { User, RoleCode, PermissionCode } from "../types/user";
import { ROLE_LABELS, ROLE_PERMISSION_MAP } from "../types/user";
import { mockDb } from "./mockDb";
import { mockRequest } from "./request";

export interface RoleSummary {
  code: RoleCode;
  name: string;
  userCount: number;
  permissions: PermissionCode[];
}

//系统用户列表接口，系统管理页面不直接访问mockDb
export function getSystemUsers() {
  return mockRequest<User[]>(mockDb.users);
}

//角色摘要接口，聚合角色名称、用户数和权限码
export function getRoleSummaries() {
  const roles = (Object.keys(ROLE_PERMISSION_MAP) as RoleCode[]).map((code) => ({
    code,
    name: ROLE_LABELS[code],
    userCount: mockDb.users.filter((user) => user.role === code).length,
    permissions: ROLE_PERMISSION_MAP[code],
  }));

  return mockRequest<RoleSummary[]>(roles);
}
