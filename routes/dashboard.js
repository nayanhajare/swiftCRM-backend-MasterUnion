const express = require('express');
const { Sequelize, Op } = require('sequelize');
const { Lead, User, Activity } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user.id;

    // Build where clause based on user role
    const leadWhere = {};
    if (userRole === 'Sales Executive') {
      leadWhere[Op.or] = [
        { assignedToId: userId },
        { createdById: userId }
      ];
    }

    // Total leads
    const totalLeads = await Lead.count({ where: leadWhere });

    // Leads by status
    const leadsByStatus = await Lead.findAll({
      where: leadWhere,
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Total value
    const totalValue = await Lead.sum('estimatedValue', { where: leadWhere }) || 0;

    // Leads by source
    const leadsBySource = await Lead.findAll({
      where: {
        ...leadWhere,
        source: { [Op.ne]: null }
      },
      attributes: [
        'source',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['source'],
      order: [[Sequelize.literal('count'), 'DESC']],
      limit: 10,
      raw: true
    });

    // Recent activities
    const recentActivities = await Activity.findAll({
      where: userRole === 'Sales Executive' ? { userId } : {},
      include: [
        {
          model: Lead,
          as: 'lead',
          attributes: ['id', 'name']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10
    });

    // Conversion rate (Won / Total)
    const wonLeads = await Lead.count({
      where: {
        ...leadWhere,
        status: 'Won'
      }
    });
    const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

    // Monthly trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrend = await Lead.findAll({
      where: {
        ...leadWhere,
        createdAt: {
          [Op.gte]: sixMonthsAgo
        }
      },
      attributes: [
        [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('createdAt')), 'month'],
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: [Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('createdAt'))],
      order: [[Sequelize.fn('DATE_TRUNC', 'month', Sequelize.col('createdAt')), 'ASC']],
      raw: true
    });

    res.json({
      success: true,
      data: {
        totalLeads,
        leadsByStatus: leadsByStatus.reduce((acc, item) => {
          acc[item.status] = parseInt(item.count);
          return acc;
        }, {}),
        totalValue: parseFloat(totalValue),
        conversionRate: parseFloat(conversionRate.toFixed(2)),
        leadsBySource: leadsBySource.map(item => ({
          source: item.source,
          count: parseInt(item.count)
        })),
        recentActivities,
        monthlyTrend: monthlyTrend.map(item => ({
          month: item.month,
          count: parseInt(item.count)
        }))
      }
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/dashboard/performance
// @desc    Get performance metrics by user
// @access  Private (Admin, Manager)
router.get('/performance', authorize('Admin', 'Manager'), async (req, res) => {
  try {

    const users = await User.findAll({
      where: { isActive: true, role: 'Sales Executive' },
      attributes: ['id', 'name', 'email'],
      include: [
        {
          model: Lead,
          as: 'assignedLeads',
          attributes: [
            'id',
            'status',
            'estimatedValue'
          ]
        }
      ]
    });

    const performance = users.map(user => {
      const leads = user.assignedLeads || [];
      const totalLeads = leads.length;
      const wonLeads = leads.filter(l => l.status === 'Won').length;
      const totalValue = leads.reduce((sum, lead) => sum + parseFloat(lead.estimatedValue || 0), 0);
      const conversionRate = totalLeads > 0 ? (wonLeads / totalLeads) * 100 : 0;

      return {
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        totalLeads,
        wonLeads,
        totalValue,
        conversionRate: parseFloat(conversionRate.toFixed(2))
      };
    });

    res.json({
      success: true,
      data: { performance }
    });
  } catch (error) {
    console.error('Get performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

