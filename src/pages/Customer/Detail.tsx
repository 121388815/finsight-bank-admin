import { useCallback, useEffect, useState } from "react";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Descriptions, Skeleton, Space, Table, Tag } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { getCustomerById } from "../../api/customer";
import { getLoanApplications } from "../../api/loan";
import { unwrapResponse } from "../../api/request";
import PageContainer from "../../components/PageContainer";
import RiskScore from "../../components/RiskScore";
import StatusTag from "../../components/StatusTag";
import type { Customer } from "../../types/customer";
import type { LoanApplication } from "../../types/loan";

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const customerId = Number(id);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const current = unwrapResponse(await getCustomerById(customerId));
      setCustomer(current);
      const loanResult = unwrapResponse(await getLoanApplications({ page: 1, pageSize: 100, keyword: current.name }));
      setLoans(loanResult.list.filter((loan) => loan.customerId === customerId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "客户详情加载失败");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => { void loadData(); }, [loadData]);

  return (
    <PageContainer title="客户详情" description={customer ? `客户编号 ${customer.id}` : undefined} extra={<Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)}>返回</Button>}>
      {error ? <Alert type="error" showIcon message={error} action={<Button size="small" onClick={() => void loadData()}>重试</Button>} /> : null}
      <Skeleton active loading={loading} paragraph={{ rows: 8 }}>
        {customer ? (
          <div className="detail-grid">
            <Card title="客户档案" className="detail-main-card">
              <Descriptions column={{ xs: 1, sm: 2, lg: 3 }}>
                <Descriptions.Item label="客户姓名">{customer.name}</Descriptions.Item>
                <Descriptions.Item label="客户状态"><StatusTag status={customer.status} /></Descriptions.Item>
                <Descriptions.Item label="信用等级"><Tag color={customer.creditLevel === "A" ? "green" : "blue"}>{customer.creditLevel} 级</Tag></Descriptions.Item>
                <Descriptions.Item label="手机号码">{customer.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")}</Descriptions.Item>
                <Descriptions.Item label="身份证号">{`${customer.idCard.slice(0, 6)}********${customer.idCard.slice(-4)}`}</Descriptions.Item>
                <Descriptions.Item label="年龄">{customer.age} 岁</Descriptions.Item>
                <Descriptions.Item label="职业">{customer.job}</Descriptions.Item>
                <Descriptions.Item label="月收入">¥{customer.monthlyIncome.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="建档时间">{customer.createdAt}</Descriptions.Item>
                <Descriptions.Item label="所属网点">{customer.branch}</Descriptions.Item>
                <Descriptions.Item label="客户经理">{customer.accountManager}</Descriptions.Item>
                <Descriptions.Item label="风险标签"><Space size={[0, 4]} wrap>{customer.riskTags.map((tag) => <Tag key={tag}>{tag}</Tag>)}</Space></Descriptions.Item>
              </Descriptions>
            </Card>
            <Card title="风险概览" className="detail-side-card"><RiskScore score={{ A: 86, B: 70, C: 52, D: 38 }[customer.creditLevel]} /></Card>
            <Card title="关联贷款申请" className="detail-full-card">
              <Table<LoanApplication>
                rowKey="id"
                size="middle"
                dataSource={loans}
                pagination={false}
                scroll={{ x: 760 }}
                columns={[
                  { title: "申请编号", dataIndex: "id" },
                  { title: "产品", dataIndex: "productType" },
                  { title: "金额", dataIndex: "amount", render: (value: number) => `¥${value.toLocaleString()}` },
                  { title: "期限", dataIndex: "term", render: (value: number) => `${value}个月` },
                  { title: "状态", dataIndex: "status", render: (value: LoanApplication["status"]) => <StatusTag status={value} /> },
                  { title: "提交时间", dataIndex: "submitTime" },
                  { title: "操作", render: (_, record) => <Button type="link" onClick={() => navigate(`/loans/${record.id}`)}>查看</Button> },
                ]}
              />
            </Card>
          </div>
        ) : null}
      </Skeleton>
    </PageContainer>
  );
}
