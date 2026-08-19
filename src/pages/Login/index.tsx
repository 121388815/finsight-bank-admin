import { BankOutlined, LockOutlined, UserOutlined } from "@ant-design/icons";
import { App, Button, Form, Input, Typography } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import { ApiError } from "../../api/request";
import { useUserStore } from "../../store/userStore";
import type { LoginPayload } from "../../types/user";

interface LoginLocationState {
  from?: string;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { message } = App.useApp();
  const login = useUserStore((state) => state.login);
  const loading = useUserStore((state) => state.loading);

  const handleSubmit = async (values: LoginPayload) => {
    try {
      await login(values);
      void message.success("登录成功");
      const state = location.state as LoginLocationState | null;
      navigate(state?.from ?? "/dashboard", { replace: true });
    } catch (error) {
      void message.error(error instanceof ApiError ? error.message : "登录失败，请稍后重试");
    }
  };

  return (
      <main className="login-page">
        <section className="login-brand-panel">
          <div className="login-brand">
            <span className="login-brand-mark"><BankOutlined /></span>
            <div><strong>FinSight Bank</strong><span>信贷风控运营平台</span></div>
          </div>
          <div className="login-signal">
            <p>今日待处理</p>
            <strong>18</strong>
            <span>笔信贷申请等待复核</span>
          </div>
          <div className="login-stats">
            <div><strong>99.96%</strong><span>系统可用性</span></div>
            <div><strong>2.4h</strong><span>平均审批时效</span></div>
            <div><strong>0.32%</strong><span>风险预警率</span></div>
          </div>
        </section>

        <section className="login-form-panel">
          <div className="login-form-wrap">
            <div className="login-form-heading">
              <Typography.Title level={2}>欢迎回来</Typography.Title>
              <Typography.Text type="secondary">登录运营工作台</Typography.Text>
            </div>
            <Form<LoginPayload>
              layout="vertical"
              size="large"
              initialValues={{ username: "admin", password: "123456" }}
              onFinish={handleSubmit}
              requiredMark={false}
            >
              <Form.Item
                label="账号"
                name="username"
                rules={[{ required: true, message: "请输入账号" }]}
              >
                <Input prefix={<UserOutlined />} placeholder="请输入账号" autoComplete="username" />
              </Form.Item>
              <Form.Item
                label="密码"
                name="password"
                rules={[{ required: true, message: "请输入密码" }]}
              >
                <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" autoComplete="current-password" />
              </Form.Item>
              <Button type="primary" htmlType="submit" block loading={loading}>
                登录
              </Button>
            </Form>
            <div className="login-footer">FinSight Bank · 内部运营系统</div>
          </div>
        </section>
      </main>
  );
}
