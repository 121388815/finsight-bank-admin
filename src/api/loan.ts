import type { PageParams, PageResult } from "../types/api";
import type {
  LoanApplication,
  LoanQuery,
  ReviewPayload,
} from "../types/loan";
import { paginateMockData } from "../utils/mock";
import {
  calculateInitialRiskScore,
  createOperationLog,
  getOperatorRole,
  mockDb,
  nextLoanId,
  nowText,
} from "./mockDb";
import { mockError, mockRequest } from "./request";

//贷款申请列表查询参数：分页参数 + 贷款业务筛选条件
export interface LoanListParams extends PageParams, LoanQuery {}

//新增贷款申请入参，客户姓名和风险分由Mock后端根据 customerId 自动补齐
export interface CreateLoanPayload {
  //关联客户ID，必须能在客户表中找到
  customerId: number;
  //贷款产品类型，例如消费贷、经营贷、房贷、车贷
  productType: LoanApplication["productType"];
  //申请金额，单位元
  amount: number;
  //贷款期限，单位月
  term: number;
  //贷款用途说明
  purpose: string;
}

//审批接口附加参数，用来模拟当前登录审批人
export interface ReviewLoanOptions {
  //审批人用户ID，用于写操作日志和反查角色
  operatorId?: number;
  //审批人展示名称
  operatorName?: string;
}

//贷款申请分页查询接口：用于贷款管理列表页
export function getLoanApplications(params: LoanListParams) {
  const { page, pageSize, keyword, productType, status } = params;
  //搜索关键字统一小写，便于模糊匹配
  const normalizedKeyword = keyword?.trim().toLowerCase();
  const filtered = mockDb.loans.filter((loan) => {
    //keyword 支持客户名、贷款用途、产品类型的模糊查询
    const matchKeyword =
      !normalizedKeyword ||
      [loan.customerName, loan.purpose, loan.productType].some((value) =>
        value.toLowerCase().includes(normalizedKeyword),
      );
    //按贷款产品筛选
    const matchProductType = !productType || loan.productType === productType;
    //按审批状态筛选
    const matchStatus = !status || loan.status === status;

    return matchKeyword && matchProductType && matchStatus;
  });

  //返回分页结果，页面可直接用于 Ant Design Table 的 dataSource 和 pagination
  return mockRequest<PageResult<LoanApplication>>(
    paginateMockData(filtered, page, pageSize),
  );
}

//贷款申请详情接口：用于详情页和风控审批页
export function getLoanApplicationById(id: number) {
  const loan = mockDb.loans.find((item) => item.id === id);

  if (!loan) {
    return mockError<LoanApplication>(404, "贷款申请不存在");
  }

  return mockRequest<LoanApplication>(loan);
}

//新增贷款申请接口：运营人员录入贷款申请时调用
export function createLoanApplication(payload: CreateLoanPayload) {
  //先校验客户是否存在，真实后端也会做外键或业务校验
  const customer = mockDb.customers.find(
    (item) => item.id === payload.customerId,
  );

  if (!customer) {
    return mockError<LoanApplication>(404, "客户不存在，无法创建贷款申请");
  }

  const currentTime = nowText();
  //根据客户信息自动带出客户姓名，并计算初始风险分
  const loan: LoanApplication = {
    id: nextLoanId(),
    customerId: customer.id,
    customerName: customer.name,
    productType: payload.productType,
    amount: payload.amount,
    term: payload.term,
    status: "pending",
    riskScore: calculateInitialRiskScore(customer),
    purpose: payload.purpose,
    submitTime: currentTime,
    updatedAt: currentTime,
  };

  //新申请放在列表最前面，符合业务人员“最近提交优先查看”的习惯
  mockDb.loans.unshift(loan);
  //新增贷款申请需要审计留痕
  createOperationLog({
    operatorId: 3,
    operatorName: "运营人员",
    role: "operator",
    module: "loan",
    action: "新增贷款申请",
    targetId: loan.id,
    targetName: `${loan.customerName}-${loan.productType}`,
    result: "success",
  });

  return mockRequest<LoanApplication>(loan);
}

//贷款审批接口：风控人员在审批页执行通过或拒绝时调用
export function reviewLoanApplication(
  //审批动作和审批意见
  payload: ReviewPayload,
  //当前审批人信息，后续接 userStore 后可以从登录用户传入
  { operatorId = 2, operatorName = "风控专员" }: ReviewLoanOptions = {},
) {
  const loan = mockDb.loans.find((item) => item.id === payload.applicationId);

  if (!loan) {
    return mockError<LoanApplication>(404, "贷款申请不存在");
  }

  //只有待处理或风控审核中的申请允许审批，已通过/已拒绝/已放贷不能重复审批
  if (!["pending", "risk_review"].includes(loan.status)) {
    return mockError<LoanApplication>(400, "当前贷款申请状态不允许审批");
  }

  //根据审批动作更新贷款状态
  loan.status = payload.action === "approve" ? "approved" : "rejected";
  //记录审批人和审批意见，详情页可以直接展示
  loan.reviewer = operatorName;
  loan.reviewRemark = payload.remark;
  loan.updatedAt = nowText();

  //审批是核心业务操作，必须写入操作日志，方便后续审计追踪
  createOperationLog({
    operatorId,
    operatorName,
    role: getOperatorRole(operatorId),
    module: "loan",
    action: payload.action === "approve" ? "审批通过贷款申请" : "审批拒绝贷款申请",
    targetId: loan.id,
    targetName: `${loan.customerName}-${loan.productType}`,
    result: "success",
    remark: payload.remark,
  });

  return mockRequest<LoanApplication>(loan);
}
