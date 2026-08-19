import type { Customer } from "../types/customer";
import type { LoanApplication } from "../types/loan";
import type { OperationLog } from "../types/log";
import type { PageResult } from "../types/api";
import type { RiskReport } from "../types/risk";
import type { User } from "../types/user";
import { ROLE_PERMISSION_MAP } from "../types/user";

//虚拟后端
export const mockUsers: User[] = [
  {
    id: 1,
    username: "admin",
    nickname: "系统管理员",
    role: "admin",
    permissions: [...ROLE_PERMISSION_MAP.admin],
    department: "总行科技运营部",
    enabled: true,
    lastLoginAt: "2026-05-20 09:10:24",
  },
  {
    id: 2,
    username: "risk01",
    nickname: "风控专员",
    role: "risk_officer",
    permissions: [...ROLE_PERMISSION_MAP.risk_officer],
    department: "风险管理部",
    enabled: true,
    lastLoginAt: "2026-05-19 18:42:10",
  },
  {
    id: 3,
    username: "operator01",
    nickname: "运营人员",
    role: "operator",
    permissions: [...ROLE_PERMISSION_MAP.operator],
    department: "零售信贷运营部",
    enabled: true,
    lastLoginAt: "2026-05-19 16:25:31",
  },
  {
    id: 4,
    username: "auditor01",
    nickname: "审计人员",
    role: "auditor",
    permissions: [...ROLE_PERMISSION_MAP.auditor],
    department: "内控审计部",
    enabled: true,
    lastLoginAt: "2026-05-18 11:03:46",
  },
  {
    id: 5,
    username: "viewer01",
    nickname: "只读用户",
    role: "viewer",
    permissions: [...ROLE_PERMISSION_MAP.viewer],
    department: "分行业务部",
    enabled: true,
    lastLoginAt: "2026-05-17 14:20:09",
  },
];

export const mockCustomers: Customer[] = [
  {
    id: 1001,
    name: "张明",
    phone: "13800138001",
    idCard: "110101199003071234",
    age: 36,
    job: "互联网产品经理",
    monthlyIncome: 32000,
    creditLevel: "A",
    riskTags: ["收入稳定", "无逾期"],
    branch: "北京朝阳支行",
    accountManager: "李娜",
    status: "normal",
    createdAt: "2026-04-18 10:12:00",
  },
  {
    id: 1002,
    name: "李娜",
    phone: "13900139002",
    idCard: "310101198811221238",
    age: 38,
    job: "餐饮门店负责人",
    monthlyIncome: 26000,
    creditLevel: "B",
    riskTags: ["经营流水波动"],
    branch: "上海浦东支行",
    accountManager: "陈涛",
    status: "watch",
    createdAt: "2026-04-20 15:35:00",
  },
  {
    id: 1003,
    name: "王强",
    phone: "13700137003",
    idCard: "440101199206181230",
    age: 34,
    job: "制造业工程师",
    monthlyIncome: 21000,
    creditLevel: "B",
    riskTags: ["负债适中"],
    branch: "广州天河支行",
    accountManager: "周洋",
    status: "normal",
    createdAt: "2026-04-25 09:48:00",
  },
  {
    id: 1004,
    name: "赵敏",
    phone: "13600136004",
    idCard: "330101199507091231",
    age: 31,
    job: "自由职业者",
    monthlyIncome: 14000,
    creditLevel: "C",
    riskTags: ["收入波动", "短期多头申请"],
    branch: "杭州西湖支行",
    accountManager: "许洁",
    status: "watch",
    createdAt: "2026-05-01 13:26:00",
  },
  {
    id: 1005,
    name: "陈涛",
    phone: "13500135005",
    idCard: "510101198503151239",
    age: 41,
    job: "物流公司法人",
    monthlyIncome: 45000,
    creditLevel: "A",
    riskTags: ["企业经营稳定"],
    branch: "成都高新支行",
    accountManager: "王强",
    status: "normal",
    createdAt: "2026-05-03 11:05:00",
  },
  {
    id: 1006,
    name: "周洋",
    phone: "13400134006",
    idCard: "420101199112031236",
    age: 35,
    job: "电商店主",
    monthlyIncome: 18000,
    creditLevel: "D",
    riskTags: ["历史逾期", "现金流偏弱"],
    branch: "武汉光谷支行",
    accountManager: "张明",
    status: "frozen",
    createdAt: "2026-05-05 16:44:00",
  },
];

