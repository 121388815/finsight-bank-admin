import axios, { type AxiosRequestConfig } from "axios";
import type { ApiResponse, ApiStatusCode } from "../types/api";
import { mockDelay } from "../utils/mock";

//真实后端请求实例：Mock阶段业务API暂不调用，接入后端时可直接复用
export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

//请求拦截器：从Zustand持久化数据中读取token并注入Authorization请求头
httpClient.interceptors.request.use((config) => {
  const token = readPersistedToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

//响应拦截器：把HTTP异常统一转换成项目自己的ApiError
httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = normalizeStatusCode(error.response?.status);
      const responseData = error.response?.data as { message?: string } | undefined;
      return Promise.reject(new ApiError(status, responseData?.message ?? error.message));
    }
    return Promise.reject(error);
  },
);

//Mock请求配置项，用来模拟真实接口中的状态码、提示文案和网络耗时
export interface MockRequestOptions {
  //业务状态码，0表示成功，其他值表示失败
  code?: ApiStatusCode;
  //接口返回给前端展示或调试用的提示文案
  message?: string;
  //模拟网络请求耗时，单位毫秒
  timeout?: number;
}

//统一接口错误类，后续页面可以通过 code 区分 401、403、404 等业务异常
export class ApiError extends Error {
  //后端约定的业务状态码
  code: ApiStatusCode;

  constructor(code: ApiStatusCode, message: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
}

//真实HTTP泛型请求函数：调用后直接得到业务data，页面无需重复判断code
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const response = await httpClient.request<ApiResponse<T>>(config);
  return unwrapResponse(response.data);
}

//创建成功响应，保持所有API函数返回结构一致
export function createSuccessResponse<T>(
  //真正的业务数据，例如用户信息、客户列表、贷款详情
  data: T,
  //成功提示，默认保持和真实接口常见返回一致
  message = "success",
): ApiResponse<T> {
  return {
    code: 0,
    message,
    data,
  };
}

//创建失败响应，失败时 data 没有业务意义，页面主要读取 code 和 message
export function createErrorResponse<T>(
  //失败状态码，不允许传0，避免把失败响应误写成成功响应
  code: Exclude<ApiStatusCode, 0>,
  //失败原因，例如“账号或密码错误”“客户不存在”
  message: string,
): ApiResponse<T> {
  return {
    code,
    message,
    data: null as T,
  };
}

//通用Mock请求函数，所有业务API都通过它模拟真实HTTP返回
export function mockRequest<T>(
  //接口成功时返回的业务数据
  data: T,
  //可选配置：状态码、文案、延迟
  { code = 0, message = "success", timeout = 300 }: MockRequestOptions = {},
): Promise<ApiResponse<T>> {
  //这里先构造统一响应，再交给 mockDelay 模拟异步网络请求
  const response =
    code === 0
      ? createSuccessResponse(data, message)
      : createErrorResponse<T>(code, message);

  return mockDelay(response, { timeout });
}

//通用Mock错误响应，避免每个业务API手写 null as Xxx 这种不安全断言
export function mockError<T>(
  //失败状态码，只能是非0状态
  code: Exclude<ApiStatusCode, 0>,
  //失败文案，页面可直接用于 message.error 或错误空状态
  message: string,
  //错误请求也保留延迟，方便页面验证 loading 状态
  timeout = 300,
): Promise<ApiResponse<T>> {
  return mockDelay(createErrorResponse<T>(code, message), { timeout });
}

//拆包函数：页面或store只关心成功数据时使用；失败时统一抛 ApiError
export function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (response.code !== 0) {
    throw new ApiError(response.code, response.message);
  }

  return response.data;
}

//读取Zustand persist写入localStorage的会话数据，避免Axios和userStore循环依赖
function readPersistedToken(): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem("finsight-bank-user");
    if (!raw) return null;
    const persisted = JSON.parse(raw) as { state?: { token?: string | null } };
    return persisted.state?.token ?? null;
  } catch {
    return null;
  }
}

//把任意HTTP状态码收敛到项目约定的ApiStatusCode集合
function normalizeStatusCode(status?: number): ApiStatusCode {
  if (status === 400 || status === 401 || status === 403 || status === 404) return status;
  return 500;
}
