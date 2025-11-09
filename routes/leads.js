const express = require('express');
const { body, validationResult } = require('express-validator');
const { Op } = require('sequelize');
const { Lead, User, Activity } = require('../models');
const { authenticate, authorize } = require('../middleware/auth');
const { emailTemplates, sendEmail } = require('../utils/email');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// @route   GET /api/leads
// @desc    Get all leads with filters and pagination
// @access  Private
router.get('/', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      assignedToId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;

    const where = {};
    const userRole = req.user.role;
    const conditions = [];

    // Role-based filtering for Sales Executive
    if (userRole === 'Sales Executive') {
      conditions.push({
        [Op.or]: [
          { assignedToId: req.user.id },
          { createdById: req.user.id }
        ]
      });
    }
    // Managers and Admins can see all leads

    // Status filter
    if (status) {
      conditions.push({ status });
    }

    // Assigned to filter
    if (assignedToId) {
      conditions.push({ assignedToId: parseInt(assignedToId) });
    }

    // Search functionality
    if (search) {
      conditions.push({
        [Op.or]: [
          { name: { [Op.iLike]: `%${search}%` } },
          { email: { [Op.iLike]: `%${search}%` } },
          { company: { [Op.iLike]: `%${search}%` } }
        ]
      });
    }

    // Combine all conditions with AND
    if (conditions.length > 0) {
      if (conditions.length === 1) {
        Object.assign(where, conditions[0]);
      } else {
        where[Op.and] = conditions;
      }
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: leads } = await Lead.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [[sortBy, sortOrder]],
      limit: parseInt(limit),
      offset
    });

    res.json({
      success: true,
      data: {
        leads,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/leads/:id
// @desc    Get single lead with activities
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const lead = await Lead.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'assignedTo',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'createdBy',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Activity,
          as: 'activities',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'name', 'email']
            }
          ],
          order: [['createdAt', 'DESC']]
        }
      ]
    });

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

    res.json({
      success: true,
      data: { lead }
    });
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/leads
// @desc    Create a new lead
// @access  Private
router.post('/', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('status').optional().isIn(['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']),
  body('estimatedValue').optional().isFloat({ min: 0 })
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

    const leadData = {
      ...req.body,
      createdById: req.user.id,
      assignedToId: req.body.assignedToId || req.user.id
    };

    const lead = await Lead.create(leadData);

    // Create activity for lead creation
    await Activity.create({
      type: 'Note',
      title: 'Lead Created',
      description: `Lead "${lead.name}" was created`,
      leadId: lead.id,
      userId: req.user.id
    });

    // Load relationships
    await lead.reload({
      include: [
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] }
      ]
    });

    // Send email notification if assigned to someone else
    if (lead.assignedToId && lead.assignedToId !== req.user.id) {
      const assignedUser = await User.findByPk(lead.assignedToId);
      if (assignedUser) {
        const emailData = emailTemplates.leadAssigned(lead.name, assignedUser.name);
        await sendEmail(assignedUser.email, emailData.subject, emailData.html);
      }
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('lead:created', { lead });
    }

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: { lead }
    });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/leads/:id
// @desc    Update a lead
// @access  Private
router.put('/:id', [
  body('email').optional().isEmail().withMessage('Please provide a valid email'),
  body('status').optional().isIn(['New', 'Contacted', 'Qualified', 'Proposal', 'Negotiation', 'Won', 'Lost']),
  body('estimatedValue').optional().isFloat({ min: 0 })
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

    const lead = await Lead.findByPk(req.params.id);
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

    const oldStatus = lead.status;
    const oldAssignedToId = lead.assignedToId;

    // Update lead
    await lead.update(req.body);
    await lead.reload({
      include: [
        { model: User, as: 'assignedTo', attributes: ['id', 'name', 'email'] },
        { model: User, as: 'createdBy', attributes: ['id', 'name', 'email'] }
      ]
    });

    // Create activity for status change
    if (req.body.status && req.body.status !== oldStatus) {
      await Activity.create({
        type: 'Status Change',
        title: 'Status Changed',
        description: `Status changed from "${oldStatus}" to "${req.body.status}"`,
        leadId: lead.id,
        userId: req.user.id,
        metadata: { oldStatus, newStatus: req.body.status }
      });

      // Send email notification
      if (lead.assignedToId) {
        const assignedUser = await User.findByPk(lead.assignedToId);
        if (assignedUser) {
          const emailData = emailTemplates.leadStatusChanged(lead.name, oldStatus, req.body.status);
          await sendEmail(assignedUser.email, emailData.subject, emailData.html);
        }
      }
    }

    // Create activity for assignment change
    if (req.body.assignedToId && req.body.assignedToId !== oldAssignedToId) {
      await Activity.create({
        type: 'Note',
        title: 'Lead Reassigned',
        description: `Lead reassigned to ${lead.assignedTo?.name || 'another user'}`,
        leadId: lead.id,
        userId: req.user.id
      });

      // Send email notification
      if (lead.assignedToId) {
        const assignedUser = await User.findByPk(lead.assignedToId);
        if (assignedUser) {
          const emailData = emailTemplates.leadAssigned(lead.name, assignedUser.name);
          await sendEmail(assignedUser.email, emailData.subject, emailData.html);
        }
      }
    }

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('lead:updated', { lead });
    }

    res.json({
      success: true,
      message: 'Lead updated successfully',
      data: { lead }
    });
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/leads/:id
// @desc    Delete a lead
// @access  Private (Admin, Manager)
router.delete('/:id', authorize('Admin', 'Manager'), async (req, res) => {
  try {
    const lead = await Lead.findByPk(req.params.id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'Lead not found'
      });
    }

    await lead.destroy();

    // Emit socket event
    const io = req.app.get('io');
    if (io) {
      io.emit('lead:deleted', { leadId: req.params.id });
    }

    res.json({
      success: true,
      message: 'Lead deleted successfully'
    });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;

