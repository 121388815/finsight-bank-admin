import { useCallback, useEffect, useMemo, useState } from "react";
import { EyeOutlined, PlusOutlined } from "@ant-design/icons";
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
  Tag,
  type TableProps,
} from "antd";
import { useNavigate } from "react-router-dom";
import {
  createCustomer,
  getCustomers,
  type CreateCustomerPayload,
} from "../../api/customer";
import { unwrapResponse } from "../../api/request";
import PageContainer from "../../components/PageContainer";
import Permission from "../../components/Permission";
import SearchForm from "../../components/SearchForm";
import StatusTag from "../../components/StatusTag";
import type { CreditLevel, Customer, CustomerStatus } from "../../types/customer";

interface CustomerFilters {
  keyword?: string;
  creditLevel?: CreditLevel;
  status?: CustomerStatus;
}

const maskPhone = (phone: string) => phone.replace(/(\d{3})\d{4}(\d{4})/, "$1****$2");
const maskIdCard = (idCard: string) => `${idCard.slice(0, 6)}********${idCard.slice(-4)}`;

export default function CustomerList() {
  const navigate = useNavigate();
  const { message } = App.useApp();
  const [form] = Form.useForm<CreateCustomerPayload>();
  const [draft, setDraft] = useState<CustomerFilters>({});
  const [filters, setFilters] = useState<CustomerFilters>({});
  const [data, setData] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = unwrapResponse(await getCustomers({ page, pageSize, ...filters }));
      setData(result.list);
      setTotal(result.total);
    } catch (error) {
      void message.error(error instanceof Error ? error.message : "客户数据加载失败");
    } finally {
      setLoading(false);
    }
  }, [filters, message, page, pageSize]);

  useEffect(() => { void loadData(); }, [loadData]);

  const columns = useMemo<TableProps<Customer>["columns"]>(() => [
    { title: "客户编号", dataIndex: "id", width: 110 },
    { title: "客户姓名", dataIndex: "name", width: 100, fixed: "left" },
    { title: "手机号码", dataIndex: "phone", width: 140, render: maskPhone },
    { title: "身份证号", dataIndex: "idCard", width: 180, render: maskIdCard },
    { title: "职业", dataIndex: "job", width: 160 },
    { title: "月收入", dataIndex: "monthlyIncome", width: 120, render: (value: number) => `¥${value.toLocaleString()}` },
    { title: "信用等级", dataIndex: "creditLevel", width: 100, render: (value: CreditLevel) => <Tag color={value === "A" ? "green" : value === "B" ? "blue" : value === "C" ? "gold" : "red"}>{value}</Tag> },
    { title: "风险标签", dataIndex: "riskTags", width: 190, render: (tags: string[]) => <Space size={[0, 4]} wrap>{tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}</Space> },
    { title: "客户状态", dataIndex: "status", width: 110, render: (status: CustomerStatus) => <StatusTag status={status} /> },
    { title: "所属网点", dataIndex: "branch", width: 150 },
    { title: "客户经理", dataIndex: "accountManager", width: 100 },
    { title: "操作", key: "action", width: 90, fixed: "right", render: (_, record) => <Button type="link" icon={<EyeOutlined />} onClick={() => navigate(`/customers/${record.id}`)}>详情</Button> },
  ], [navigate]);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      unwrapResponse(await createCustomer(values));
      void message.success("客户创建成功");
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
      title="客户管理"
      description={`共 ${total} 位客户，敏感信息已脱敏展示`}
      extra={<Permission code="customer:create"><Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新增客户</Button></Permission>}
    >
      <SearchForm
        loading={loading}
        onSearch={() => { setPage(1); setFilters(draft); }}
        onReset={() => { setDraft({}); setFilters({}); setPage(1); }}
      >
        <Input allowClear value={draft.keyword} placeholder="姓名 / 手机 / 证件号" onChange={(event) => setDraft((value) => ({ ...value, keyword: event.target.value }))} onPressEnter={() => { setPage(1); setFilters(draft); }} />
        <Select allowClear value={draft.creditLevel} placeholder="信用等级" options={["A", "B", "C", "D"].map((value) => ({ value, label: `${value} 级` }))} onChange={(creditLevel) => setDraft((value) => ({ ...value, creditLevel }))} />
        <Select allowClear value={draft.status} placeholder="客户状态" options={[{ value: "normal", label: "正常" }, { value: "watch", label: "重点关注" }, { value: "frozen", label: "已冻结" }]} onChange={(status) => setDraft((value) => ({ ...value, status }))} />
      </SearchForm>

      <div className="table-panel">
        <Table<Customer>
          rowKey="id"
          loading={loading}
          columns={columns}
          dataSource={data}
          scroll={{ x: 1500 }}
          pagination={{ current: page, pageSize, total, showSizeChanger: true, showTotal: (value) => `共 ${value} 条`, onChange: (nextPage, nextSize) => { setPage(nextPage); setPageSize(nextSize); } }}
        />
      </div>

      <Modal title="新增客户" open={modalOpen} confirmLoading={saving} onOk={() => void handleCreate()} onCancel={() => { setModalOpen(false); form.resetFields(); }} width={720} okText="创建客户">
        <Form form={form} layout="vertical" className="two-column-form" initialValues={{ creditLevel: "B", status: "normal", riskTags: [] }}>
          <Form.Item name="name" label="客户姓名" rules={[{ required: true, message: "请输入客户姓名" }]}><Input /></Form.Item>
          <Form.Item name="phone" label="手机号码" rules={[{ required: true, pattern: /^1\d{10}$/, message: "请输入有效手机号码" }]}><Input maxLength={11} /></Form.Item>
          <Form.Item name="idCard" label="身份证号" rules={[{ required: true, pattern: /^\d{17}[\dXx]$/, message: "请输入有效身份证号" }]}><Input maxLength={18} /></Form.Item>
          <Form.Item name="age" label="年龄" rules={[{ required: true, message: "请输入年龄" }]}><InputNumber min={18} max={70} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="job" label="职业" rules={[{ required: true, message: "请输入职业" }]}><Input /></Form.Item>
          <Form.Item name="monthlyIncome" label="月收入（元）" rules={[{ required: true, message: "请输入月收入" }]}><InputNumber min={0} step={1000} style={{ width: "100%" }} /></Form.Item>
          <Form.Item name="creditLevel" label="信用等级"><Select options={["A", "B", "C", "D"].map((value) => ({ value, label: `${value} 级` }))} /></Form.Item>
          <Form.Item name="status" label="客户状态"><Select options={[{ value: "normal", label: "正常" }, { value: "watch", label: "重点关注" }, { value: "frozen", label: "已冻结" }]} /></Form.Item>
          <Form.Item name="branch" label="所属网点" rules={[{ required: true, message: "请输入所属网点" }]}><Input /></Form.Item>
          <Form.Item name="accountManager" label="客户经理" rules={[{ required: true, message: "请输入客户经理" }]}><Input /></Form.Item>
          <Form.Item name="riskTags" label="风险标签" className="form-span-2"><Select mode="tags" placeholder="输入后回车添加标签" /></Form.Item>
        </Form>
      </Modal>
    </PageContainer>
  );
}
