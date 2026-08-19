import { useCallback, useEffect, useMemo, useState } from "react";
import { ReloadOutlined } from "@ant-design/icons";
import { App, Button, Input, Table, Tag, type TableProps } from "antd";
import { unwrapResponse } from "../../api/request";
import { getSystemUsers } from "../../api/system";
import PageContainer from "../../components/PageContainer";
import StatusTag from "../../components/StatusTag";
import { ROLE_LABELS, type User } from "../../types/user";

export default function SystemUsers() {
  const { message } = App.useApp();
  const [data, setData] = useState<User[]>([]);
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      setData(unwrapResponse(await getSystemUsers()));
    } catch (error) {
      void message.error(error instanceof Error ? error.message : "用户加载失败");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => { void loadData(); }, [loadData]);

  const filtered = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    return query
      ? data.filter((user) => [user.username, user.nickname, user.department].some((value) => value.toLowerCase().includes(query)))
      : data;
  }, [data, keyword]);

  const columns: TableProps<User>["columns"] = [
    { title: "用户ID", dataIndex: "id", width: 90 },
    { title: "登录账号", dataIndex: "username", width: 130 },
    { title: "用户姓名", dataIndex: "nickname", width: 120 },
    { title: "角色", dataIndex: "role", width: 120, render: (value: User["role"]) => <Tag color="blue">{ROLE_LABELS[value]}</Tag> },
    { title: "所属部门", dataIndex: "department", width: 190 },
    { title: "权限数量", dataIndex: "permissions", width: 100, render: (value: User["permissions"]) => `${value.length} 项` },
    { title: "账号状态", dataIndex: "enabled", width: 100, render: (value: boolean) => <StatusTag status={value ? "enabled" : "disabled"} /> },
    { title: "最后登录", dataIndex: "lastLoginAt", width: 170, render: (value?: string) => value ?? "从未登录" },
  ];

  return (
    <PageContainer title="用户管理" description="内部用户、所属部门与角色分配概览" extra={<Button icon={<ReloadOutlined />} onClick={() => void loadData()}>刷新</Button>}>
      <div className="single-filter"><Input.Search allowClear value={keyword} placeholder="搜索账号、姓名或部门" onChange={(event) => setKeyword(event.target.value)} /></div>
      <div className="table-panel"><Table<User> rowKey="id" loading={loading} dataSource={filtered} columns={columns} scroll={{ x: 1050 }} pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 位用户` }} /></div>
    </PageContainer>
  );
}
