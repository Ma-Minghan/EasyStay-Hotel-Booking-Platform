import { Form, Input, Button, Card, Typography, Radio } from 'antd';
import { Link } from 'react-router-dom';
import './App.css';

const { Title } = Typography;

function Register() {
  const [form] = Form.useForm();

  const onFinish = (values: any) => {
    console.log('Register values:', values);
    // TODO: 之后这里接后端注册接口
  };

  return (
    <div className="login-page">
      <Card className="login-card">
        <Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
          易宿酒店后台注册
        </Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            label="用户名"
            name="username"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input placeholder="请输入用户名" />
          </Form.Item>

          <Form.Item
            label="密码"
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password placeholder="请输入密码" />
          </Form.Item>

          <Form.Item
            label="角色"
            name="role"
            initialValue="merchant"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Radio.Group>
              <Radio value="merchant">商户</Radio>
              <Radio value="admin">管理员</Radio>
            </Radio.Group>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              注册
            </Button>
          </Form.Item>

          <div style={{ textAlign: 'right' }}>
            已有账号？<Link to="/login">去登录</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
}

export default Register;
