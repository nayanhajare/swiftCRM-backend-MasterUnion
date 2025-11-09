const express = require('express');
const { body, validationResult } = require('express-validator');
const { Activity, Lead, User } = require('../models');
const { authenticate } = require('../middleware/auth');
const { emailTemplates, sendEmail } = require('../utils/email');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// @route   GET /api/activities
// @desc    Get all activities with filters
// @access  Private
router.get('/', async (req, res) => {
  try {
    const {
      leadId,
      type,
      page = 1,
      limit = 50
    } = req.query;

    const where = {};

    if (leadId) {
      where.leadId = leadId;
    }

    if (type) {
      where.type = type;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: activities } = await Activity.findAndCountAll({
      where,
      include: [
        {
          model: Lead,
          as: 'lead',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/activities
// @desc    Create a new activity
// @access  Private
router.post('/', [
  body('type').isIn(['Note', 'Call', 'Meeting', 'Email', 'Status Change']).withMessage('Invalid activity type'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('leadId').isInt().withMessage('Lead ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { type, title, description, leadId, metadata } = req.body;

    // Verify lead exists and user has access
    const lead = await Lead.findByPk(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    // Check permissions
    const userRole = req.user.role;
    if (userRole === 'Sales Executive' && 
        lead.assignedToId !== req.user.id && 
        lead.createdById !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Create activity
    const activity = await Activity.create({
      type,
      title,
      description,
      leadId,
      userId: req.user.id,
      metadata: metadata || {}
    });

    // Load relationships
    await activity.reload({
      include: [
        {
          model: Lead,
          as: 'lead',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    // Send email notification to assigned user (if different from current user)
    if (lead.assignedToId && lead.assignedToId !== req.user.id) {
      const assignedUser = await User.findByPk(lead.assignedToId);
      if (assignedUser && assignedUser.email) {
        const emailData = emailTemplates.newActivity(lead.name, type, req.user.name, lead.id);
        await sendEmail(assignedUser.email, emailData.subject, emailData.html);
      }
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('activity:created', { activity });
    }

    res.status(201).json({
      success: true,
      message: 'Activity created successfully',
      data: { activity }
    });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/activities/:id
// @desc    Get single activity
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id, {
      include: [
        {
          model: Lead,
          as: 'lead',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    res.json({
      success: true,
      data: { activity }
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/activities/:id
// @desc    Update an activity
// @access  Private
router.put('/:id', [
  body('title').optional().trim().notEmpty().withMessage('Title cannot be empty')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const activity = await Activity.findByPk(req.params.id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Only creator can update
    if (activity.userId !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await activity.update(req.body);
    await activity.reload({
      include: [
        {
          model: Lead,
          as: 'lead',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('activity:updated', { activity });
    }

    res.json({
      success: true,
      message: 'Activity updated successfully',
      data: { activity }
    });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/activities/:id
// @desc    Delete an activity
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const activity = await Activity.findByPk(req.params.id);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Only creator or Admin can delete
    if (activity.userId !== req.user.id && req.user.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    await activity.destroy();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('activity:deleted', { activityId: req.params.id });
    }

    res.json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

