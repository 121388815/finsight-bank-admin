//用户认证与权限控制RBAC核心模块

//角色与权限码定义
export type RoleCode =
  | "admin" //系统管理员
  | "risk_officer" //风控专员
  | "operator" //运营人员
  | "auditor" //审计人员
  | "viewer"; //只读人员

//权限码
export type PermissionCode =
  | "dashboard:view"
  | "customer:view"
  | "customer:create"
  | "customer:edit"
  | "loan:view"
  | "loan:create"
  | "loan:approve"
  | "loan:reject"
  | "risk:view"
  | "risk:generate"
  | "log:view"
  | "log:export"
  | "system:user"
  | "system:role";

//用户实体模型
export interface User {
  id: number; //用户的唯一数字标识
  username: string; //登录账号
  nickname: string; //对外展示的昵称
  role: RoleCode; //该用户的角色
  permissions: PermissionCode[]; //该用户实际拥有的所有权限点的数组
  department: string; //用户所属的部门
  enabled: boolean; //账号是否处于启用状态
  lastLoginAt?: string; //上次登录的时间
}

//登录交互接口
export interface LoginPayload {
  username: string;
  password: string;
}

//登录成功后，后端返回给前端的数据结构
export interface LoginResult {
  token: string; //身份令牌JWT
  user: User; //用户画像
}

//权限与角色中文映射
export const ROLE_LABELS: Record<RoleCode, string> = {
  admin: "系统管理员",
  risk_officer: "风控专员",
  operator: "运营人员",
  auditor: "审计人员",
  viewer: "只读用户",
};

//权限代码中文映射
export const PERMISSION_LABELS: Record<PermissionCode, string> = {
  "dashboard:view": "查看数据看板",
  "customer:view": "查看客户",
  "customer:create": "新增客户",
  "customer:edit": "编辑客户",
  "loan:view": "查看贷款申请",
  "loan:create": "新增贷款申请",
  "loan:approve": "审批通过",
  "loan:reject": "审批拒绝",
  "risk:view": "查看风控报告",
  "risk:generate": "生成风险摘要",
  "log:view": "查看操作日志",
  "log:export": "导出操作日志",
  "system:user": "用户管理",
  "system:role": "角色管理",
};

//角色权限映射表
export const ROLE_PERMISSION_MAP: Record<RoleCode, PermissionCode[]> = {
  admin: [
    "dashboard:view",
    "customer:view",
    "customer:create",
    "customer:edit",
    "loan:view",
    "loan:create",
    "loan:approve",
    "loan:reject",
    "risk:view",
    "risk:generate",
    "log:view",
    "log:export",
    "system:user",
    "system:role",
  ],
  risk_officer: [
    "dashboard:view",
    "customer:view",
    "loan:view",
    "loan:approve",
    "loan:reject",
    "risk:view",
    "risk:generate",
    "log:view",
  ],
  operator: [
    "dashboard:view",
    "customer:view",
    "customer:create",
    "customer:edit",
    "loan:view",
    "loan:create",
  ],
  auditor: [
    "dashboard:view",
    "customer:view",
    "loan:view",
    "risk:view",
    "log:view",
  ],
  viewer: ["dashboard:view", "customer:view", "loan:view"],
};
