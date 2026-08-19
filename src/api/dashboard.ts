import type { LoanStatus } from "../types/loan";
import type { RiskLevel } from "../types/risk";
import { calculateRiskLevel, mockDb } from "./mockDb";
import { mockRequest } from "./request";

//Dashboard指标卡数据结构，例如客户总数、申请总额、审批通过率
export interface DashboardMetric {
  //指标名称
  label: string;
  //指标数值
  value: number;
  //单位，例如人、笔、元、%
  unit?: string;
  //趋势百分比，后续页面可展示环比上升/下降
  trend?: number;
}

//通用图表点位结构，ECharts饼图、柱状图都可以复用
export interface ChartPoint {
  //图表维度名称
  name: string;
  //图表维度数值
  value: number;
}

//Dashboard总览接口返回结构
export interface DashboardOverview {
  //顶部指标卡
  metrics: DashboardMetric[];
  //贷款状态分布图数据
  loanStatus: ChartPoint[];
  //风险等级分布图数据
  riskDistribution: ChartPoint[];
  //最新操作日志，用于看板右侧动态或审计摘要
  latestLogs: {
    id: number;
    action: string;
    operatorName: string;
    createdAt: string;
  }[];
}

//贷款状态中文映射，Dashboard图表不直接展示英文状态码
const loanStatusLabels: Record<LoanStatus, string> = {
  pending: "待处理",
  risk_review: "风控审核中",
  approved: "审批通过",
  rejected: "已拒绝",
  released: "已放贷",
};

//风险等级中文映射，Dashboard图表不直接展示 low/medium/high
const riskLevelLabels: Record<RiskLevel, string> = {
  low: "低风险",
  medium: "中风险",
  high: "高风险",
};

//Dashboard总览接口：聚合客户、贷款、风险、日志多张Mock表的数据
export function getDashboardOverview() {
  //贷款申请总金额，用于申请总额指标
  const totalAmount = mockDb.loans.reduce((sum, loan) => sum + loan.amount, 0);
  //已通过和已放贷都算作审批正向结果
  const approvedCount = mockDb.loans.filter(
    (loan) => loan.status === "approved" || loan.status === "released",
  ).length;
  //审批通过率按整数百分比返回，页面展示更直观
  const approvalRate =
    mockDb.loans.length > 0
      ? Math.round((approvedCount / mockDb.loans.length) * 100)
      : 0;
  //按贷款状态聚合数量，用于状态分布图
  const loanStatus = countByKeys(
    Object.keys(loanStatusLabels) as LoanStatus[],
    (status) => mockDb.loans.filter((loan) => loan.status === status).length,
    loanStatusLabels,
  );
  //按风险等级聚合数量，用于风险分布图
  const riskDistribution = countByKeys(
    Object.keys(riskLevelLabels) as RiskLevel[],
    (level) =>
      mockDb.loans.filter((loan) => calculateRiskLevel(loan.riskScore) === level)
        .length,
    riskLevelLabels,
  );

  //组装Dashboard页面一次请求需要的全部数据
  return mockRequest<DashboardOverview>({
    metrics: [
      { label: "客户总数", value: mockDb.customers.length, unit: "人", trend: 8 },
      {
        label: "贷款申请",
        value: mockDb.loans.length,
        unit: "笔",
        trend: 12,
      },
      {
        label: "申请总额",
        value: totalAmount,
        unit: "元",
        trend: 15,
      },
      {
        label: "审批通过率",
        value: approvalRate,
        unit: "%",
        trend: 3,
      },
    ],
    loanStatus,
    riskDistribution,
    latestLogs: mockDb.operationLogs.slice(0, 5).map((log) => ({
      id: log.id,
      action: log.action,
      operatorName: log.operatorName,
      createdAt: log.createdAt,
    })),
  });
}

//按照给定枚举值统计数量，并转换成图表需要的 name/value 结构
function countByKeys<T extends string>(
  //枚举值列表，例如全部贷款状态或全部风险等级
  keys: T[],
  //每个枚举值对应的统计函数
  getValue: (key: T) => number,
  //枚举值到中文名的映射
  labels: Record<T, string>,
): ChartPoint[] {
  return keys.map((key) => ({
    name: labels[key],
    value: getValue(key),
  }));
}
