//贷款业务Loan数据模型

//贷款产品类型
export type LoanProductType = "消费贷" | "经营贷" | "房贷" | "车贷";

//贷款申请状态流转
export type LoanStatus =
  | "pending" //待处理
  | "risk_review" //风控审核中
  | "approved" //审批通过
  | "rejected" //已拒绝
  | "released"; //已放贷

//贷款申请单实体
export interface LoanApplication {
  id: number; //申请单号
  customerId: number; //申请用户的ID
  customerName: string; //申请用户的姓名
  productType: LoanProductType; //贷款产品
  amount: number; //申请金额
  term: number; //贷款期限
  status: LoanStatus; //贷款用途说明
  riskScore: number; //风控评分
  purpose: string; //申请状态
  submitTime: string; //提交时间
  updatedAt: string; //最后更新时间
  reviewer?: string; //审核反馈
  reviewRemark?: string; //审核备注
}

//贷款查询条件
export interface LoanQuery {
  keyword?: string; //通用搜索
  productType?: LoanProductType; //按贷款类型筛选
  status?: LoanStatus; //按审批状态筛选
}

//审核操作交互 通过|拒绝
export type ReviewAction = "approve" | "reject";

//前端调用“审核接口”时需要提交的载荷
export interface ReviewPayload {
  applicationId: number; //要审核的那笔申请单 ID
  action: ReviewAction; //执行操作
  remark: string; //审核意见
}
