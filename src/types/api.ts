//接口数据类型
//统一接口响应、分页参数、分页结果、排序类型

export type ApiStatusCode = 0 | 400 | 401 | 403 | 404 | 500;

//定义系统允许的状态码集合
export interface ApiResponse<T> {
  code: ApiStatusCode; //告知前端请求的状态
  message: string; //提示信息
  data: T; //T占位，用于灵活获取用户信息
}

//前端发给后端的基础分页参数
export interface PageParams {
  page: number; //当前页码
  pageSize: number; //每页条数
}

//后端返回给前端的分页结果集
export interface PageResult<T> {
  list: T[]; //当前页的实际数据列表
  total: number; //总共有多少条数据（前端用于计算总页数）
  page: number; //回传当前的分页状态
  pageSize: number; //回传当前的分页状态
}

//继承PageParams，增加keyword字段
export interface ListQuery extends PageParams {
  keyword?: string; //用于分页支持关键词搜索过滤
}

//定义排序规则，'ascend'升序/'descend'降序
export type SortOrder = "ascend" | "descend";

//回传后端
export interface SortParams {
  field?: string; //告诉后端应该按照哪个字段
  order?: SortOrder; //什么顺序
}
