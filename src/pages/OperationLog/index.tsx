import { useCallback, useEffect, useMemo, useState } from "react";
import { DownloadOutlined } from "@ant-design/icons";
import { App, Button, Input, Select, Table, type TableProps } from "antd";
import { getOperationLogs } from "../../api/log";
import { unwrapResponse } from "../../api/request";
import PageContainer from "../../components/PageContainer";
import Permission from "../../components/Permission";
import SearchForm from "../../components/SearchForm";
import StatusTag from "../../components/StatusTag";
import type { OperationLog, OperationModule, OperationResult } from "../../types/log";

interface LogFilters {
  keyword?: string;
  module?: OperationModule;
  result?: OperationResult;
}

const moduleLabels: Record<OperationModule, string> = {
  auth: "认证授权",
  customer: "客户管理",
  loan: "贷款业务",
  risk: "风控管理",
  system: "系统管理",
  log: "日志管理",
};

export default function OperationLogPage() {
  const { message } = App.useApp();
  const [draft, setDraft] = useState<LogFilters>({});
  const [filters, setFilters] = useState<LogFilters>({});
  const [data, setData] = useState<OperationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = unwrapResponse(await getOperationLogs({ page, pageSize, ...filters }));
      setData(result.list);
      setTotal(result.total);
    } catch (error) {
      void message.error(error instanceof Error ? error.message : "日志加载失败");
    } finally {
      setLoading(false);
    }
  }, [filters, message, page, pageSize]);

  useEffect(() => { void loadData(); }, [loadData]);

  const columns = useMemo<TableProps<OperationLog>["columns"]>(() => [
    { title: "日志编号", dataIndex: "id", width: 110 },
    { title: "操作时间", dataIndex: "createdAt", width: 165 },
    { title: "操作人", dataIndex: "operatorName", width: 110 },
    { title: "业务模块", dataIndex: "module", width: 110, render: (value: OperationModule) => moduleLabels[value] },
    { title: "操作动作", dataIndex: "action", width: 190 },
    { title: "操作对象", dataIndex: "targetName", width: 150, render: (value?: string) => value ?? "-" },
    { title: "执行结果", dataIndex: "result", width: 100, render: (value: OperationResult) => <StatusTag status={value} /> },
    { title: "来源IP", dataIndex: "ip", width: 120 },
    { title: "备注", dataIndex: "remark", width: 220, render: (value?: string) => value ?? "-" },
  ], []);

  const handleExport = async () => {
    try {
      const result = unwrapResponse(await getOperationLogs({ page: 1, pageSize: 1000, ...filters }));
      const header = ["日志编号", "操作时间", "操作人", "业务模块", "操作动作", "操作对象", "执行结果", "来源IP", "备注"];
      const rows = result.list.map((log) => [log.id, log.createdAt, log.operatorName, moduleLabels[log.module], log.action, log.targetName ?? "", log.result === "success" ? "成功" : "失败", log.ip, log.remark ?? ""]);
      const csv = [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
      const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `operation-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
      void message.success(`已导出 ${rows.length} 条日志`);
    } catch (error) {
      void message.error(error instanceof Error ? error.message : "导出失败");
    }
  };

  return (
    <PageContainer title="操作日志" description="关键业务操作与权限行为审计留痕" extra={<Permission code="log:export"><Button icon={<DownloadOutlined />} onClick={() => void handleExport()}>导出日志</Button></Permission>}>
      <SearchForm loading={loading} onSearch={() => { setPage(1); setFilters(draft); }} onReset={() => { setDraft({}); setFilters({}); setPage(1); }}>
        <Input allowClear value={draft.keyword} placeholder="操作人 / 动作 / 对象" onChange={(event) => setDraft((value) => ({ ...value, keyword: event.target.value }))} />
        <Select allowClear value={draft.module} placeholder="业务模块" options={(Object.keys(moduleLabels) as OperationModule[]).map((value) => ({ value, label: moduleLabels[value] }))} onChange={(module) => setDraft((value) => ({ ...value, module }))} />
        <Select allowClear value={draft.result} placeholder="执行结果" options={[{ value: "success", label: "成功" }, { value: "failed", label: "失败" }]} onChange={(result) => setDraft((value) => ({ ...value, result }))} />
      </SearchForm>
      <div className="table-panel">
        <Table<OperationLog> rowKey="id" loading={loading} dataSource={data} columns={columns} scroll={{ x: 1280 }} pagination={{ current: page, pageSize, total, showSizeChanger: true, showTotal: (value) => `共 ${value} 条`, onChange: (nextPage, nextSize) => { setPage(nextPage); setPageSize(nextSize); } }} />
      </div>
    </PageContainer>
  );
}
