//系统操作日志数据模型
import type { RoleCode } from "./user";

export type OperationModule =
  | "auth" //认证授权（如登录、登出、修改密码）
  | "customer" //客户管理（如新增客户、修改客户资料）
  | "loan" //贷款业务（如提交申请、审批放款）
  | "risk" //风控管理（如调整风控规则、查看征信报告）
  | "system" //系统设置（如配置参数、管理字典）
  | "log"; //日志管理本身（如查询或导出日志）

//操作结果状态
export type OperationResult = "success" | "failed";

//操作日志实体
export interface OperationLog {
  id: number;
  operatorId: number; //操作人的ID
  operatorName: string; //操作人的姓名
  role: RoleCode; //操作人身份
  module: OperationModule; //操作业务板块
  action: string; //具体的动作描述
  targetId?: number; //被操作对象ID
  targetName?: string; //被操作对象姓名
  result: OperationResult; //记录失败还是成功
  ip: string; //操作人发起请求时的IP地址
  createdAt: string; //操作发生具体时间
  remark?: string; //备注信息
}
