import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

export default function Forbidden() {
  const navigate = useNavigate();
  return (
    <div className="result-page">
      <Result status="403" title="访问受限" subTitle="当前角色没有访问该页面的权限" extra={<Button type="primary" onClick={() => navigate("/dashboard")}>返回工作台</Button>} />
    </div>
  );
}
