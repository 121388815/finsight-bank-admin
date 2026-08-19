# FinSight Bank 信贷风控运营平台

面向银行信贷审批与运营管理场景的 React 中后台项目，覆盖登录鉴权、RBAC 权限、客户管理、贷款申请、风控审批、操作日志、数据看板和风险摘要。

## 技术栈

- React 19 + TypeScript 6 + Vite 8
- Ant Design 6
- React Router 7
- Zustand 5 + persist
- Axios
- ECharts 6

## 功能模块

- 登录鉴权：Mock token、刷新恢复、退出登录、账号停用校验
- RBAC：角色权限码、动态菜单、路由守卫、按钮级权限
- 数据看板：客户/申请指标、贷款状态分布、风险等级分布、最新操作
- 客户管理：组合筛选、分页、新增、敏感信息脱敏、详情及关联贷款
- 贷款申请：组合筛选、分页、新建申请、详情和状态流转
- 风控审批：风险评分、规则摘要、重新生成、通过/拒绝及审批意见
- 操作日志：业务审计查询、分页和 CSV 导出
- 系统管理：用户、角色和权限范围查看
- 基础能力：暗色主题、路由懒加载、响应式布局、403/404 页面

## 本地运行

```bash
npm install
npm run dev
```

默认地址：`http://127.0.0.1:5173`

项目内置以下 Mock 账号，密码统一为 `123456`：

| 账号 | 角色 |
| --- | --- |
| `admin` | 系统管理员 |
| `risk01` | 风控专员 |
| `operator01` | 运营人员 |
| `auditor01` | 审计人员 |
| `viewer01` | 只读用户 |

登录页默认填入 `admin / 123456`，可直接进入系统。

## 在线部署

项目通过 GitHub Actions 自动构建并发布到 GitHub Pages。推送到 `main` 分支后，部署工作流会自动执行。

在线地址：<https://121388815.github.io/finsight-bank-admin/>

## 常用命令

```bash
npm run dev      # 启动开发服务器
npm run lint     # ESLint 检查
npm run build    # TypeScript 检查并生成生产构建
npm run preview  # 本地预览生产构建
```

## 目录结构

```text
src
├─ api          # Mock业务接口、Axios客户端和本地可变数据库
├─ components   # 权限、页面容器、搜索区、状态、风险评分组件
├─ layouts      # 后台整体布局、动态菜单和顶部用户区
├─ pages        # 登录、看板、客户、贷款、风控、日志、系统页面
├─ router       # 路由表、登录守卫和页面权限守卫
├─ store        # 用户会话、应用设置、权限菜单状态
├─ types        # API、用户、客户、贷款、风险、日志数据模型
└─ utils        # Mock数据、延迟和分页工具
```

## 数据流

```text
页面组件 → API函数 → Mock数据库
    ↓          ↓
 Zustand    ApiResponse<T>
    ↓
路由 / 菜单 / 按钮权限
```

当前业务数据存放在内存中，刷新页面后会恢复初始 Mock 数据；登录态和主题设置通过 Zustand persist 保存在 `localStorage`。

## 接入真实后端

`src/api/request.ts` 已提供 Axios 实例、token 注入、异常转换和泛型 `request<T>`。配置环境变量后，可逐步将各业务 API 从 Mock 实现切换为 HTTP 请求：

```env
VITE_API_BASE_URL=https://example.com/api
```

前端权限只负责界面展示和交互控制，真实接口仍需由后端完成身份认证与权限校验。
