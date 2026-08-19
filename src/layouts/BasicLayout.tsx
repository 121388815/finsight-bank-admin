import { useEffect, useMemo, useState } from "react";
import {
  AuditOutlined,
  BankOutlined,
  BellOutlined,
  DashboardOutlined,
  FileSearchOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  SunOutlined,
  TeamOutlined,
  UserOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Badge,
  Breadcrumb,
  Button,
  Drawer,
  Dropdown,
  Layout,
  Menu,
  Space,
  Tooltip,
  Typography,
  type MenuProps,
} from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/appStore";
import {
  type AppMenuItem,
  usePermissionStore,
} from "../store/permissionStore";
import { useUserStore } from "../store/userStore";
import { ROLE_LABELS } from "../types/user";

const { Header, Sider, Content } = Layout;

const menuIcons: Record<string, React.ReactNode> = {
  dashboard: <DashboardOutlined />,
  customers: <TeamOutlined />,
  loans: <FileSearchOutlined />,
  "risk-review": <SafetyCertificateOutlined />,
  "operation-logs": <AuditOutlined />,
  system: <SettingOutlined />,
  "system-users": <UserOutlined />,
  "system-roles": <SafetyCertificateOutlined />,
};

const routeTitles: { pattern: RegExp; title: string; parent?: string }[] = [
  { pattern: /^\/dashboard$/, title: "数据看板" },
  { pattern: /^\/customers$/, title: "客户管理" },
  { pattern: /^\/customers\/\d+$/, title: "客户详情", parent: "客户管理" },
  { pattern: /^\/loans$/, title: "贷款申请" },
  { pattern: /^\/loans\/\d+$/, title: "申请详情", parent: "贷款申请" },
  { pattern: /^\/risk-review$/, title: "风控审批" },
  { pattern: /^\/risk-review\/\d+$/, title: "审批工作台", parent: "风控审批" },
  { pattern: /^\/operation-logs$/, title: "操作日志" },
  { pattern: /^\/system\/users$/, title: "用户管理", parent: "系统管理" },
  { pattern: /^\/system\/roles$/, title: "角色管理", parent: "系统管理" },
  { pattern: /^\/403$/, title: "访问受限" },
];

function toMenuItems(menus: AppMenuItem[]): MenuProps["items"] {
  return menus.map((menu) => ({
    key: menu.path,
    icon: menuIcons[menu.key],
    label: menu.label,
    children: menu.children ? toMenuItems(menu.children) : undefined,
  }));
}

function findSelectedPath(menus: AppMenuItem[], pathname: string): string {
  const flat = menus.flatMap((menu) => [menu, ...(menu.children ?? [])]);
  const match = flat
    .filter((menu) => pathname === menu.path || pathname.startsWith(`${menu.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];

  return match?.path ?? pathname;
}

export default function BasicLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const collapsed = useAppStore((state) => state.collapsed);
  const themeMode = useAppStore((state) => state.themeMode);
  const toggleCollapsed = useAppStore((state) => state.toggleCollapsed);
  const setThemeMode = useAppStore((state) => state.setThemeMode);
  const user = useUserStore((state) => state.user);
  const permissions = useUserStore((state) => state.permissions);
  const logout = useUserStore((state) => state.logout);
  const getAccessibleMenus = usePermissionStore(
    (state) => state.getAccessibleMenus,
  );

  const accessibleMenus = useMemo(
    () => getAccessibleMenus(permissions),
    [getAccessibleMenus, permissions],
  );
  const menuItems = useMemo(() => toMenuItems(accessibleMenus), [accessibleMenus]);
  const selectedPath = findSelectedPath(accessibleMenus, location.pathname);
  const currentRoute = routeTitles.find((item) => item.pattern.test(location.pathname));

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  const handleMenuClick: MenuProps["onClick"] = ({ key }) => {
    setMobileOpen(false);
    navigate(key);
  };
  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const userMenu: MenuProps["items"] = [
    { key: "profile", label: user?.department ?? "当前用户", disabled: true },
    { type: "divider" },
    { key: "logout", icon: <LogoutOutlined />, label: "退出登录", danger: true },
  ];

  const sidebar = (
    <>
      <div className="brand" data-collapsed={!isMobile && collapsed}>
        <span className="brand-mark"><BankOutlined /></span>
        {(isMobile || !collapsed) && (
          <span className="brand-name"><strong>FinSight</strong><small>信贷风控运营平台</small></span>
        )}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        items={menuItems}
        selectedKeys={[selectedPath]}
        defaultOpenKeys={["/system"]}
        onClick={handleMenuClick}
        className="app-menu"
      />
    </>
  );

  return (
    <Layout className="app-shell">
      {!isMobile && (
        <Sider
          width={224}
          collapsedWidth={72}
          collapsed={collapsed}
          trigger={null}
          className="app-sider"
        >
          {sidebar}
        </Sider>
      )}

      <Drawer
        placement="left"
        size={260}
        open={isMobile && mobileOpen}
        onClose={() => setMobileOpen(false)}
        styles={{ body: { padding: 0, background: "#132b2a" }, header: { display: "none" } }}
      >
        {sidebar}
      </Drawer>

      <Layout className="main-layout">
        <Header className="app-header">
          <div className="header-left">
            <Tooltip title={isMobile ? "打开菜单" : collapsed ? "展开菜单" : "收起菜单"}>
              <Button
                type="text"
                icon={isMobile || collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => isMobile ? setMobileOpen(true) : toggleCollapsed()}
                aria-label="切换导航菜单"
              />
            </Tooltip>
            <Breadcrumb
              items={[
                { title: currentRoute?.parent ?? "工作台" },
                ...(currentRoute?.parent ? [{ title: currentRoute.title }] : []),
              ]}
            />
          </div>

          <Space size={6}>
            <Tooltip title={themeMode === "dark" ? "切换亮色主题" : "切换暗色主题"}>
              <Button
                type="text"
                icon={themeMode === "dark" ? <SunOutlined /> : <MoonOutlined />}
                onClick={() => setThemeMode(themeMode === "dark" ? "light" : "dark")}
                aria-label="切换主题"
              />
            </Tooltip>
            <Tooltip title="通知">
              <Badge dot offset={[-5, 6]}>
                <Button type="text" icon={<BellOutlined />} aria-label="通知" />
              </Badge>
            </Tooltip>
            <Dropdown
              menu={{
                items: userMenu,
                onClick: ({ key }) => key === "logout" && void handleLogout(),
              }}
              placement="bottomRight"
            >
              <button type="button" className="user-menu-trigger">
                <Avatar size={32} icon={<UserOutlined />} />
                {!isMobile && (
                  <span>
                    <Typography.Text strong>{user?.nickname}</Typography.Text>
                    <small>{user ? ROLE_LABELS[user.role] : ""}</small>
                  </span>
                )}
              </button>
            </Dropdown>
          </Space>
        </Header>

        <Content className="app-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
