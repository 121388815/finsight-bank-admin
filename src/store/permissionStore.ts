import { create } from "zustand";
import type { PermissionCode } from "../types/user";

//后台侧边栏菜单项模型，同时也是动态菜单和路由权限的基础数据
export interface AppMenuItem {
  //菜单唯一标识，Ant Design Menu 的 key 会使用它
  key: string;
  //菜单展示名称
  label: string;
  //点击菜单后跳转的路由路径
  path: string;
  //访问该菜单需要的权限码，不填表示只要子菜单可见即可展示
  permission?: PermissionCode;
  //子菜单，用于系统管理这类二级菜单
  children?: AppMenuItem[];
}

//基础菜单配置：这里列出系统全部菜单，真正展示时会按用户权限过滤
export const baseMenus: AppMenuItem[] = [
  {
    key: "dashboard",
    label: "数据看板",
    path: "/dashboard",
    permission: "dashboard:view",
  },
  {
    key: "customers",
    label: "客户管理",
    path: "/customers",
    permission: "customer:view",
  },
  {
    key: "loans",
    label: "贷款申请",
    path: "/loans",
    permission: "loan:view",
  },
  {
    key: "risk-review",
    label: "风控审批",
    path: "/risk-review",
    permission: "risk:view",
  },
  {
    key: "operation-logs",
    label: "操作日志",
    path: "/operation-logs",
    permission: "log:view",
  },
  {
    key: "system",
    label: "系统管理",
    path: "/system",
    children: [
      {
        key: "system-users",
        label: "用户管理",
        path: "/system/users",
        permission: "system:user",
      },
      {
        key: "system-roles",
        label: "角色管理",
        path: "/system/roles",
        permission: "system:role",
      },
    ],
  },
];

//权限Store状态：负责保存菜单配置，并提供按权限过滤菜单的能力
interface PermissionState {
  //当前系统菜单配置，默认等于 baseMenus
  menus: AppMenuItem[];
  //设置菜单配置，后续如果从后端拉菜单可以写入这里
  setMenus: (menus: AppMenuItem[]) => void;
  //恢复默认菜单配置
  resetMenus: () => void;
  //根据权限码获取当前用户可访问的菜单树
  getAccessibleMenus: (permissions: PermissionCode[]) => AppMenuItem[];
}

//权限Store：集中管理菜单数据和菜单权限过滤逻辑
export const usePermissionStore = create<PermissionState>()((set, get) => ({
  menus: baseMenus,

  setMenus(menus) {
    //后续支持后端动态菜单时，可以把后端返回的菜单写入Store
    set({ menus });
  },

  resetMenus() {
    //恢复项目内置菜单
    set({ menus: baseMenus });
  },

  getAccessibleMenus(permissions) {
    //根据当前Store里的菜单配置和用户权限码生成可见菜单
    return filterMenusByPermissions(get().menus, permissions);
  },
}));

//递归过滤菜单树：没有权限的菜单会被移除，但有可见子菜单的父菜单会保留
export function filterMenusByPermissions(
  //完整菜单树
  menus: AppMenuItem[],
  //当前用户拥有的权限码
  permissions: PermissionCode[],
): AppMenuItem[] {
  return menus.reduce<AppMenuItem[]>((result, menu) => {
    //先递归处理子菜单，避免父菜单无权限但子菜单有权限时被误删
    const children = menu.children
      ? filterMenusByPermissions(menu.children, permissions)
      : undefined;
    //没有配置permission的菜单视为容器菜单，例如“系统管理”
    const hasOwnPermission =
      !menu.permission || permissions.includes(menu.permission);

    //自己无权限且没有任何可见子菜单，则整个菜单不可见
    if (!hasOwnPermission && (!children || children.length === 0)) {
      return result;
    }

    //保留可见菜单；只有存在子菜单时才写 children，避免空数组影响渲染判断
    result.push({
      ...menu,
      ...(children ? { children } : {}),
    });

    return result;
  }, []);
}

//判断是否拥有任意一个权限，适合“多个权限满足其一即可显示”的场景
export function hasAnyPermission(
  //当前用户权限码集合
  permissions: PermissionCode[],
  //待判断的权限码集合
  codes: PermissionCode[],
): boolean {
  return codes.some((code) => permissions.includes(code));
}

//判断是否拥有全部权限，适合高风险按钮或组合操作
export function hasEveryPermission(
  //当前用户权限码集合
  permissions: PermissionCode[],
  //待判断的权限码集合
  codes: PermissionCode[],
): boolean {
  return codes.every((code) => permissions.includes(code));
}
