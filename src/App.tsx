import { useEffect } from "react";
import { App as AntdApp, ConfigProvider, theme } from "antd";
import zhCN from "antd/locale/zh_CN";
import { HashRouter } from "react-router-dom";
import AppErrorBoundary from "./components/AppErrorBoundary";
import { AppRoutes } from "./router/routes";
import { useAppStore } from "./store/appStore";
import "./App.css";

//应用根组件：统一注入Ant Design主题、中文语言包和前端路由
function App() {
  const themeMode = useAppStore((state) => state.themeMode);

  useEffect(() => {
    document.documentElement.dataset.theme = themeMode;
  }, [themeMode]);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm:
          themeMode === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: "#16776a",
          colorInfo: "#16776a",
          colorSuccess: "#2f855a",
          colorWarning: "#b7791f",
          colorError: "#c2413b",
          borderRadius: 6,
          fontFamily:
            'Inter, "PingFang SC", "Microsoft YaHei", system-ui, sans-serif',
        },
        components: {
          Layout: {
            bodyBg: themeMode === "dark" ? "#111827" : "#f3f5f7",
            headerBg: themeMode === "dark" ? "#141c27" : "#ffffff",
            siderBg: "#132b2a",
          },
          Menu: {
            darkItemBg: "#132b2a",
            darkItemSelectedBg: "#1d5d55",
            darkSubMenuItemBg: "#102423",
          },
        },
      }}
    >
      <AntdApp>
        <AppErrorBoundary>
          <HashRouter>
            <AppRoutes />
          </HashRouter>
        </AppErrorBoundary>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
