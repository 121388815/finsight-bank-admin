import { Progress, Space, Typography } from "antd";
import { calculateRiskLevel } from "../../api/mockDb";
import StatusTag from "../StatusTag";

interface RiskScoreProps {
  score: number;
  compact?: boolean;
}

//风险评分统一展示，分数越高代表风险越低
export default function RiskScore({ score, compact = false }: RiskScoreProps) {
  const level = calculateRiskLevel(score);
  const color = level === "low" ? "#2f855a" : level === "medium" ? "#b7791f" : "#c2413b";

  if (compact) {
    return <Space size={8}><Typography.Text strong>{score}</Typography.Text><StatusTag status={level} /></Space>;
  }

  return (
    <div className="risk-score">
      <div className="risk-score-main"><span>{score}</span><small>综合评分</small></div>
      <div className="risk-score-progress">
        <Progress percent={score} strokeColor={color} showInfo={false} />
        <StatusTag status={level} />
      </div>
    </div>
  );
}
