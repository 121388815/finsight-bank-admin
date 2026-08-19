import { lazy, Suspense } from "react";
import { Spin } from "antd";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthRoute, GuestRoute } from "./AuthRoute";

const BasicLayout = lazy(() => import("../layouts/BasicLayout"));
const Login = lazy(() => import("../pages/Login"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const CustomerList = lazy(() => import("../pages/Customer"));
const CustomerDetail = lazy(() => import("../pages/Customer/Detail"));
const LoanList = lazy(() => import("../pages/Loan"));
const LoanDetail = lazy(() => import("../pages/Loan/Detail"));
const RiskReview = lazy(() => import("../pages/RiskReview"));
const RiskReviewDetail = lazy(() => import("../pages/RiskReview/Detail"));
const OperationLog = lazy(() => import("../pages/OperationLog"));
const SystemUsers = lazy(() => import("../pages/System/Users"));
const SystemRoles = lazy(() => import("../pages/System/Roles"));
const Forbidden = lazy(() => import("../pages/Forbidden"));
const NotFound = lazy(() => import("../pages/NotFound"));

function RouteFallback() {
  return (
    <div className="route-loading">
      <Spin size="large" />
    </div>
  );
}

//应用路由表：页面按路由级懒加载，业务页面统一经过登录和权限守卫
export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route element={<AuthRoute><BasicLayout /></AuthRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<AuthRoute permission="dashboard:view"><Dashboard /></AuthRoute>} />
          <Route path="/customers" element={<AuthRoute permission="customer:view"><CustomerList /></AuthRoute>} />
          <Route path="/customers/:id" element={<AuthRoute permission="customer:view"><CustomerDetail /></AuthRoute>} />
          <Route path="/loans" element={<AuthRoute permission="loan:view"><LoanList /></AuthRoute>} />
          <Route path="/loans/:id" element={<AuthRoute permission="loan:view"><LoanDetail /></AuthRoute>} />
          <Route path="/risk-review" element={<AuthRoute permission="risk:view"><RiskReview /></AuthRoute>} />
          <Route path="/risk-review/:id" element={<AuthRoute permission="risk:view"><RiskReviewDetail /></AuthRoute>} />
          <Route path="/operation-logs" element={<AuthRoute permission="log:view"><OperationLog /></AuthRoute>} />
          <Route path="/system/users" element={<AuthRoute permission="system:user"><SystemUsers /></AuthRoute>} />
          <Route path="/system/roles" element={<AuthRoute permission="system:role"><SystemRoles /></AuthRoute>} />
          <Route path="/403" element={<Forbidden />} />
        </Route>
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
