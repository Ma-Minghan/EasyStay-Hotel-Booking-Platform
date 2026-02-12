import { useState, useEffect } from 'react';
import { Layout, Form, Input, Button, Card, message } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

const { Header, Content } = Layout;

function HotelForm() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (id && id !== 'new') {
      fetchHotelDetail();
    }
  }, [id]);

  const fetchHotelDetail = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/hotels/${id}`);
      if (response.data.code === 200) {
        form.setFieldsValue(response.data.data);
      }
    } catch (error) {
      message.error('获取酒店信息失败');
    }
  };

const onFinish = async (values: any) => {
  try {
    setLoading(true);

    if (id && id !== 'new') {
      // 编辑模式
      await axios.put(`http://localhost:3000/api/hotels/${id}`, values, {
        params: {
          role: user.role,
          userId: user.id,
        },
      });
      message.success('更新成功');
    } else {
      // 新增模式
      await axios.post('http://localhost:3000/api/hotels', {
        ...values,
        merchantId: user.id,
      });
      message.success('新增成功');
    }

    navigate('/hotels');
  } catch (error: any) {
    message.error(error.response?.data?.message || '保存失败');
  } finally {
    setLoading(false);
  }
};

return (
  <Layout style={{ minHeight: '100vh' }}>
    <Header style={{ background: '#1890ff', color: 'white', padding: '0 20px', display: 'flex', alignItems: 'center' }}>
      <h2 style={{ margin: 0, color: 'white' }}>{id && id !== 'new' ? '编辑酒店' : '新增酒店'}</h2>
    </Header>

    <Content style={{ padding: '20px', background: '#f0f2f5' }}>
      <Card style={{ maxWidth: '600px', margin: '0 auto' }}>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            label="酒店名称"
            name="name"
            rules={[{ required: true, message: '请输入酒店名称' }]}
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
            rules={[{ required: true, message: '请输入城市' }]}
          >
            <Input placeholder="例：北京" />
          </Form.Item>

          <Form.Item
            label="地址"
            name="location"
            rules={[{ required: true, message: '请输入地址' }]}
          >
            <Input placeholder="例：朝阳区某街道" />
          </Form.Item>

          <Form.Item
            label="每晚价格（元）"
            name="pricePerNight"
          >
            <Input type="number" placeholder="例：599" />
          </Form.Item>

          <Form.Item
            label="总房间数"
            name="totalRooms"
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
          >
            <Input placeholder="例：010-12345678" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
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
