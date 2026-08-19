//风控报告
//风险等级
export type RiskLevel = "low" | "medium" | "high";

//单条证据详情
export interface RiskEvidence {
  label: string; //证据项的名称
  value: string; //该项的具体数值
  level: RiskLevel; //风险等级
}

//完整风控报告实体
export interface RiskReport {
  applicationId: number; //对应具体的贷款申请ID
  score: number; //风险评分
  level: RiskLevel; //风险等级
  tags: string[]; //风险标签数组
  summary: string; //概述用户具体信用情况
  suggestion: string; //系统建议
  evidence: RiskEvidence[]; //证据链
  generatedAt: string; //报告生成具体时间
}

//获取报告请求参数
export interface RiskSummaryPayload {
  applicationId: number; //ID
  regenerate?: boolean; //可选bool值
}
