import type { RiskReport, RiskSummaryPayload } from "../types/risk";
import {
  createOperationLog,
  generateRuleBasedRiskReport,
  mockDb,
} from "./mockDb";
import { mockError, mockRequest } from "./request";

//查询风险报告接口：用于风控审批页加载已有AI摘要或规则摘要
export function getRiskReport(applicationId: number) {
  //风险报告和贷款申请通过 applicationId 一一关联
  const report = mockDb.riskReports.find(
    (item) => item.applicationId === applicationId,
  );

  if (!report) {
    return mockError<RiskReport>(404, "风险报告不存在");
  }

  return mockRequest<RiskReport>(report);
}

//生成风险摘要接口：模拟调用AI服务，失败或未接入AI时走规则兜底
export function generateRiskSummary(payload: RiskSummaryPayload) {
  //先确认贷款申请存在，因为摘要需要贷款金额、期限、产品类型和风险分
  const loan = mockDb.loans.find((item) => item.id === payload.applicationId);

  if (!loan) {
    return mockError<RiskReport>(404, "贷款申请不存在，无法生成风险摘要");
  }

  //再确认客户存在，因为摘要需要客户画像、收入、信用等级和风险标签
  const customer = mockDb.customers.find((item) => item.id === loan.customerId);

  if (!customer) {
    return mockError<RiskReport>(404, "客户不存在，无法生成风险摘要");
  }

  //查找是否已经生成过报告，避免每次进入页面都重复生成
  const existingIndex = mockDb.riskReports.findIndex(
    (item) => item.applicationId === payload.applicationId,
  );

  //如果已有报告且不是强制重新生成，直接返回已有结果
  if (existingIndex >= 0 && !payload.regenerate) {
    return mockRequest<RiskReport>(mockDb.riskReports[existingIndex]);
  }

  //Mock阶段用规则引擎生成报告，后续可替换成真实AI接口返回
  const report = generateRuleBasedRiskReport(loan, customer);

  //重新生成时覆盖旧报告，首次生成时插入报告表
  if (existingIndex >= 0) {
    mockDb.riskReports[existingIndex] = report;
  } else {
    mockDb.riskReports.unshift(report);
  }

  //生成或重新生成摘要都属于关键操作，写入日志便于审计
  createOperationLog({
    operatorId: 2,
    operatorName: "风控专员",
    role: "risk_officer",
    module: "risk",
    action: payload.regenerate ? "重新生成风险摘要" : "生成风险摘要",
    targetId: loan.id,
    targetName: `${loan.customerName}-${loan.productType}`,
    result: "success",
  });

  //摘要生成比普通查询略慢，保留500ms延迟方便页面展示AI生成中的loading
  return mockRequest<RiskReport>(report, { timeout: 500 });
}
