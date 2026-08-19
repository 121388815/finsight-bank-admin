import { useCallback, useEffect, useMemo, useState } from "react";
import { FileAddOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import {
  App,
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Space,
  Table,
  type TableProps,
} from "antd";
import { useNavigate } from "react-router-dom";
import { getCustomers } from "../../api/customer";
import {
  createLoanApplication,
  getLoanApplications,
  type CreateLoanPayload,
} from "../../api/loan";
import { unwrapResponse } from "../../api/request";
import PageContainer from "../../components/PageContainer";
import Permission from "../../components/Permission";
import RiskScore from "../../components/RiskScore";
import SearchForm from "../../components/SearchForm";
import StatusTag from "../../components/StatusTag";
import type { Customer } from "../../types/customer";
import type { LoanApplication, LoanProductType, LoanStatus } from "../../types/loan";

interface LoanFilters {
  keyword?: string;
  productType?: LoanProductType;
  status?: LoanStatus;
}

const productOptions: LoanProductType[] = ["消费贷", "经营贷", "房贷", "车贷"];
const statusOptions = [
  { value: "pending", label: "待处理" },
  { value: "risk_review", label: "风控审核中" },
  { value: "approved", label: "审批通过" },
  { value: "rejected", label: "已拒绝" },
  { value: "released", label: "已放贷" },
];

export default function LoanList() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateLoanPayload>();
  const [draft, setDraft] = useState<LoanFilters>({});
  const [filters, setFilters] = useState<LoanFilters>({});
  const [data, setData] = useState<LoanApplication[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = unwrapResponse(await getLoanApplications({ page, pageSize, ...filters }));
      setData(result.list);
      setTotal(result.total);
    } catch (error) {
      void message.error(error instanceof Error ? error.message : "贷款数据加载失败");
    } finally {
      setLoading(false);
    }
  }, [filters, message, page, pageSize]);

  useEffect(() => { void loadData(); }, [loadData]);

  useEffect(() => {
    getCustomers({ page: 1, pageSize: 100 }).then(unwrapResponse).then((result) => setCustomers(result.list)).catch(() => setCustomers([]));
  }, []);

  const columns = useMemo<TableProps<LoanApplication>["columns"]>(() => [
    { title: "申请编号", dataIndex: "id", width: 110 },
    { title: "客户姓名", dataIndex: "customerName", width: 100, fixed: "left" },
    { title: "贷款产品", dataIndex: "productType", width: 110 },
    { title: "申请金额", dataIndex: "amount", width: 130, render: (value: number) => <strong>¥{value.toLocaleString()}</strong> },
    { title: "期限", dataIndex: "term", width: 90, render: (value: number) => `${value}个月` },
    { title: "用途", dataIndex: "purpose", width: 150 },
    { title: "风险评分", dataIndex: "riskScore", width: 160, render: (value: number) => <RiskScore score={value} compact /> },
    { title: "申请状态", dataIndex: "status", width: 120, render: (value: LoanStatus) => <StatusTag status={value} /> },
    { title: "提交时间", dataIndex: "submitTime", width: 165 },
    { title: "审批人", dataIndex: "reviewer", width: 100, render: (value?: string) => value ?? "-" },
    {
      title: "操作",
      key: "action",
      width: 170,
      fixed: "right",
      render: (_, record) => (
        <Space size={0}>
          <Button type="link" onClick={() => navigate(`/loans/${record.id}`)}>详情</Button>
          {["pending", "risk_review"].includes(record.status) ? (
            <Permission code="risk:view"><Button type="link" icon={<SafetyCertificateOutlined />} onClick={() => navigate(`/risk-review/${record.id}`)}>风控</Button></Permission>
          ) : null}
        </Space>
      ),
    },
  ], [navigate]);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      const loan = unwrapResponse(await createLoanApplication(values));
      void message.success(`申请 ${loan.id} 创建成功`);
      setModalOpen(false);
      form.resetFields();
      setPage(1);
      await loadData();
    } catch (error) {
      if (error instanceof Error) void message.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageContainer
      title="贷款申请"
      description={`共 ${total} 笔申请，覆盖申请录入、风险审核和审批流转`}
      extra={<Permission code="loan:create"><Button type="primary" icon={<FileAddOutlined />} onClick={() => setModalOpen(true)}>新建申请</Button></Permission>}
    >
      <SearchForm loading={loading} onSearch={() => { setPage(1); setFilters(draft); }} onReset={() => { setDraft({}); setFilters({}); setPage(1); }}>
        <Input allowClear value={draft.keyword} placeholder="客户姓名 / 贷款用途" onChange={(event) => setDraft((value) => ({ ...value, keyword: event.target.value }))} onPressEnter={() => { setPage(1); setFilters(draft); }} />
        <Select allowClear value={draft.productType} placeholder="贷款产品" options={productOptions.map((value) => ({ value, label: value }))} onChange={(productType) => setDraft((value) => ({ ...value, productType }))} />
        <Select allowClear value={draft.status} placeholder="申请状态" options={statusOptions} onChange={(status) => setDraft((value) => ({ ...value, status }))} />
      </SearchForm>

      <div className="table-panel">
        <Table<LoanApplication>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          scroll={{ x: 1350 }}
          pagination={{ current: page, pageSize, total, showSizeChanger: true, showTotal: (value) => `共 ${value} 条`, onChange: (nextPage, nextSize) => { setPage(nextPage); setPageSize(nextSize); } }}
        />
      </div>

      <Modal title="新建贷款申请" open={modalOpen} confirmLoading={saving} onOk={() => void handleCreate()} onCancel={() => { setModalOpen(false); form.resetFields(); }} width={640} okText="提交申请">
        <Form form={form} layout="vertical" className="two-column-form" initialValues={{ productType: "消费贷", term: 24 }}>
          <Form.Item name="customerId" label="申请客户" rules={[{ required: true, message: "请选择客户" }]} className="form-span-2">
            <Select showSearch optionFilterProp="label" placeholder="选择已建档客户" options={customers.map((customer) => ({ value: customer.id, label: `${customer.name} · ${customer.phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2")}` }))} />
          </Form.Item>
          <Form.Item name="productType" label="贷款产品" rules={[{ required: true }]}><Select options={productOptions.map((value) => ({ value, label: value }))} /></Form.Item>
          <Form.Item name="amount" label="申请金额（元）" rules={[{ required: true, message: "请输入申请金额" }]}><InputNumber min={10000} max={5000000} step={10000} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="term" label="贷款期限（月）" rules={[{ required: true, message: "请输入期限" }]}><InputNumber min={3} max={360} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="purpose" label="贷款用途" rules={[{ required: true, message: "请输入贷款用途" }]}><Input /></Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}
