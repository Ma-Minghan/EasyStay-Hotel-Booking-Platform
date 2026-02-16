import { useEffect } from 'react';
import { Layout, Form, Input, Button, Card, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { API_ENDPOINTS } from '../config';

const { Header, Content } = Layout;

function HotelForm() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const api = useApi({ showMessage: false });

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (id && id !== 'new') {
      fetchHotelDetail();
    }
  }, [id]);

  const fetchHotelDetail = async () => {
    const data = await api.get(API_ENDPOINTS.hotels.detail(id!));
    if (data) {
      form.setFieldsValue(data);
    } else {
      message.error('获取酒店信息失败');
    }
  };

  const onFinish = async (values: any) => {
    let result;

    if (id && id !== 'new') {
      // 编辑模式
      result = await api.put(
        API_ENDPOINTS.hotels.update(id),
        values,
        {
          role: user.role,
          userId: user.id,
        }
      );
    } else {
      // 新增模式
      result = await api.post(API_ENDPOINTS.hotels.create, {
        ...values,
        merchantId: user.id,
      });
    }

    if (result) {
      message.success(id && id !== 'new' ? '酒店信息已更新' : '酒店已成功创建');
      setTimeout(() => navigate('/hotels'), 500);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#1890ff', color: 'white', padding: '0 20px', display: 'flex', alignItems: 'center' }}>
        <h2 style={{ margin: 0, color: 'white' }}>
          {id && id !== 'new' ? '编辑酒店' : '新增酒店'}
        </h2>
      </Header>

      <Content style={{ padding: '20px', background: '#f0f2f5' }}>
        <Card style={{ maxWidth: '600px', margin: '0 auto' }}>
          <Form form={form} layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="酒店名称"
              name="name"
              rules={[
                { required: true, message: '请输入酒店名称' },
                { min: 2, message: '酒店名称至少 2 个字符' },
                { max: 50, message: '酒店名称最多 50 个字符' },
              ]}
            >
              <Input placeholder="例：五星酒店" />
            </Form.Item>

            <Form.Item
              label="描述"
              name="description"
            >
              <Input.TextArea placeholder="酒店描述" rows={3} />
            </Form.Item>

            <Form.Item
              label="城市"
              name="city"
              rules={[
                { required: true, message: '请输入城市' },
                { min: 2, message: '城市名至少 2 个字符' },
              ]}
            >
              <Input placeholder="例：北京" />
            </Form.Item>

            <Form.Item
              label="地址"
              name="location"
              rules={[
                { required: true, message: '请输入地址' },
                { min: 5, message: '地址至少 5 个字符' },
              ]}
            >
              <Input placeholder="例：朝阳区某街道" />
            </Form.Item>

            <Form.Item
              label="每晚价格（元）"
              name="pricePerNight"
              rules={[
                {
                  validator: (_, value) => {
                    if (!value || value > 0) return Promise.resolve();
                    return Promise.reject(new Error('价格必须大于 0'));
                  },
                },
              ]}
            >
              <Input type="number" placeholder="例：599" />
            </Form.Item>

            <Form.Item
              label="总房间数"
              name="totalRooms"
              rules={[
                {
                  validator: (_, value) => {
                    if (!value || value > 0) return Promise.resolve();
                    return Promise.reject(new Error('房间数必须大于 0'));
                  },
                },
              ]}
            >
              <Input type="number" placeholder="例：150" />
            </Form.Item>

            <Form.Item
              label="可用房间数"
              name="availableRooms"
            >
              <Input type="number" placeholder="例：45" />
            </Form.Item>

            <Form.Item
              label="电话"
              name="phoneNumber"
              rules={[
                {
                  pattern: /^1[3-9]\d{9}$/,
                  message: '请输入有效的手机号码',
                },
              ]}
            >
              <Input placeholder="例：13800138000" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={api.loading}>
                {id && id !== 'new' ? '更新' : '创建'}
              </Button>
              <Button style={{ marginLeft: '10px' }} onClick={() => navigate('/hotels')}>
                取消
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
}

export default HotelForm;
