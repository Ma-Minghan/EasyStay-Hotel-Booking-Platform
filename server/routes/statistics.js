const express = require('express');
const { Op } = require('sequelize');
const { Booking, Hotel } = require('../models');
const router = express.Router();

/**
 * GET /api/statistics/revenue
 * 获取收入统计数据
 */
router.get('/revenue', async (req, res) => {
  try {
    const { role, userId } = req.query;

    const where = { status: 'confirmed' }; // 只统计已确认的预订
    const hotelWhere = {};

    if (role === 'merchant' && userId) {
      hotelWhere.merchantId = userId;
    }

    // 只在有筛选条件时才带 where，避免空对象导致多余的 inner join 失败
    const hotelInclude = {
      model: Hotel,
      as: 'hotel',
      attributes: ['id', 'name', 'merchantId'],
      ...(Object.keys(hotelWhere).length ? { where: hotelWhere } : {}),
    };

    // 获取相关的预订（已确认）
    const relevantBookings = await Booking.findAll({
      where,
      include: [hotelInclude],
    });

    // 获取相关的酒店
    const relevantHotels = await Hotel.findAll({
      where: hotelWhere,
    });

    // 总收入
    const totalRevenue = relevantBookings.reduce((sum, booking) => {
      return sum + parseFloat(booking.totalPrice || 0);
    }, 0);

    // 所有预订数量（不限状态）
    const allBookings = await Booking.findAll({
      include: [hotelInclude],
    });
    const totalBookings = allBookings.length;

    // 已确认数量
    const confirmedBookings = relevantBookings.length;

    // 待确认数量
    const pendingBookings = await Booking.count({
      where: { status: 'pending' },
      include: [hotelInclude],
    });

    // 平均收入
    const avgRevenuePerBooking =
      confirmedBookings > 0
        ? Math.round((totalRevenue / confirmedBookings) * 100) / 100
        : 0;

    // 按酒店统计
    const byHotel = relevantHotels.map((hotel) => {
      const hotelBookings = relevantBookings.filter(
        (b) => b.hotel && b.hotel.id === hotel.id
      );
      const revenue = hotelBookings.reduce((sum, b) => {
        return sum + parseFloat(b.totalPrice || 0);
      }, 0);

      return {
        hotelId: hotel.id,
        hotelName: hotel.name,
        revenue: Math.round(revenue * 100) / 100,
        bookingCount: hotelBookings.length,
      };
    });

    res.json({
      code: 200,
      message: '获取成功',
      data: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalBookings,
        confirmedBookings,
        pendingBookings,
        avgRevenuePerBooking,
        byHotel,
      },
    });
  } catch (error) {
    console.error('Get statistics error:', error);
    res.status(500).json({
      code: 500,
      message: error.message || '服务器错误',
    });
  }
});

module.exports = router;
