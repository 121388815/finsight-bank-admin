import type { ReactNode } from "react";
import { useUserStore } from "../../store/userStore";
import type { PermissionCode } from "../../types/user";

interface PermissionProps {
  code: PermissionCode | PermissionCode[];
  children: ReactNode;
  fallback?: ReactNode;
  mode?: "every" | "some";
}

//按钮级权限组件：权限满足时渲染children，否则隐藏或显示fallback
export default function Permission({ code, children, fallback = null, mode = "every" }: PermissionProps) {
  const permissions = useUserStore((state) => state.permissions);
  const codes = Array.isArray(code) ? code : [code];
  const allowed = mode === "some"
    ? codes.some((item) => permissions.includes(item))
    : codes.every((item) => permissions.includes(item));

  return allowed ? children : fallback;
}
