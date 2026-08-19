import type { Customer } from "../types/customer";
import type { LoanApplication } from "../types/loan";
import type { OperationLog } from "../types/log";
import type { RiskLevel, RiskReport } from "../types/risk";
import type { RoleCode } from "../types/user";
import {
  mockCustomers,
  mockLoanApplications,
  mockOperationLogs,
  mockRiskReports,
  mockUsers,
} from "../utils/mock";

//本地可变Mock数据库，API层所有增删改查都读写这里，避免直接修改原始mock常量
export const mockDb = {
  //用户表：登录、权限恢复、操作人角色查询都会用到
  users: mockUsers.map((item) => ({ ...item })),
  //客户表：客户列表、客户详情、贷款申请关联客户都会用到
  customers: mockCustomers.map((item) => ({ ...item })),
  //贷款申请表：贷款列表、审批流转、Dashboard统计都会用到
  loans: mockLoanApplications.map((item) => ({ ...item })),
  //风险报告表：按申请单ID关联，模拟AI风险摘要的存取结果
  riskReports: mockRiskReports.map((item) => ({
    ...item,
    //evidence是嵌套数组，需要额外拷贝，避免后续修改污染原始mock数据
    evidence: item.evidence.map((evidence) => ({ ...evidence })),
  })),
  //操作日志表：审批、新增客户、生成摘要等关键动作都会写入这里
  operationLogs: mockOperationLogs.map((item) => ({ ...item })),
};

//客户ID自增种子，确保新增客户不会和现有mock数据ID冲突
let customerIdSeed = Math.max(...mockDb.customers.map((item) => item.id));
//贷款申请ID自增种子，模拟后端数据库主键生成
let loanIdSeed = Math.max(...mockDb.loans.map((item) => item.id));
//操作日志ID自增种子，保证日志按唯一ID展示和追踪
let logIdSeed = Math.max(...mockDb.operationLogs.map((item) => item.id));

//生成下一个客户ID
export function nextCustomerId(): number {
  customerIdSeed += 1;
  return customerIdSeed;
}

//生成下一个贷款申请ID
export function nextLoanId(): number {
  loanIdSeed += 1;
  return loanIdSeed;
}

//生成下一个操作日志ID
export function nextLogId(): number {
  logIdSeed += 1;
  return logIdSeed;
}

//统一格式化当前时间，保持Mock数据里的时间格式一致：YYYY-MM-DD HH:mm:ss
export function nowText(date = new Date()): string {
  //不足两位补0，例如 9 -> 09
  const pad = (value: number) => String(value).padStart(2, "0");

  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join("-").concat(
    " ",
    [pad(date.getHours()), pad(date.getMinutes()), pad(date.getSeconds())].join(
      ":",
    ),
  );
}

//写入操作日志，集中处理日志ID、IP、创建时间这些公共字段
export function createOperationLog(
  //调用方只需要传业务字段，公共字段由这里补齐
  payload: Omit<OperationLog, "id" | "createdAt" | "ip"> & {
    createdAt?: string;
    ip?: string;
  },
): OperationLog {
  //模拟后端创建日志记录
  const log: OperationLog = {
    ...payload,
    id: nextLogId(),
    ip: payload.ip ?? "10.20.0.1",
    createdAt: payload.createdAt ?? nowText(),
  };

  //新日志放在最前面，列表页默认看到最新操作
  mockDb.operationLogs.unshift(log);
  return log;
}

//根据风险评分换算风险等级，后续列表Tag、Dashboard图表、风险报告都复用
export function calculateRiskLevel(score: number): RiskLevel {
  if (score >= 75) return "low";
  if (score >= 55) return "medium";
  return "high";
}

//创建贷款申请时，根据客户信用等级和客户状态给出初始风险分
export function calculateInitialRiskScore(customer: Customer): number {
  //信用等级越高，基础分越高
  const creditScoreMap: Record<Customer["creditLevel"], number> = {
    A: 86,
    B: 70,
    C: 52,
    D: 38,
  };
  //观察名单和冻结客户需要扣分，模拟风控准入规则
  const statusPenaltyMap: Record<Customer["status"], number> = {
    normal: 0,
    watch: 8,
    frozen: 18,
  };

  //最低保留20分，避免极端数据导致分数过低不利于页面展示
  return Math.max(
    20,
    creditScoreMap[customer.creditLevel] - statusPenaltyMap[customer.status],
  );
}

//规则兜底版风险报告：当真实AI接口不可用时，用可解释规则生成摘要
export function generateRuleBasedRiskReport(
  //贷款申请信息，提供金额、期限、产品类型和风险分
  loan: LoanApplication,
  //客户画像信息，提供信用等级、收入、风险标签等输入
  customer: Customer,
): RiskReport {
  const level = calculateRiskLevel(loan.riskScore);
  //优先识别强风险标签，例如逾期、冻结、多头申请
  const highRiskTags = customer.riskTags.filter(
    (tag) =>
      tag.includes("逾期") || tag.includes("冻结") || tag.includes("多头"),
  );
  //没有强风险标签时，保留客户标签并补充贷款产品上下文
  const tags =
    highRiskTags.length > 0
      ? highRiskTags
      : [...customer.riskTags, `${loan.productType}申请`];
  //不同风险等级对应不同摘要，便于面试时讲清楚AI失败兜底链路
  const summaryMap: Record<RiskLevel, string> = {
    low: "客户资质较稳定，当前申请金额和期限与收入水平基本匹配，整体风险较低。",
    medium:
      "客户存在部分风险信号，需要结合收入流水、负债情况和贷款用途进一步核验。",
    high: "客户存在明显风险信号，当前偿付能力或信用表现不足以支撑本次申请。",
  };
  //不同风险等级对应不同审批建议
  const suggestionMap: Record<RiskLevel, string> = {
    low: "建议通过审批，并按标准流程完成放款前核验。",
    medium: "建议补充材料或降低额度后再进行人工复核。",
    high: "建议拒绝本次申请，或要求客户完成风险整改后重新提交。",
  };

  return {
    applicationId: loan.id,
    score: loan.riskScore,
    level,
    tags,
    //summary 和 suggestion 是风控审批页的核心展示内容
    summary: summaryMap[level],
    suggestion: suggestionMap[level],
    //evidence 用于展示“为什么给出这个结论”，避免摘要像黑盒
    evidence: [
      {
        label: "信用等级",
        value: customer.creditLevel,
        level,
      },
      {
        label: "月收入",
        value: `${customer.monthlyIncome} 元`,
        level: customer.monthlyIncome >= 25000 ? "low" : "medium",
      },
      {
        label: "风险评分",
        value: String(loan.riskScore),
        level,
      },
    ],
    generatedAt: nowText(),
  };
}

//根据操作人ID反查角色，写操作日志时保证角色字段和用户表一致
export function getOperatorRole(operatorId?: number): RoleCode {
  return mockDb.users.find((user) => user.id === operatorId)?.role ?? "admin";
}
