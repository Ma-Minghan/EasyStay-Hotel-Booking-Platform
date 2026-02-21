const express = require('express');
const { Booking, Hotel, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

const parsePositiveInt = value => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

const canAccessBooking = (currentUser, booking) => {
  if (currentUser.role === 'admin') return true;
  if (currentUser.role === 'merchant') {
    return booking.hotel && booking.hotel.merchantId === currentUser.id;
  }
  return booking.userId === currentUser.id;
};

/**
 * GET /api/bookings
 * 获取预订列表（带权限检查）
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { hotelId, status, userId } = req.query;
    const where = {};
    const searchOptions = {
      where,
      include: [
        {
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'name', 'city', 'merchantId'],
          include: [
            {
              model: User,
              as: 'merchant',
              attributes: ['id', 'username'],
            },
          ],
        },
      ],
      order: [['createdAt', 'DESC']],
    };

    const hotelIdInt = parsePositiveInt(hotelId);
    const userIdInt = parsePositiveInt(userId);

    if (hotelIdInt) {
      where.hotelId = hotelIdInt;
    }

    if (status) {
      where.status = status;
    }

    // 用户只能看自己的订单
    if (req.user.role === 'user') {
      where.userId = req.user.id;
    }

    // 商户只能看自己酒店的订单
    if (req.user.role === 'merchant') {
      searchOptions.include[0].where = {
        merchantId: req.user.id,
      };
    }

    // 管理员允许按用户筛选
    if (req.user.role === 'admin' && userIdInt) {
      where.userId = userIdInt;
    }

    const bookings = await Booking.findAll(searchOptions);

    return res.json({
      code: 200,
      message: '获取成功',
      data: bookings,
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    return res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

/**
 * GET /api/bookings/:id
 * 获取单个预订详情
 */
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        {
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'name', 'city', 'pricePerNight', 'merchantId'],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        code: 404,
        message: '预订不存在',
      });
    }

    if (!canAccessBooking(req.user, booking)) {
      return res.status(403).json({
        code: 403,
        message: '无权限查看该预订',
      });
    }

    return res.json({
      code: 200,
      message: '获取成功',
      data: booking,
    });
  } catch (error) {
    console.error('Get booking detail error:', error);
    return res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

/**
 * POST /api/bookings
 * 新增预订
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      hotelId,
      guestName,
      guestPhone,
      guestEmail,
      checkInDate,
      checkOutDate,
      numberOfRooms,
      numberOfGuests,
      totalPrice,
      remarks,
    } = req.body;

    const missingFields = [];
    if (!hotelId) missingFields.push('hotelId');
    if (!guestName) missingFields.push('guestName');
    if (!checkInDate) missingFields.push('checkInDate');
    if (!checkOutDate) missingFields.push('checkOutDate');

    // 仅提示实际缺失字段，避免出现“hotelId也不能为空”的误导
    if (missingFields.length > 0) {
      return res.status(400).json({
        code: 400,
        message: `以下字段不能为空: ${missingFields.join('、')}`,
      });
    }

    const hotel = await Hotel.findByPk(hotelId);
    if (!hotel) {
      return res.status(404).json({
        code: 404,
        message: '酒店不存在',
      });
    }

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    if (checkIn >= checkOut) {
      return res.status(400).json({
        code: 400,
        message: '入住日期必须早于退房日期',
      });
    }

    const booking = await Booking.create({
      hotelId,
      userId: req.user.id,
      guestName,
      // 手机号未填写时给默认值，避免前端无输入框时直接失败
      guestPhone: guestPhone || '未填写',
      guestEmail,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfRooms: numberOfRooms || 1,
      numberOfGuests: numberOfGuests || 1,
      totalPrice: totalPrice || 0,
      status: 'pending',
      remarks,
    });

    await booking.reload({
      include: [
        {
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'name', 'city', 'pricePerNight'],
        },
      ],
    });

    return res.json({
      code: 200,
      message: '新增成功',
      data: booking,
    });
  } catch (error) {
    console.error('Create booking error:', error);
    return res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

/**
 * PUT /api/bookings/:id
 * 更新预订状态
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        {
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'name', 'merchantId'],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        code: 404,
        message: '预订不存在',
      });
    }

    if (!canAccessBooking(req.user, booking)) {
      return res.status(403).json({
        code: 403,
        message: '无权限修改该预订',
      });
    }

    const { status, remarks } = req.body;

    if (req.user.role === 'user') {
      if (status && status !== 'cancelled') {
        return res.status(403).json({
          code: 403,
          message: '普通用户仅可取消自己的预订',
        });
      }

      if (remarks !== undefined) {
        return res.status(403).json({
          code: 403,
          message: '普通用户不可修改订单备注',
        });
      }
    }

    if (status) {
      if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
        return res.status(400).json({
          code: 400,
          message: '无效的预订状态',
        });
      }
      booking.status = status;
    }

    if (remarks !== undefined) {
      booking.remarks = remarks;
    }

    await booking.save();

    await booking.reload({
      include: [
        {
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'name', 'city'],
        },
      ],
    });

    return res.json({
      code: 200,
      message: '更新成功',
      data: booking,
    });
  } catch (error) {
    console.error('Update booking error:', error);
    return res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

/**
 * DELETE /api/bookings/:id
 * 删除预订
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        {
          model: Hotel,
          as: 'hotel',
          attributes: ['id', 'merchantId'],
        },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        code: 404,
        message: '预订不存在',
      });
    }

    if (!canAccessBooking(req.user, booking)) {
      return res.status(403).json({
        code: 403,
        message: '无权限删除',
      });
    }

    await booking.destroy();

    return res.json({
      code: 200,
      message: '删除成功',
      data: booking,
    });
  } catch (error) {
    console.error('Delete booking error:', error);
    return res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

module.exports = router;