export const mockLoanApplications: LoanApplication[] = [
  {
    id: 30001,
    customerId: 1001,
    customerName: "张明",
    productType: "消费贷",
    amount: 180000,
    term: 24,
    status: "risk_review",
    riskScore: 82,
    purpose: "家庭装修",
    submitTime: "2026-05-12 09:18:00",
    updatedAt: "2026-05-12 10:03:00",
  },
  {
    id: 30002,
    customerId: 1002,
    customerName: "李娜",
    productType: "经营贷",
    amount: 500000,
    term: 36,
    status: "pending",
    riskScore: 68,
    purpose: "门店扩张",
    submitTime: "2026-05-13 14:30:00",
    updatedAt: "2026-05-13 14:30:00",
  },
  {
    id: 30003,
    customerId: 1003,
    customerName: "王强",
    productType: "车贷",
    amount: 220000,
    term: 36,
    status: "approved",
    riskScore: 76,
    purpose: "购置家庭用车",
    submitTime: "2026-05-10 11:22:00",
    updatedAt: "2026-05-11 17:02:00",
    reviewer: "风控专员",
    reviewRemark: "收入稳定，负债率可控，准入通过。",
  },
  {
    id: 30004,
    customerId: 1004,
    customerName: "赵敏",
    productType: "消费贷",
    amount: 120000,
    term: 18,
    status: "rejected",
    riskScore: 48,
    purpose: "教育培训",
    submitTime: "2026-05-09 15:40:00",
    updatedAt: "2026-05-10 09:16:00",
    reviewer: "风控专员",
    reviewRemark: "短期申请频繁，收入稳定性不足。",
  },
  {
    id: 30005,
    customerId: 1005,
    customerName: "陈涛",
    productType: "经营贷",
    amount: 800000,
    term: 48,
    status: "released",
    riskScore: 88,
    purpose: "车辆采购和周转",
    submitTime: "2026-05-06 10:25:00",
    updatedAt: "2026-05-08 16:12:00",
    reviewer: "风控专员",
    reviewRemark: "企业经营稳定，流水覆盖充足。",
  },
  {
    id: 30006,
    customerId: 1006,
    customerName: "周洋",
    productType: "经营贷",
    amount: 260000,
    term: 24,
    status: "risk_review",
    riskScore: 39,
    purpose: "备货周转",
    submitTime: "2026-05-14 13:55:00",
    updatedAt: "2026-05-14 15:20:00",
  },
];

export const mockRiskReports: RiskReport[] = [
  {
    applicationId: 30001,
    score: 82,
    level: "low",
    tags: ["收入稳定", "信用记录良好", "负债率可控"],
    summary: "客户收入稳定，历史信用表现良好，贷款用途清晰，整体风险较低。",
    suggestion: "建议通过审批，可按标准额度和期限发放。",
    evidence: [
      { label: "月收入", value: "32000 元", level: "low" },
      { label: "历史逾期", value: "无", level: "low" },
      { label: "风险评分", value: "82", level: "low" },
    ],
    generatedAt: "2026-05-12 10:04:00",
  },
  {
    applicationId: 30002,
    score: 68,
    level: "medium",
    tags: ["经营流水波动", "额度较高"],
    summary:
      "客户经营收入具备一定覆盖能力，但近期流水波动，需要补充核验门店经营情况。",
    suggestion: "建议补充近六个月经营流水和租赁合同后再审批。",
    evidence: [
      { label: "申请金额", value: "500000 元", level: "medium" },
      { label: "经营流水", value: "波动", level: "medium" },
      { label: "信用等级", value: "B", level: "medium" },
    ],
    generatedAt: "2026-05-13 14:35:00",
  },
  {
    applicationId: 30004,
    score: 48,
    level: "high",
    tags: ["短期多头申请", "收入波动"],
    summary: "客户近期多次申请消费贷款，收入稳定性不足，存在较高偿付压力。",
    suggestion: "建议拒绝本次申请，或降低额度后重新评估。",
    evidence: [
      { label: "多头申请", value: "30 天内 4 次", level: "high" },
      { label: "月收入", value: "14000 元", level: "medium" },
      { label: "风险评分", value: "48", level: "high" },
    ],
    generatedAt: "2026-05-10 09:08:00",
  },
  {
    applicationId: 30006,
    score: 39,
    level: "high",
    tags: ["历史逾期", "现金流偏弱", "客户状态冻结"],
    summary: "客户存在历史逾期，当前客户状态为冻结，经营现金流对贷款覆盖不足。",
    suggestion: "建议拒绝本次申请，并要求客户先完成存量风险处置。",
    evidence: [
      { label: "历史逾期", value: "存在", level: "high" },
      { label: "客户状态", value: "冻结", level: "high" },
      { label: "风险评分", value: "39", level: "high" },
    ],
    generatedAt: "2026-05-14 15:22:00",
  },
];

