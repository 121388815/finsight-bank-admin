import { useCallback, useEffect, useState } from "react";
import { SafetyCertificateOutlined } from "@ant-design/icons";
import { App, Card, Col, Row, Skeleton, Space, Tag, Typography } from "antd";
import { unwrapResponse } from "../../api/request";
import { getRoleSummaries, type RoleSummary } from "../../api/system";
import PageContainer from "../../components/PageContainer";
import { PERMISSION_LABELS } from "../../types/user";

export default function SystemRoles() {
  const { message } = App.useApp();
  const [roles, setRoles] = useState<RoleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      setRoles(unwrapResponse(await getRoleSummaries()));
    } catch (error) {
      void message.error(error instanceof Error ? error.message : "角色加载失败");
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => { void loadData(); }, [loadData]);

  return (
    <PageContainer title="角色管理" description="角色与权限码映射，前端用于菜单、路由和按钮展示控制">
      <Skeleton active loading={loading} paragraph={{ rows: 8 }}>
        <Row gutter={[16, 16]}>
          {roles.map((role) => (
            <Col xs={24} lg={12} xl={8} key={role.code}>
              <Card className="role-card">
                <div className="role-card-heading">
                  <span className="role-icon"><SafetyCertificateOutlined /></span>
                  <div><Typography.Title level={4}>{role.name}</Typography.Title><Typography.Text type="secondary">{role.code}</Typography.Text></div>
                  <Tag>{role.userCount} 人</Tag>
                </div>
                <div className="role-permissions">
                  <Typography.Text type="secondary">权限范围</Typography.Text>
                  <Space size={[4, 8]} wrap>{role.permissions.map((permission) => <Tag key={permission}>{PERMISSION_LABELS[permission]}</Tag>)}</Space>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Skeleton>
    </PageContainer>
  );
}
