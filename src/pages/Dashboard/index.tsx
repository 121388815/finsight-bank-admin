import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowUpOutlined,
  BankOutlined,
  FileDoneOutlined,
  TeamOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { Alert, Button, Card, Col, Row, Skeleton, Statistic, Tag } from "antd";
import { BarChart, PieChart } from "echarts/charts";
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components";
import * as echarts from "echarts/core";
import { CanvasRenderer } from "echarts/renderers";
import ReactEChartsCore from "echarts-for-react/esm/core";
import { getDashboardOverview, type DashboardOverview } from "../../api/dashboard";
import { unwrapResponse } from "../../api/request";
import PageContainer from "../../components/PageContainer";

const metricIcons = [<TeamOutlined />, <FileDoneOutlined />, <BankOutlined />, <TrophyOutlined />];

//按需注册Dashboard使用的图表模块，避免把完整ECharts打入首个页面分包
echarts.use([
  BarChart,
  PieChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer,
]);

export default function Dashboard() {
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(unwrapResponse(await getDashboardOverview()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "数据加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadData(); }, [loadData]);

  const statusOption = useMemo(() => ({
    tooltip: { trigger: "axis" },
    grid: { left: 24, right: 18, top: 24, bottom: 18, containLabel: true },
    xAxis: { type: "category", data: data?.loanStatus.map((item) => item.name) ?? [], axisTick: { show: false } },
    yAxis: { type: "value", minInterval: 1, splitLine: { lineStyle: { color: "#e8ecef" } } },
    series: [{ type: "bar", barWidth: 26, data: data?.loanStatus.map((item) => item.value) ?? [], itemStyle: { color: "#16776a", borderRadius: [3, 3, 0, 0] } }],
  }), [data]);

  const riskOption = useMemo(() => ({
    tooltip: { trigger: "item" },
    legend: { bottom: 0, icon: "circle" },
    series: [{
      type: "pie",
      radius: ["48%", "70%"],
      center: ["50%", "44%"],
      label: { formatter: "{b}\n{c}笔" },
      data: data?.riskDistribution.map((item, index) => ({ ...item, itemStyle: { color: ["#2f855a", "#d69e2e", "#c2413b"][index] } })) ?? [],
    }],
  }), [data]);

  return (
    <PageContainer title="数据看板" description="信贷运营与风险态势总览">
      {error ? <Alert type="error" showIcon message={error} action={<Button size="small" onClick={() => void loadData()}>重试</Button>} /> : null}
      <Skeleton loading={loading} active paragraph={{ rows: 8 }}>
        <Row gutter={[16, 16]}>
          {data?.metrics.map((metric, index) => (
            <Col xs={24} sm={12} xl={6} key={metric.label}>
              <Card className="metric-card">
                <div className="metric-icon">{metricIcons[index]}</div>
                <Statistic title={metric.label} value={metric.value} suffix={metric.unit} precision={0} />
                <div className="metric-trend"><ArrowUpOutlined /> 较上期 {metric.trend}%</div>
              </Card>
            </Col>
          ))}
        </Row>

        <Row gutter={[16, 16]} className="dashboard-row">
          <Col xs={24} xl={15}>
            <Card title="贷款申请状态" className="chart-card"><ReactEChartsCore echarts={echarts} option={statusOption} style={{ height: 310 }} /></Card>
          </Col>
          <Col xs={24} xl={9}>
            <Card title="风险等级分布" className="chart-card"><ReactEChartsCore echarts={echarts} option={riskOption} style={{ height: 310 }} /></Card>
          </Col>
        </Row>

        <Card title="最新操作" className="dashboard-row">
          <ul className="activity-list">
            {data?.latestLogs.map((item) => (
              <li key={item.id}>
                <span className="log-dot" />
                <div className="activity-content">
                  <strong>{item.action}</strong>
                  <span>操作人：{item.operatorName}</span>
                </div>
                <Tag className="activity-time">{item.createdAt}</Tag>
              </li>
            ))}
          </ul>
        </Card>
      </Skeleton>
    </PageContainer>
  );
}