export const mockOperationLogs: OperationLog[] = [
  {
    id: 90001,
    operatorId: 2,
    operatorName: "风控专员",
    role: "risk_officer",
    module: "loan",
    action: "审批通过贷款申请",
    targetId: 30003,
    targetName: "王强-车贷",
    result: "success",
    ip: "10.20.8.16",
    createdAt: "2026-05-11 17:02:00",
    remark: "收入稳定，负债率可控。",
  },
  {
    id: 90002,
    operatorId: 2,
    operatorName: "风控专员",
    role: "risk_officer",
    module: "loan",
    action: "审批拒绝贷款申请",
    targetId: 30004,
    targetName: "赵敏-消费贷",
    result: "success",
    ip: "10.20.8.16",
    createdAt: "2026-05-10 09:16:00",
    remark: "短期申请频繁，收入稳定性不足。",
  },
  {
    id: 90003,
    operatorId: 3,
    operatorName: "运营人员",
    role: "operator",
    module: "customer",
    action: "新增客户",
    targetId: 1006,
    targetName: "周洋",
    result: "success",
    ip: "10.20.6.23",
    createdAt: "2026-05-05 16:44:00",
  },
  {
    id: 90004,
    operatorId: 1,
    operatorName: "系统管理员",
    role: "admin",
    module: "system",
    action: "调整角色权限",
    targetName: "风控专员",
    result: "success",
    ip: "10.20.1.10",
    createdAt: "2026-05-04 10:30:00",
    remark: "新增风险摘要生成权限。",
  },
  {
    id: 90005,
    operatorId: 5,
    operatorName: "只读用户",
    role: "viewer",
    module: "loan",
    action: "尝试审批贷款申请",
    targetId: 30002,
    targetName: "李娜-经营贷",
    result: "failed",
    ip: "10.20.9.31",
    createdAt: "2026-05-03 15:12:00",
    remark: "权限不足。",
  },
];

export interface MockDelayOptions {
  timeout?: number;
  shouldReject?: boolean;
  errorMessage?: string;
  clone?: boolean;
}

//模拟网络延迟与异常的工具函数
export function mockDelay<T>(
  data: T,
  {
    timeout = 300,
    shouldReject = false,
    errorMessage = "Mock request failed",
    clone = true,
  }: MockDelayOptions = {},
): Promise<T> {
  return new Promise((resolve, reject) => {
    globalThis.setTimeout(() => {
      if (shouldReject) {
        reject(new Error(errorMessage));
        return;
      }

      resolve(clone ? cloneMockData(data) : data);
    }, timeout);
  });
}

//模拟分页逻辑的工具函数
export function paginateMockData<T>(
  list: T[],
  page: number,
  pageSize: number,
): PageResult<T> {
  const start = (page - 1) * pageSize;

  return {
    list: list.slice(start, start + pageSize),
    total: list.length,
    page,
    pageSize,
  };
}

function cloneMockData<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }

  if (typeof structuredClone === "function") {
    return structuredClone(data);
  }

  return JSON.parse(JSON.stringify(data)) as T;
}
