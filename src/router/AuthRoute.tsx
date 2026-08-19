import type { ReactNode } from "react";
import { Spin } from "antd";
import { Navigate, useLocation } from "react-router-dom";
import { useUserStore } from "../store/userStore";
import type { PermissionCode } from "../types/user";

interface AuthRouteProps {
  children: ReactNode;
  permission?: PermissionCode;
}

//统一路由守卫：先等待登录态恢复，再检查登录状态和页面权限
export function AuthRoute({ children, permission }: AuthRouteProps) {
  const token = useUserStore((state) => state.token);
  const initialized = useUserStore((state) => state.initialized);
  const permissions = useUserStore((state) => state.permissions);
  const location = useLocation();

  if (!initialized) {
    return (
      <div className="route-loading">
        <Spin size="large" tip="正在恢复登录状态" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (permission && !permissions.includes(permission)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}

//访客守卫：已登录用户再次访问登录页时直接回到Dashboard
export function GuestRoute({ children }: { children: ReactNode }) {
  const token = useUserStore((state) => state.token);
  const initialized = useUserStore((state) => state.initialized);

  if (!initialized) {
    return (
      <div className="route-loading">
        <Spin size="large" />
      </div>
    );
  }

  return token ? <Navigate to="/dashboard" replace /> : children;
}
