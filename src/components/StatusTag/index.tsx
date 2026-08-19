import { Tag } from "antd";
import type { CustomerStatus } from "../../types/customer";
import type { LoanStatus } from "../../types/loan";
import type { OperationResult } from "../../types/log";
import type { RiskLevel } from "../../types/risk";

type BusinessStatus = CustomerStatus | LoanStatus | OperationResult | RiskLevel | "enabled" | "disabled";

const statusMap: Record<BusinessStatus, { label: string; color: string }> = {
  normal: { label: "正常", color: "green" },
  watch: { label: "重点关注", color: "gold" },
  frozen: { label: "已冻结", color: "red" },
  pending: { label: "待处理", color: "default" },
  risk_review: { label: "风控审核中", color: "processing" },
  approved: { label: "审批通过", color: "success" },
  rejected: { label: "已拒绝", color: "error" },
  released: { label: "已放贷", color: "cyan" },
  success: { label: "成功", color: "success" },
  failed: { label: "失败", color: "error" },
  low: { label: "低风险", color: "green" },
  medium: { label: "中风险", color: "gold" },
  high: { label: "高风险", color: "red" },
  enabled: { label: "启用", color: "green" },
  disabled: { label: "停用", color: "default" },
};

export default function StatusTag({ status }: { status: BusinessStatus }) {
  const config = statusMap[status];
  return <Tag color={config.color}>{config.label}</Tag>;
}
