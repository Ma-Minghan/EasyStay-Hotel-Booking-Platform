import dayjs from 'dayjs'

export interface Room {
  id: number
  name: string
  price: number
}

export interface Hotel {
  id: number
  name: string
  city: string
  price: number
  score: number
  thumb: string
  banners: string[]
  rooms: Room[]
  isMemberDeal: boolean
  tags: string[]
}

const hotels: Hotel[] = Array.from({ length: 32 }).map((_, i) => ({
  id: i + 1,
  name: `云栖精选酒店 · ${i + 1} 号店`,
  city: i % 2 === 0 ? '上海' : '杭州',
  price: 198 + (i % 6) * 40,
  score: 4.2 + (i % 5) * 0.1,
  thumb:
    'https://images.unsplash.com/photo-1501117716987-c8e1ecb210d0?w=600',
  banners: [
    'https://images.unsplash.com/photo-1501117716987-c8e1ecb210d0?w=800',
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800',
    'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=800'
  ],
  rooms: [
    { id: 1, name: '高级大床房', price: 299 + (i % 4) * 20 },
    { id: 2, name: '商务双床房', price: 269 + (i % 3) * 18 },
    { id: 3, name: '景观套房', price: 459 + (i % 5) * 30 }
  ],
  isMemberDeal: i % 3 === 0,
  tags: [
    i % 2 === 0 ? '高评分' : '城市景观',
    i % 3 === 0 ? '近地铁' : '亲子友好'
  ]
}))

export const fetchHotels = async (params: {
  page: number
  pageSize: number
  city?: string
  keyword?: string
  tag?: string
}) => {
  const { page, pageSize, city, keyword, tag } = params
  const filtered = hotels.filter(hotel => {
    const matchCity = city ? hotel.city.includes(city) : true
    const matchKeyword = keyword ? hotel.name.includes(keyword) : true
    const matchTag = tag ? hotel.tags.includes(tag) : true
    return matchCity && matchKeyword && matchTag
  })
  const start = (page - 1) * pageSize
  const end = start + pageSize
  await new Promise(resolve => setTimeout(resolve, 300))
  return {
    list: filtered.slice(start, end),
    hasMore: end < filtered.length
  }
}

export const fetchHotelDetail = async (id: number) => {
  await new Promise(resolve => setTimeout(resolve, 200))
  const hotel = hotels.find(item => item.id === id)
  if (!hotel) throw new Error('Hotel not found')
  const rooms = [...hotel.rooms].sort((a, b) => a.price - b.price)
  return { ...hotel, rooms }
}

export const fetchOrders = async () => {
  await new Promise(resolve => setTimeout(resolve, 200))
  return [
    {
      id: 101,
      name: '云栖精选酒店 · 3 号店',
      date: dayjs().add(2, 'day').format('YYYY-MM-DD'),
      status: '待入住'
    },
    {
      id: 102,
      name: '云栖精选酒店 · 8 号店',
      date: dayjs().subtract(12, 'day').format('YYYY-MM-DD'),
      status: '已完成'
    }
  ]
}
