import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Image,
  Layout,
  Menu,
  Space,
  Spin,
  Tag,
  Typography,
  message,
} from 'antd';
import { ArrowLeftOutlined, ShopOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { API_ENDPOINTS } from '../config';

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;

interface MerchantInfo {
  id?: number;
  username?: string;
}

interface HotelDetailData {
  id?: number;
  name?: string;
  description?: string;
  city?: string;
  location?: string;
  openingDate?: string;
  longitude?: number | string;
  latitude?: number | string;
  rating?: number | string;
  starLevel?: number | string;
  pricePerNight?: number | string;
  totalRooms?: number | string;
  availableRooms?: number | string;
  phoneNumber?: string;
  images?: string[] | string;
  amenities?: string[] | string;
  status?: string;
  isHomeAd?: boolean;
  adStatus?: 'none' | 'pending' | 'approved' | 'rejected' | string;
  merchantId?: number | string;
  merchant?: MerchantInfo;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

const parseArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value !== 'string') {
    return [];
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item).trim()).filter(Boolean);
    }
  } catch {
    // Ignore JSON parse errors and use comma split below.
  }

  return trimmed
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const formatDateTime = (value?: string) => (value ? value.replace('T', ' ').slice(0, 19) : '-');

function HotelDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const api = useApi({ showMessage: false });

  const [hotel, setHotel] = useState<HotelDetailData | null>(null);
  const [loading, setLoading] = useState(false);

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  }, []);

  const menuItems = user.role === 'admin'
    ? [
        { key: 'review', icon: <ShopOutlined />, label: '\u9152\u5e97\u5ba1\u6838', onClick: () => navigate('/hotels') },
        { key: 'bookings', icon: <ShopOutlined />, label: '\u9884\u8ba2\u7ba1\u7406', onClick: () => navigate('/bookings') },
        { key: 'statistics', icon: <ShopOutlined />, label: '\u6536\u5165\u7edf\u8ba1', onClick: () => navigate('/statistics') },
        { key: 'holidays', icon: <ShopOutlined />, label: '\u8282\u5047\u65e5\u6d3b\u52a8', onClick: () => navigate('/holidays') },
      ]
    : [
        { key: 'hotels', icon: <ShopOutlined />, label: '\u6211\u7684\u9152\u5e97', onClick: () => navigate('/hotels') },
        { key: 'bookings', icon: <ShopOutlined />, label: '\u9884\u8ba2\u67e5\u8be2', onClick: () => navigate('/bookings') },
        { key: 'statistics', icon: <ShopOutlined />, label: '\u6536\u5165\u7edf\u8ba1', onClick: () => navigate('/statistics') },
      ];
  const selectedMenuKey = user.role === 'admin' ? 'review' : 'hotels';

  const fetchHotelDetail = useCallback(async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await api.get(API_ENDPOINTS.hotels.detail(id));
      if (response?.data?.code === 200 && response?.data?.data) {
        setHotel(response.data.data);
        return;
      }
      message.error(response?.data?.message || '\u83b7\u53d6\u9152\u5e97\u8be6\u60c5\u5931\u8d25');
    } catch (error: any) {
      message.error(error?.response?.data?.message || '\u83b7\u53d6\u9152\u5e97\u8be6\u60c5\u5931\u8d25');
    } finally {
      setLoading(false);
    }
  }, [api, id]);

  useEffect(() => {
    fetchHotelDetail();
  }, [fetchHotelDetail]);

  const images = useMemo(() => parseArray(hotel?.images), [hotel?.images]);
  const amenities = useMemo(() => parseArray(hotel?.amenities), [hotel?.amenities]);

  const statusTag = useMemo(() => {
    const status = hotel?.status;
    if (status === 'approved') return <Tag color='green'>approved</Tag>;
    if (status === 'pending') return <Tag color='orange'>pending</Tag>;
    if (status === 'rejected') return <Tag color='red'>rejected</Tag>;
    if (status === 'draft') return <Tag>draft</Tag>;
    return <Tag>{status || '-'}</Tag>;
  }, [hotel?.status]);

  const adTag = useMemo(() => {
    if (hotel?.isHomeAd) return <Tag color='green'>running</Tag>;
    if (hotel?.adStatus === 'pending') return <Tag color='orange'>pending</Tag>;
    if (hotel?.adStatus === 'approved') return <Tag color='blue'>approved</Tag>;
    if (hotel?.adStatus === 'rejected') return <Tag color='red'>rejected</Tag>;
    return <Tag>{hotel?.adStatus || 'none'}</Tag>;
  }, [hotel?.adStatus, hotel?.isHomeAd]);

  const handleBackToList = useCallback(() => {
    navigate('/hotels');

    window.setTimeout(() => {
      if (window.location.pathname !== '/hotels') {
        window.location.assign('/hotels');
      }
    }, 0);
  }, [navigate]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme='dark' width={200}>
        <div style={{ color: 'white', padding: '20px', textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>
          {'\u6613\u5bbf\u9152\u5e97\u540e\u53f0'}
        </div>
        <Menu theme='dark' mode='inline' selectedKeys={[selectedMenuKey]} items={menuItems} />
      </Sider>

      <Layout>
        <Header
          style={{
            background: '#1890ff',
            color: 'white',
            padding: '0 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, color: 'white' }}>{'\u9152\u5e97\u8be6\u60c5'}</h2>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={handleBackToList}
            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }}
          >
            {'\u8fd4\u56de\u5217\u8868'}
          </Button>
        </Header>

        <Content style={{ padding: '20px', background: '#f0f2f5' }}>
          <Spin spinning={loading}>
            {!hotel && !loading && (
              <Alert type='warning' message={'\u672a\u627e\u5230\u9152\u5e97\u8be6\u60c5\u6570\u636e'} showIcon />
            )}

            {hotel && (
              <Space direction='vertical' size={16} style={{ width: '100%' }}>
                <Card>
                  <Title level={4} style={{ marginTop: 0 }}>
                    {hotel.name || '\u672a\u547d\u540d\u9152\u5e97'}
                  </Title>
                  <Descriptions bordered size='small' column={2}>
                    <Descriptions.Item label={'\u9152\u5e97ID'}>{hotel.id ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label={'\u5546\u6237ID'}>{hotel.merchantId ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label={'\u5546\u6237\u540d'}>{hotel.merchant?.username || '-'}</Descriptions.Item>
                    <Descriptions.Item label={'\u72b6\u6001'}>{statusTag}</Descriptions.Item>
                    <Descriptions.Item label={'\u5e7f\u544a\u72b6\u6001'}>{adTag}</Descriptions.Item>
                    <Descriptions.Item label={'\u5f00\u4e1a\u65f6\u95f4'}>{hotel.openingDate || '-'}</Descriptions.Item>
                    <Descriptions.Item label={'\u57ce\u5e02'}>{hotel.city || '-'}</Descriptions.Item>
                    <Descriptions.Item label={'\u8be6\u7ec6\u5730\u5740'}>{hotel.location || '-'}</Descriptions.Item>
                    <Descriptions.Item label={'\u6bcf\u665a\u4ef7\u683c'}>¥{hotel.pricePerNight ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label={'\u8bc4\u5206'}>{hotel.rating ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label={'\u661f\u7ea7'}>{hotel.starLevel ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label={'\u603b\u623f\u95f4\u6570'}>{hotel.totalRooms ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label={'\u53ef\u7528\u623f\u95f4\u6570'}>{hotel.availableRooms ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label={'\u8054\u7cfb\u7535\u8bdd'}>{hotel.phoneNumber || '-'}</Descriptions.Item>
                    <Descriptions.Item label={'\u7ecf\u5ea6'}>{hotel.longitude ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label={'\u7eac\u5ea6'}>{hotel.latitude ?? '-'}</Descriptions.Item>
                    <Descriptions.Item label={'\u521b\u5efa\u65f6\u95f4'}>{formatDateTime(hotel.createdAt)}</Descriptions.Item>
                    <Descriptions.Item label={'\u66f4\u65b0\u65f6\u95f4'}>{formatDateTime(hotel.updatedAt)}</Descriptions.Item>
                    <Descriptions.Item label={'\u9152\u5e97\u63cf\u8ff0'} span={2}>
                      {hotel.description || '-'}
                    </Descriptions.Item>
                  </Descriptions>
                </Card>

                <Card title={'\u9152\u5e97\u56fe\u7247'}>
                  {images.length === 0 ? (
                    <Text type='secondary'>{'\u6682\u65e0\u56fe\u7247'}</Text>
                  ) : (
                    <Space wrap size={12}>
                      {images.map((url) => (
                        <Image
                          key={url}
                          src={url}
                          width={180}
                          height={120}
                          style={{ objectFit: 'cover', borderRadius: 6 }}
                          fallback='data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='
                        />
                      ))}
                    </Space>
                  )}
                </Card>

                <Card title={'\u914d\u5957\u8bbe\u65bd'}>
                  {amenities.length === 0 ? (
                    <Text type='secondary'>{'\u6682\u65e0\u914d\u5957\u8bbe\u65bd'}</Text>
                  ) : (
                    <Space wrap>
                      {amenities.map((item) => (
                        <Tag key={item}>{item}</Tag>
                      ))}
                    </Space>
                  )}
                </Card>
              </Space>
            )}
          </Spin>
        </Content>
      </Layout>
    </Layout>
  );
}

export default HotelDetail;
