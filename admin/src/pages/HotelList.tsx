import { useState, useEffect } from 'react';
import { Layout, Button, Table, Space, message, Popconfirm, Tag, Menu } from 'antd';
import { useNavigate } from 'react-router-dom';
import { PlusOutlined, EditOutlined, DeleteOutlined, ShopOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Header, Sider, Content } = Layout;

interface Hotel {
  id: string;
  name: string;
  city: string;
  pricePerNight: number;
  totalRooms: number;
  status: string;
  merchantId: string;
}

function HotelList() {
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const menuItems = [
    {
      key: 'hotels',
      icon: <ShopOutlined />,
      label: '酒店管理',
      onClick: () => navigate('/hotels'),
    },
  ];

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3000/api/hotels', {
        params: { merchantId: user.id },
      });

      if (response.data.code === 200) {
        setHotels(response.data.data);
      }
    } catch (error) {
      message.error('获取酒店列表失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:3000/api/hotels/${id}`);
      message.success('删除成功');
      fetchHotels();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const columns = [
    {
      title: '酒店名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '城市',
      dataIndex: 'city',
      key: 'city',
    },
    {
      title: '价格/晚',
      dataIndex: 'pricePerNight',
      key: 'pricePerNight',
      render: (price: number) => `¥${price}`,
    },
    {
      title: '房间数',
      dataIndex: 'totalRooms',
      key: 'totalRooms',
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: any = {
          pending: <Tag color="orange">待审核</Tag>,
          approved: <Tag color="green">已批准</Tag>,
          rejected: <Tag color="red">已拒绝</Tag>,
        };
        return statusMap[status] || status;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Hotel) => (
        <Space>
          <Button type="primary" size="small" icon={<EditOutlined />} onClick={() => navigate(`/hotels/${record.id}`)}>
            编辑
          </Button>
          <Popconfirm title="确定删除?" onConfirm={() => handleDelete(record.id)}>
            <Button danger size="small" icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="dark" width={200}>
        <div style={{ color: 'white', padding: '20px', textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>
          易宿酒店后台
        </div>
        <Menu theme="dark" mode="inline" items={menuItems} />
      </Sider>

      <Layout>
        <Header style={{ background: '#1890ff', color: 'white', padding: '0 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, color: 'white' }}>酒店管理</h2>
          <Button onClick={() => navigate('/dashboard')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }}>
            返回
          </Button>
        </Header>

        <Content style={{ padding: '20px', background: '#f0f2f5' }}>
          <div style={{ marginBottom: '20px' }}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/hotels/new')}>
              新增酒店
            </Button>
          </div>

          <div style={{ background: 'white', padding: '20px', borderRadius: '4px' }}>
            <Table
              columns={columns}
              dataSource={hotels}
              loading={loading}
              rowKey="id"
            />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}

export default HotelList;
