import { useCallback, useEffect, useState } from "react";
import { ArrowLeftOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Descriptions, Skeleton, Space, Tag, Timeline } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { getCustomerById } from "../../api/customer";
import { getLoanApplicationById } from "../../api/loan";
import { unwrapResponse } from "../../api/request";
import PageContainer from "../../components/PageContainer";
import Permission from "../../components/Permission";
import RiskScore from "../../components/RiskScore";
import StatusTag from "../../components/StatusTag";
import type { Customer } from "../../types/customer";
import type { LoanApplication } from "../../types/loan";

export default function LoanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const applicationId = Number(id);
  const [loan, setLoan] = useState<LoanApplication | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const currentLoan = unwrapResponse(await getLoanApplicationById(applicationId));
      const currentCustomer = unwrapResponse(await getCustomerById(currentLoan.customerId));
      setLoan(currentLoan);
      setCustomer(currentCustomer);
    } catch (err) {
      setError(err instanceof Error ? err.message : "申请详情加载失败");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => { void loadData(); }, [loadData]);

  const canReview = loan && ["pending", "risk_review"].includes(loan.status);

  return (
    <PageContainer
      title="贷款申请详情"
      description={loan ? `申请编号 ${loan.id}` : undefined}
      extra={<Space><Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>{canReview ? <Permission code="risk:view"><Button type="primary" icon={<SafetyCertificateOutlined />} onClick={() => navigate(`/risk-review/${loan.id}`)}>进入风控审批</Button></Permission> : null}</Space>}
    >
      {error ? <Alert type="error" showIcon message={error} action={<Button size="small" onClick={() => void loadData()}>重试</Button>} /> : null}
      <Skeleton active loading={loading} paragraph={{ rows: 8 }}>
        {loan && customer ? (
          <div className="detail-grid">
            <Card title="申请信息" className="detail-main-card">
              <Descriptions column={{ xs: 1, sm: 2, lg: 3 }}>
                <Descriptions.Item label="客户姓名"><Button type="link" className="inline-link" onClick={() => navigate(`/customers/${customer.id}`)}>{loan.customerName}</Button></Descriptions.Item>
                <Descriptions.Item label="贷款产品">{loan.productType}</Descriptions.Item>
                <Descriptions.Item label="申请状态"><StatusTag status={loan.status} /></Descriptions.Item>
                <Descriptions.Item label="申请金额"><strong>¥{loan.amount.toLocaleString()}</strong></Descriptions.Item>
                <Descriptions.Item label="贷款期限">{loan.term} 个月</Descriptions.Item>
                <Descriptions.Item label="贷款用途">{loan.purpose}</Descriptions.Item>
                <Descriptions.Item label="提交时间">{loan.submitTime}</Descriptions.Item>
                <Descriptions.Item label="更新时间">{loan.updatedAt}</Descriptions.Item>
                <Descriptions.Item label="审批人">{loan.reviewer ?? "-"}</Descriptions.Item>
                <Descriptions.Item label="审批意见" span={3}>{loan.reviewRemark ?? "尚未审批"}</Descriptions.Item>
              </Descriptions>
            </Card>
            <Card title="风险评分" className="detail-side-card"><RiskScore score={loan.riskScore} /></Card>
            <Card title="客户摘要" className="detail-main-card">
              <Descriptions column={{ xs: 1, sm: 2 }}>
                <Descriptions.Item label="信用等级"><Tag color="blue">{customer.creditLevel} 级</Tag></Descriptions.Item>
                <Descriptions.Item label="客户状态"><StatusTag status={customer.status} /></Descriptions.Item>
                <Descriptions.Item label="职业">{customer.job}</Descriptions.Item>
                <Descriptions.Item label="月收入">¥{customer.monthlyIncome.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="风险标签" span={2}><Space wrap>{customer.riskTags.map((tag) => <Tag key={tag}>{tag}</Tag>)}</Space></Descriptions.Item>
              </Descriptions>
            </Card>
            <Card title="申请进度" className="detail-side-card">
              <Timeline items={[
                { color: "green", children: <><strong>申请已提交</strong><div>{loan.submitTime}</div></> },
                { color: loan.status === "pending" ? "gray" : "blue", children: <><strong>风控审核</strong><div>{loan.status === "pending" ? "等待进入风控" : "已进入风险评估"}</div></> },
                { color: loan.status === "approved" || loan.status === "released" ? "green" : loan.status === "rejected" ? "red" : "gray", children: <><strong>审批结论</strong><div>{loan.reviewer ? `${loan.reviewer} · ${loan.updatedAt}` : "等待审批"}</div></> },
              ]} />
            </Card>
          </div>
        ) : null}
      </Skeleton>
    </PageContainer>
  );
}
