import type { LoginPayload, LoginResult, User } from "../types/user";
import { mockDb, nowText } from "./mockDb";
import { mockError, mockRequest } from "./request";

//Mock登录密码，所有测试账号先统一使用这个密码，后续接真实后端时删除
const MOCK_PASSWORD = "123456";

//登录接口：校验账号密码，成功后返回 token 和用户画像
export function login(payload: LoginPayload) {
  //根据账号查找用户，模拟后端根据 username 查询账号表
  const user = mockDb.users.find((item) => item.username === payload.username);

  //账号不存在或密码错误时返回 401，store 层会拆包后抛出 ApiError
  if (!user || payload.password !== MOCK_PASSWORD) {
    return mockError<LoginResult>(401, "账号或密码错误");
  }

  //账号被停用属于有身份但无访问资格，返回 403 更贴近真实权限语义
  if (!user.enabled) {
    return mockError<LoginResult>(403, "账号已停用，请联系管理员");
  }

  //记录最后登录时间，用于系统管理或顶部用户信息展示
  user.lastLoginAt = nowText();

  //这里生成一个可解析的 mock token，getCurrentUser 会从 token 中还原用户ID
  return mockRequest<LoginResult>({
    token: `mock-token-${user.id}-${user.username}`,
    user,
  });
}

//获取当前用户接口：用于刷新页面后根据本地 token 恢复用户信息
export function getCurrentUser(token?: string) {
  //从 mock token 中取出用户ID；真实项目中通常由后端解析 JWT
  const matched = token?.match(/^mock-token-(\d+)-/);
  const userId = matched ? Number(matched[1]) : undefined;
  const user = mockDb.users.find((item) => item.id === userId);

  //token 缺失、格式错误或用户不存在，都视为登录态失效
  if (!user) {
    return mockError<User>(401, "登录状态已失效");
  }

  return mockRequest<User>(user);
}

//退出登录接口：Mock阶段不需要服务端销毁会话，保留函数形状方便替换真实接口
export function logout() {
  return mockRequest<null>(null);
}
