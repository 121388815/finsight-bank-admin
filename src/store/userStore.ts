import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  getCurrentUser,
  login as loginApi,
  logout as logoutApi,
} from "../api/auth";
import { unwrapResponse } from "../api/request";
import type {
  LoginPayload,
  LoginResult,
  PermissionCode,
  User,
} from "../types/user";

//用户会话状态，只放和登录身份直接相关的数据
interface UserSession {
  //登录令牌，后续真实Axios请求会从这里读取并放入请求头
  token: string | null;
  //当前登录用户画像，包含昵称、角色、部门等展示信息
  user: User | null;
  //当前用户拥有的权限码，路由守卫、菜单过滤、按钮权限都会读取
  permissions: PermissionCode[];
}

//用户Store完整状态：会话数据 + 异步状态 + 登录相关动作
interface UserState extends UserSession {
  //登录、刷新用户、退出时的请求状态，可用于按钮loading或全局loading
  loading: boolean;
  //是否完成过登录态初始化，路由守卫可用它避免刷新页面时误跳转
  initialized: boolean;
  //登录动作：调用登录API，成功后写入token、用户和权限
  login: (payload: LoginPayload) => Promise<LoginResult>;
  //退出动作：调用退出API，并清空本地登录态
  logout: () => Promise<void>;
  //刷新当前用户：页面刷新后根据持久化token重新拉取用户信息
  refreshCurrentUser: () => Promise<User | null>;
  //手动设置会话，方便后续接入第三方登录或测试场景
  setSession: (session: LoginResult) => void;
  //清空会话，401、退出登录、token失效时都会用到
  clearSession: () => void;
  //权限判断：支持单个权限码或多个权限码全部满足
  hasPermission: (code: PermissionCode | PermissionCode[]) => boolean;
}

//空会话模板，清理登录态时统一使用，避免字段遗漏
const emptySession: UserSession = {
  token: null,
  user: null,
  permissions: [],
};

//用户Store：负责登录态、权限码和刷新恢复，是整个RBAC链路的核心
export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      ...emptySession,
      loading: false,
      initialized: false,

      async login(payload) {
        //进入登录请求状态，登录按钮可以读取 loading 防止重复提交
        set({ loading: true });

        try {
          //调用API并拆包；接口失败时 unwrapResponse 会抛 ApiError
          const session = unwrapResponse(await loginApi(payload));

          //登录成功后把会话信息写入Store，同时由persist同步到localStorage
          set({
            token: session.token,
            user: session.user,
            permissions: session.user.permissions,
            loading: false,
            initialized: true,
          });

          return session;
        } catch (error) {
          //失败也要结束loading，并标记初始化完成，避免页面一直等待
          set({ loading: false, initialized: true });
          throw error;
        }
      },

      async logout() {
        //退出时也保留loading，顶部退出按钮或页面可展示处理中状态
        set({ loading: true });

        try {
          //Mock阶段服务端无状态，但保留调用形状，方便后续替换真实接口
          await logoutApi();
        } finally {
          //无论接口成功失败，前端都清空会话，避免残留token
          set({
            ...emptySession,
            loading: false,
            initialized: true,
          });
        }
      },

      async refreshCurrentUser() {
        const { token } = get();

        //没有token说明没有登录，直接清空并结束初始化
        if (!token) {
          set({ ...emptySession, initialized: true });
          return null;
        }

        //有token时重新请求用户信息，确保权限和用户状态是最新的
        set({ loading: true });

        try {
          const user = unwrapResponse(await getCurrentUser(token));

          //刷新成功后只更新用户和权限，token继续沿用本地token
          set({
            user,
            permissions: user.permissions,
            loading: false,
            initialized: true,
          });

          return user;
        } catch (error) {
          //token失效、用户不存在等情况都清空登录态
          set({
            ...emptySession,
            loading: false,
            initialized: true,
          });
          throw error;
        }
      },

      setSession(session) {
        //统一写入会话信息，避免外部直接分散修改 token/user/permissions
        set({
          token: session.token,
          user: session.user,
          permissions: session.user.permissions,
          initialized: true,
        });
      },

      clearSession() {
        //统一清空会话，路由守卫或API 401处理都可以复用
        set({
          ...emptySession,
          loading: false,
          initialized: true,
        });
      },

      hasPermission(code) {
        const { permissions } = get();
        //统一转成数组，便于复用 every 做“全部权限满足”判断
        const codes = Array.isArray(code) ? code : [code];

        return codes.every((item) => permissions.includes(item));
      },
    }),
    {
      //localStorage中的key，便于调试和避免与其他项目冲突
      name: "finsight-bank-user",
      //明确使用localStorage，刷新页面后可恢复登录态
      storage: createJSONStorage(() => localStorage),
      //只持久化必要会话字段，不持久化loading、initialized等运行时状态
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        permissions: state.permissions,
      }),
      //从localStorage恢复后，立即用token刷新用户信息，避免权限过期
      onRehydrateStorage: () => (state) => {
        state?.refreshCurrentUser().catch(() => {
          //刷新失败说明本地token不可用，清空会话
          state.clearSession();
        });
      },
    },
  ),
);

//非React函数环境读取token的工具函数，例如后续Axios请求拦截器会用到
export function getAuthToken(): string | null {
  return useUserStore.getState().token;
}

//非React函数环境做权限判断的工具函数，例如路由配置或工具函数可直接调用
export function hasPermission(code: PermissionCode | PermissionCode[]): boolean {
  return useUserStore.getState().hasPermission(code);
}
