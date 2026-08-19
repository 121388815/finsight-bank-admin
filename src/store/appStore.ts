import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

//主题模式，先保留亮色和暗色两种，后续可接Ant Design ConfigProvider
export type ThemeMode = "light" | "dark";

//应用级UI状态，不放业务数据，只放布局和视觉偏好
interface AppState {
  //左侧菜单是否折叠
  collapsed: boolean;
  //当前主题模式
  themeMode: ThemeMode;
  //页面级loading，后续路由切换或全局请求可使用
  pageLoading: boolean;
  //显式设置菜单折叠状态
  setCollapsed: (collapsed: boolean) => void;
  //切换菜单折叠状态
  toggleCollapsed: () => void;
  //设置主题模式
  setThemeMode: (themeMode: ThemeMode) => void;
  //设置页面级loading
  setPageLoading: (pageLoading: boolean) => void;
  //恢复应用UI默认状态
  resetAppState: () => void;
}

//应用UI默认状态，resetAppState 和初始化都会复用
const defaultAppState: Pick<
  AppState,
  "collapsed" | "themeMode" | "pageLoading"
> = {
  collapsed: false,
  themeMode: "light",
  pageLoading: false,
};

//应用Store：管理布局折叠、主题、页面loading等非业务状态
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...defaultAppState,

      setCollapsed(collapsed) {
        //用于侧边栏按钮直接设置折叠或展开
        set({ collapsed });
      },

      toggleCollapsed() {
        //用于顶部菜单按钮在展开/折叠之间切换
        set({ collapsed: !get().collapsed });
      },

      setThemeMode(themeMode) {
        //后续切换主题时同步更新这里
        set({ themeMode });
      },

      setPageLoading(pageLoading) {
        //页面切换或全局异步动作时可展示加载状态
        set({ pageLoading });
      },

      resetAppState() {
        //恢复布局默认值，退出登录或切换用户时可以调用
        set(defaultAppState);
      },
    }),
    {
      //localStorage中的key，保存用户的界面偏好
      name: "finsight-bank-app",
      //界面偏好适合持久化到localStorage
      storage: createJSONStorage(() => localStorage),
      //只持久化用户偏好，不持久化 pageLoading 这种临时状态
      partialize: (state) => ({
        collapsed: state.collapsed,
        themeMode: state.themeMode,
      }),
    },
  ),
);
