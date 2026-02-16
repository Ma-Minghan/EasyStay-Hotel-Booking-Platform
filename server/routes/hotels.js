const express = require('express');
const { Op } = require('sequelize');
const { Hotel, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

/**
 * GET /api/hotels
 * 获取酒店列表（带权限检查和筛选）
 */
router.get('/', async (req, res) => {
  try {
    const { status, role, userId, city, keyword } = req.query;
    const where = {};
    const searchOptions = {
      where,
      include: [
        {
          model: User,
          as: 'merchant',
          attributes: ['id', 'username'],
        },
      ],
    };

    // 商户只看自己的酒店
    if (role === 'merchant' && userId) {
      where.merchantId = userId;
    }

    // 状态筛选
    if (status) {
      where.status = status;
    }

    // 城市筛选
    if (city) {
      where.city = city;
    }

    // 关键词搜索
    if (keyword) {
      where.name = {
        [Op.like]: `%${keyword}%`,
      };
    }

    const hotels = await Hotel.findAll(searchOptions);

    res.json({
      code: 200,
      message: '获取成功',
      data: hotels,
    });
  } catch (error) {
    console.error('Get hotels error:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

/**
 * GET /api/hotels/:id
 * 获取单个酒店详情
 */
router.get('/:id', async (req, res) => {
  try {
    const hotel = await Hotel.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'merchant',
          attributes: ['id', 'username'],
        },
      ],
    });

    if (!hotel) {
      return res.status(404).json({
        code: 404,
        message: '酒店不存在',
      });
    }

    res.json({
      code: 200,
      message: '获取成功',
      data: hotel,
    });
  } catch (error) {
    console.error('Get hotel detail error:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

/**
 * POST /api/hotels
 * 新增酒店（需要登录）
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      description,
      location,
      city,
      rating,
      pricePerNight,
      totalRooms,
      availableRooms,
      phoneNumber,
      images,
      amenities,
    } = req.body;

    // 参数验证
    if (!name || !location || !city || !pricePerNight) {
      return res.status(400).json({
        code: 400,
        message: '酒店名称、地址、城市、价格不能为空',
      });
    }

    const hotel = await Hotel.create({
      name,
      description,
      location,
      city,
      rating: rating || 0,
      pricePerNight,
      totalRooms: totalRooms || 0,
      availableRooms: availableRooms || 0,
      phoneNumber,
      images: images || [],
      amenities: amenities || [],
      status: 'pending', // 新增酒店默认待审核
      merchantId: req.user.id, // 从 token 中获取商户 ID
    });

    // 关联用户信息
    await hotel.reload({
      include: [
        {
          model: User,
          as: 'merchant',
          attributes: ['id', 'username'],
        },
      ],
    });

    res.json({
      code: 200,
      message: '新增成功',
      data: hotel,
    });
  } catch (error) {
    console.error('Create hotel error:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

/**
 * PUT /api/hotels/:id
 * 编辑酒店（商户编辑内容或管理员审核）
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const hotel = await Hotel.findByPk(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        code: 404,
        message: '酒店不存在',
      });
    }

    // 权限检查：商户只能编辑自己的酒店
    if (req.user.role === 'merchant' && hotel.merchantId !== req.user.id) {
      return res.status(403).json({
        code: 403,
        message: '无权限编辑该酒店',
      });
    }

    const {
      name,
      description,
      location,
      city,
      rating,
      pricePerNight,
      totalRooms,
      availableRooms,
      phoneNumber,
      images,
      amenities,
      status,
    } = req.body;

    // 商户可以编辑内容（不能改状态）
    if (req.user.role === 'merchant') {
      if (name !== undefined) hotel.name = name;
      if (description !== undefined) hotel.description = description;
      if (location !== undefined) hotel.location = location;
      if (city !== undefined) hotel.city = city;
      if (rating !== undefined) hotel.rating = rating;
      if (pricePerNight !== undefined) hotel.pricePerNight = pricePerNight;
      if (totalRooms !== undefined) hotel.totalRooms = totalRooms;
      if (availableRooms !== undefined) hotel.availableRooms = availableRooms;
      if (phoneNumber !== undefined) hotel.phoneNumber = phoneNumber;
      if (images !== undefined) hotel.images = images;
      if (amenities !== undefined) hotel.amenities = amenities;
    }

    // 管理员可以审核（改状态）
    if (req.user.role === 'admin' && status !== undefined) {
      if (!['draft', 'pending', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({
          code: 400,
          message: '无效的酒店状态',
        });
      }
      hotel.status = status;
    }

    await hotel.save();

    // 关联用户信息
    await hotel.reload({
      include: [
        {
          model: User,
          as: 'merchant',
          attributes: ['id', 'username'],
        },
      ],
    });

    res.json({
      code: 200,
      message: '更新成功',
      data: hotel,
    });
  } catch (error) {
    console.error('Update hotel error:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

/**
 * DELETE /api/hotels/:id
 * 删除酒店（只有商户自己能删）
 */
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const hotel = await Hotel.findByPk(req.params.id);

    if (!hotel) {
      return res.status(404).json({
        code: 404,
        message: '酒店不存在',
      });
    }

    // 权限检查：只有商户自己和管理员能删
    if (req.user.role === 'merchant' && hotel.merchantId !== req.user.id) {
      return res.status(403).json({
        code: 403,
        message: '无权限删除',
      });
    }

    await hotel.destroy();

    res.json({
      code: 200,
      message: '删除成功',
      data: hotel,
    });
  } catch (error) {
    console.error('Delete hotel error:', error);
    res.status(500).json({
      code: 500,
      message: error.message,
    });
  }
});

module.exports = router;
