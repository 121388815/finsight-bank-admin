import { useCallback, useEffect, useState } from "react";
import { SafetyCertificateOutlined } from "@ant-design/icons";
import { App, Button, Table, type TableProps } from "antd";
import { useNavigate } from "react-router-dom";
import { getLoanApplications } from "../../api/loan";
import { unwrapResponse } from "../../api/request";
import PageContainer from "../../components/PageContainer";
import RiskScore from "../../components/RiskScore";
import StatusTag from "../../components/StatusTag";
import type { LoanApplication } from "../../types/loan";

export default function RiskReview() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [data, setData] = useState<LoanApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = unwrapResponse(await getLoanApplications({ page: 1, pageSize: 100 }));
      setData(result.list.filter((loan) => ["pending", "risk_review"].includes(loan.status)));
    } catch (error) {
      void message.error(error instanceof Error ? error.message : "待审批数据加载失败");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => { void loadData(); }, [loadData]);

  const columns: TableProps<LoanApplication>["columns"] = [
    { title: "申请编号", dataIndex: "id" },
    { title: "客户姓名", dataIndex: "customerName" },
    { title: "产品", dataIndex: "productType" },
    { title: "申请金额", dataIndex: "amount", render: (value: number) => `¥${value.toLocaleString()}` },
    { title: "期限", dataIndex: "term", render: (value: number) => `${value}个月` },
    { title: "风险评分", dataIndex: "riskScore", render: (value: number) => <RiskScore score={value} compact /> },
    { title: "当前状态", dataIndex: "status", render: (value: LoanApplication["status"]) => <StatusTag status={value} /> },
    { title: "提交时间", dataIndex: "submitTime" },
    { title: "操作", fixed: "right", width: 130, render: (_, record) => <Button type="primary" ghost icon={<SafetyCertificateOutlined />} onClick={() => navigate(`/risk-review/${record.id}`)}>开始审批</Button> },
  ];

  return (
    <PageContainer title="风控审批" description={`当前有 ${data.length} 笔申请等待风险复核`}>
      <div className="table-panel">
        <Table<LoanApplication> rowKey="id" loading={loading} dataSource={data} columns={columns} scroll={{ x: 1050 }} pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }} />
      </div>
    </PageContainer>
  );
}
