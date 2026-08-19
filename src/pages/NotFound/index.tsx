import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "../../store/userStore";

export default function NotFound() {
  const navigate = useNavigate();
  const token = useUserStore((state) => state.token);
  return (
    <div className="result-page standalone-result">
      <Result status="404" title="页面不存在" subTitle="请求的页面可能已移动或地址有误" extra={<Button type="primary" onClick={() => navigate(token ? "/dashboard" : "/login")}>返回{token ? "工作台" : "登录页"}</Button>} />
    </div>
  );
}
