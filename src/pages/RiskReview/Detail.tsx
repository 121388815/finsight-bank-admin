import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeftOutlined,
  CheckOutlined,
  RedoOutlined,
  RobotOutlined,
  StopOutlined,
} from "@ant-design/icons";
import {
  Alert,
  App,
  Button,
  Card,
  Descriptions,
  Form,
  Modal,
  Skeleton,
  Space,
  Tag,
} from "antd";
import TextArea from "antd/es/input/TextArea";
import { useNavigate, useParams } from "react-router-dom";
import { getCustomerById } from "../../api/customer";
import { getLoanApplicationById, reviewLoanApplication } from "../../api/loan";
import { ApiError, unwrapResponse } from "../../api/request";
import { generateRiskSummary, getRiskReport } from "../../api/risk";
import PageContainer from "../../components/PageContainer";
import Permission from "../../components/Permission";
import RiskScore from "../../components/RiskScore";
import StatusTag from "../../components/StatusTag";
import { useUserStore } from "../../store/userStore";
import type { Customer } from "../../types/customer";
import type { LoanApplication, ReviewAction } from "../../types/loan";
import type { RiskReport } from "../../types/risk";

interface ReviewFormValues {
  remark: string;
}

export default function RiskReviewDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm<ReviewFormValues>();
  const user = useUserStore((state) => state.user);
  const applicationId = Number(id);
  const [loan, setLoan] = useState<LoanApplication | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [report, setReport] = useState<RiskReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [reviewAction, setReviewAction] = useState<ReviewAction | null>(null);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const currentLoan = unwrapResponse(await getLoanApplicationById(applicationId));
      const currentCustomer = unwrapResponse(await getCustomerById(currentLoan.customerId));
      setLoan(currentLoan);
      setCustomer(currentCustomer);
      try {
        setReport(unwrapResponse(await getRiskReport(applicationId)));
      } catch (reportError) {
        if (reportError instanceof ApiError && reportError.code === 404) setReport(null);
        else throw reportError;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "审批数据加载失败");
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => { void loadData(); }, [loadData]);

  const handleGenerate = async (regenerate = false) => {
    setGenerating(true);
    try {
      const nextReport = unwrapResponse(await generateRiskSummary({ applicationId, regenerate }));
      setReport(nextReport);
      void message.success(regenerate ? "风险摘要已重新生成" : "风险摘要已生成");
    } catch (err) {
      void message.error(err instanceof Error ? err.message : "风险摘要生成失败");
    } finally {
      setGenerating(false);
    }
  };

  const openReview = (action: ReviewAction) => {
    setReviewAction(action);
    form.setFieldsValue({
      remark: action === "approve"
        ? "客户资质及风险材料核验通过，同意本次贷款申请。"
        : "客户当前风险水平不符合准入要求，拒绝本次贷款申请。",
    });
  };

  const handleReview = async () => {
    if (!reviewAction) return;
    try {
      const values = await form.validateFields();
      setReviewing(true);
      const updated = unwrapResponse(await reviewLoanApplication(
        { applicationId, action: reviewAction, remark: values.remark },
        { operatorId: user?.id, operatorName: user?.nickname },
      ));
      setLoan(updated);
      setReviewAction(null);
      form.resetFields();
      void message.success(reviewAction === "approve" ? "审批已通过" : "申请已拒绝");
    } catch (err) {
      if (err instanceof Error) void message.error(err.message);
    } finally {
      setReviewing(false);
    }
  };

  const canReview = loan && ["pending", "risk_review"].includes(loan.status);

  return (
    <PageContainer
      title="风控审批工作台"
      description={loan ? `申请 ${loan.id} · ${loan.customerName} · ${loan.productType}` : undefined}
      extra={<Space><Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>{canReview ? <><Permission code="loan:reject"><Button danger icon={<StopOutlined />} onClick={() => openReview("reject")}>拒绝</Button></Permission><Permission code="loan:approve"><Button type="primary" icon={<CheckOutlined />} onClick={() => openReview("approve")}>通过</Button></Permission></> : null}</Space>}
    >
      {error ? <Alert type="error" showIcon message={error} action={<Button size="small" onClick={() => void loadData()}>重试</Button>} /> : null}
      <Skeleton active loading={loading} paragraph={{ rows: 10 }}>
        {loan && customer ? (
          <div className="review-layout">
            <div className="review-main">
              <Card title="申请与客户信息">
                <Descriptions column={{ xs: 1, sm: 2, lg: 3 }}>
                  <Descriptions.Item label="申请状态"><StatusTag status={loan.status} /></Descriptions.Item>
                  <Descriptions.Item label="申请金额"><strong>¥{loan.amount.toLocaleString()}</strong></Descriptions.Item>
                  <Descriptions.Item label="期限">{loan.term}个月</Descriptions.Item>
                  <Descriptions.Item label="贷款用途">{loan.purpose}</Descriptions.Item>
                  <Descriptions.Item label="职业">{customer.job}</Descriptions.Item>
                  <Descriptions.Item label="月收入">¥{customer.monthlyIncome.toLocaleString()}</Descriptions.Item>
                  <Descriptions.Item label="信用等级"><Tag color="blue">{customer.creditLevel} 级</Tag></Descriptions.Item>
                  <Descriptions.Item label="客户状态"><StatusTag status={customer.status} /></Descriptions.Item>
                  <Descriptions.Item label="风险标签"><Space wrap>{customer.riskTags.map((tag) => <Tag key={tag}>{tag}</Tag>)}</Space></Descriptions.Item>
                  {loan.reviewRemark ? <Descriptions.Item label="审批结论" span={3}>{loan.reviewRemark}</Descriptions.Item> : null}
                </Descriptions>
              </Card>

              <Card
                title={<Space><RobotOutlined />风险摘要</Space>}
                extra={<Permission code="risk:generate"><Button icon={report ? <RedoOutlined /> : <RobotOutlined />} loading={generating} onClick={() => void handleGenerate(Boolean(report))}>{report ? "重新生成" : "生成摘要"}</Button></Permission>}
              >
                {report ? (
                  <div className="risk-report">
                    <Alert type={report.level === "high" ? "error" : report.level === "medium" ? "warning" : "success"} showIcon message={report.summary} description={report.suggestion} />
                    <Space wrap className="risk-tags">{report.tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}</Space>
                    <section className="risk-evidence">
                      <h3>风险证据</h3>
                      <ul>
                        {report.evidence.map((item) => (
                          <li key={`${item.label}-${item.value}`}>
                            <div>
                              <strong>{item.label}</strong>
                              <span className="risk-evidence-value">{item.value}</span>
                            </div>
                            <StatusTag status={item.level} />
                          </li>
                        ))}
                      </ul>
                    </section>
                    <div className="report-time">生成时间：{report.generatedAt}</div>
                  </div>
                ) : (
                  <div className="empty-report"><RobotOutlined /><strong>尚未生成风险摘要</strong><span>请生成摘要后再结合原始材料进行人工审批</span><Permission code="risk:generate"><Button type="primary" loading={generating} onClick={() => void handleGenerate(false)}>生成风险摘要</Button></Permission></div>
                )}
              </Card>
            </div>

            <aside className="review-aside">
              <Card title="综合风险评分"><RiskScore score={loan.riskScore} /></Card>
              <Card title="审批原则" className="review-policy">
                <p>风险摘要仅用于辅助判断，审批结论需结合客户原始材料和授信政策人工确认。</p>
              </Card>
            </aside>
          </div>
        ) : null}
      </Skeleton>

      <Modal
        title={reviewAction === "approve" ? "确认审批通过" : "确认拒绝申请"}
        open={Boolean(reviewAction)}
        confirmLoading={reviewing}
        okButtonProps={{ danger: reviewAction === "reject" }}
        okText={reviewAction === "approve" ? "确认通过" : "确认拒绝"}
        onOk={() => void handleReview()}
        onCancel={() => { setReviewAction(null); form.resetFields(); }}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="remark" label="审批意见" rules={[{ required: true, min: 10, message: "请填写至少10个字的审批意见" }]}>
            <TextArea rows={5} maxLength={300} showCount />
          </Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}
