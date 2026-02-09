import React, { useEffect, useState } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import VirtualList from '../../components/VirtualList'
import { fetchHotels, Hotel } from '../../services/hotel'
import { useAuthStore } from '../../store/useAuthStore'
import { formatPrice } from '../../utils/format'
import './index.scss'

const PAGE_SIZE = 8

const HotelList = () => {
  const router = useRouter()
  const { isLogin } = useAuthStore()
  const [list, setList] = useState<Hotel[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  const city = router.params.city || ''
  const keyword = router.params.keyword || ''
  const tag = router.params.tag || ''
  const start = router.params.start || ''
  const end = router.params.end || ''

  const loadHotels = async (p: number, reset = false) => {
    if (loading) return
    setLoading(true)
    Taro.showLoading({ title: '加载中' })
    const res = await fetchHotels({
      page: p,
      pageSize: PAGE_SIZE,
      city,
      keyword,
      tag
    })
    Taro.hideLoading()
    setLoading(false)
    setHasMore(res.hasMore)
    setList(prev => (reset ? res.list : [...prev, ...res.list]))
  }

  useEffect(() => {
    setPage(1)
    loadHotels(1, true)
  }, [city, keyword, tag, start, end])

  const handleScrollToLower = () => {
    if (!hasMore) return
    const nextPage = page + 1
    setPage(nextPage)
    loadHotels(nextPage)
  }

  const goDetail = (id: number) => {
    Taro.navigateTo({ url: `/pages/detail/index?id=${id}` })
  }

  return (
    <View className="page list-page">
      <View className="filter-header card">
        <Text>城市：{city || '全部'}</Text>
        <Text>日期：{start && end ? `${start} 至 ${end}` : '不限'}</Text>
        <Text>关键词：{keyword || '无'}</Text>
        {tag && <Text>标签：{tag}</Text>}
      </View>

      {list.length === 0 && !loading && (
        <View className="no-more">暂无匹配酒店</View>
      )}

      <VirtualList
        data={list}
        itemHeight={200}
        height={900}
        onReachBottom={handleScrollToLower}
        renderItem={item => (
          <View className="hotel-card" onClick={() => goDetail(item.id)}>
            <Image className="thumb" src={item.thumb} />
            <View className="info">
              <Text className="name">{item.name}</Text>
              <Text className="score">{item.score.toFixed(1)} 分</Text>
              <View className="price-row">
                <Text className="price">{formatPrice(item.price)} 起</Text>
                {isLogin && item.isMemberDeal && (
                  <Text className="member-tag">会员价</Text>
                )}
              </View>
            </View>
          </View>
        )}
      />

      {!hasMore && list.length > 0 && (
        <View className="no-more">没有更多了</View>
      )}
    </View>
  )
}

export default HotelList
