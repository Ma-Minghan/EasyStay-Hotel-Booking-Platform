const express = require('express');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Booking, Hotel, User } = require('../models');
const router = express.Router();

/**
 * GET /api/statistics/revenue
 * 获取收入统计数据
 */
router.get('/revenue', async (req, res) => {
  try {
    const { role, userId } = req.query;

    // 构建基础查询条件
    const where = { status: 'confirmed' }; // 只统计已确认的预订
    const hotelWhere = {};

    if (role === 'merchant' && userId) {
      hotelWhere.merchantId = userId;
    }

    // 获取相关的预订
    const relevantBookings = await Booking.findAll({
      where,
      include: [
        {
          model: Hotel,
          as: 'hotel',
          where: hotelWhere,
          attributes: ['id', 'name', 'merchantId'],
        },
      ],
    });

    // 获取相关的酒店
    const relevantHotels = await Hotel.findAll({
      where: hotelWhere,
    });

    // 计算总收入
    const totalRevenue = relevantBookings.reduce((sum, booking) => {
      return sum + parseFloat(booking.totalPrice);
    }, 0);

    // 获取所有预订数量
    const allBookings = await Booking.findAll({
      include: [
        {
          model: Hotel,
          as: 'hotel',
          where: hotelWhere,
          attributes: ['id'],
        },
      ],
    });

    const totalBookings = allBookings.length;

    // 已确认的预订数
    const confirmedBookings = relevantBookings.length;

    // 待确认的预订数
    const pendingBookings = await Booking.count({
      where: { status: 'pending' },
      include: [
        {
          model: Hotel,
          as: 'hotel',
          where: hotelWhere,
          attributes: ['id'],
        },
        {
          required: true,
        },
      ],
    });

    // 平均每笔预订的收入
    const avgRevenuePerBooking = confirmedBookings > 0
      ? Math.round(totalRevenue / confirmedBookings * 100) / 100
      : 0;

    // 按酒店统计
    const byHotel = relevantHotels.map(hotel => {
      const hotelBookings = relevantBookings.filter(b => b.hotelId === hotel.id);
      const revenue = hotelBookings.reduce((sum, b) => {
        return sum + parseFloat(b.totalPrice);
      }, 0);
      const bookingCount = hotelBookings.length;

      return {
        hotelId: hotel.id,
        hotelName: hotel.name,
        revenue: Math.round(revenue * 100) / 100,
        bookingCount,
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
      message: error.message,
    });
  }
});

module.exports = router;
