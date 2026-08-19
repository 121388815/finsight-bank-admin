import type { PageParams, PageResult } from "../types/api";
import type { OperationLog, OperationModule } from "../types/log";
import { paginateMockData } from "../utils/mock";
import { createOperationLog, mockDb } from "./mockDb";
import { mockRequest } from "./request";

//操作日志列表查询参数：分页参数 + 审计日志筛选条件
export interface OperationLogListParams extends PageParams {
  //通用搜索，匹配操作人、动作、目标对象和备注
  keyword?: string;
  //按业务模块筛选，例如 loan、risk、customer
  module?: OperationModule;
  //按操作结果筛选，例如 success 或 failed
  result?: OperationLog["result"];
}

//新增操作日志入参，id、createdAt、ip 可以由Mock后端补齐
export type CreateOperationLogPayload = Omit<
  OperationLog,
  "id" | "createdAt" | "ip"
> & {
  //允许调用方指定创建时间，方便构造历史日志
  createdAt?: string;
  //允许调用方指定IP，不传时使用默认内网IP
  ip?: string;
};

//操作日志分页查询接口：用于操作日志页面
export function getOperationLogs(params: OperationLogListParams) {
  const { page, pageSize, keyword, module, result } = params;
  //统一小写后模糊匹配，避免大小写影响搜索
  const normalizedKeyword = keyword?.trim().toLowerCase();
  const filtered = mockDb.operationLogs.filter((log) => {
    //keyword 支持操作人、动作、操作对象、备注四类文本
    const matchKeyword =
      !normalizedKeyword ||
      [
        log.operatorName,
        log.action,
        log.targetName ?? "",
        log.remark ?? "",
      ].some((value) => value.toLowerCase().includes(normalizedKeyword));
    //按模块筛选，便于审计人员只看贷款或系统权限相关操作
    const matchModule = !module || log.module === module;
    //按成功/失败筛选，失败操作通常是审计关注重点
    const matchResult = !result || log.result === result;

    return matchKeyword && matchModule && matchResult;
  });

  //返回分页结果，后续直接接 Ant Design Table
  return mockRequest<PageResult<OperationLog>>(
    paginateMockData(filtered, page, pageSize),
  );
}

//手动追加操作日志接口：给特殊业务动作或系统管理模块复用
export function addOperationLog(payload: CreateOperationLogPayload) {
  return mockRequest<OperationLog>(createOperationLog(payload));
}
