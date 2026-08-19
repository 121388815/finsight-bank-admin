import type { ReactNode } from "react";
import { FilterOutlined, ReloadOutlined } from "@ant-design/icons";
import { Button, Space } from "antd";

interface SearchFormProps {
  children: ReactNode;
  onSearch: () => void;
  onReset: () => void;
  loading?: boolean;
}

//列表页统一筛选区，保留一致的查询和重置操作位置
export default function SearchForm({ children, onSearch, onReset, loading }: SearchFormProps) {
  return (
    <div className="search-panel">
      <div className="search-fields">{children}</div>
      <Space className="search-actions">
        <Button icon={<ReloadOutlined />} onClick={onReset}>重置</Button>
        <Button type="primary" icon={<FilterOutlined />} loading={loading} onClick={onSearch}>查询</Button>
      </Space>
    </div>
  );
}
