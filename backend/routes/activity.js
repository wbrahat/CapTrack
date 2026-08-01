/**
 * /api/activity  –  Activity Log & Notification Feed
 *
 * Mount in index.js:
 *   app.use('/api/activity', require('./routes/activity'));
 *
 * Endpoints
 * ─────────────────────────────────────────────────────────────
 *  GET  /api/activity             – paginated feed for current user
 *  GET  /api/activity/unread-count – badge count for header
 *  PUT  /api/activity/:id/read    – mark one notification read
 *  PUT  /api/activity/read-all    – mark all read
 *  PUT  /api/activity/:id/action  – accept or decline a team invite / supervisor request
 *  POST /api/activity             – internal/secure: create a notification
 */

const express = require('express');
const router  = express.Router();
const mongoose = require('mongoose');
const auth    = require('../middleware/auth');
const ActivityNotification = require('../models/ActivityNotification');
const User = require('../models/User');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeAvatar(name = '') {
    return String(name || '')
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'CT';
}

function formatRelative(date) {
    if (!date) return 'just now';
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    return `${d}d ago`;
}

function toClientNote(n) {
    const senderName = n.senderName || 'System';
    return {
        id:           String(n._id),
        type:         n.type,
        title:        n.title,
        body:         n.body         || '',
        senderName:   senderName,
        senderAvatar: n.senderAvatar || makeAvatar(senderName),
        status:       n.status       || 'unread',
        actionStatus: n.actionStatus || 'none',
        link:         n.link         || '',
        timeLabel:    formatRelative(n.createdAt),
        createdAt:    n.createdAt,
    };
}

// ─── GET /api/activity ────────────────────────────────────────────────────────
// Returns recent notifications for the authenticated user
router.get('/', auth, async (req, res) => {
    try {
        const page  = Math.max(1, parseInt(req.query.page)  || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 30);
        const skip  = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            ActivityNotification
                .find({ recipient: req.user.id })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ActivityNotification.countDocuments({ recipient: req.user.id }),
        ]);

        res.json({
            notifications: notifications.map(toClientNote),
            total,
            page,
            hasMore: skip + notifications.length < total,
        });
    } catch (err) {
        console.error('Activity Feed Error:', err.message);
        res.status(500).json({ message: 'Failed to load activity feed.' });
    }
});

// ─── GET /api/activity/unread-count ──────────────────────────────────────────
router.get('/unread-count', auth, async (req, res) => {
    try {
        const count = await ActivityNotification.countDocuments({
            recipient: req.user.id,
            status: 'unread',
        });
        res.json({ count });
    } catch (err) {
        console.error('Unread Count Error:', err.message);
        res.status(500).json({ message: 'Failed to get unread count.' });
    }
});

// ─── PUT /api/activity/read-all ───────────────────────────────────────────────
router.put('/read-all', auth, async (req, res) => {
    try {
        await ActivityNotification.updateMany(
            { recipient: req.user.id, status: 'unread' },
            { status: 'read' }
        );
        res.json({ message: 'All notifications marked as read.' });
    } catch (err) {
        console.error('Read-All Error:', err.message);
        res.status(500).json({ message: 'Failed to mark all notifications as read.' });
    }
});

// ─── PUT /api/activity/:id/read ───────────────────────────────────────────────
router.put('/:id/read', auth, async (req, res) => {
    try {
        const note = await ActivityNotification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user.id },
            { status: 'read' },
            { new: true }
        );
        if (!note) return res.status(404).json({ message: 'Notification not found.' });
        res.json({ notification: toClientNote(note) });
    } catch (err) {
        console.error('Mark-Read Error:', err.message);
        res.status(500).json({ message: 'Failed to mark notification as read.' });
    }
});

// ─── PUT /api/activity/:id/action ─────────────────────────────────────────────
// Accepts/Declines team invites or supervisor requests & sends feedback notification back to sender
router.put('/:id/action', auth, async (req, res) => {
    try {
        const { action } = req.body || {};
        if (!['accept', 'decline'].includes(action)) {
            return res.status(400).json({ message: "Action must be 'accept' or 'decline'." });
        }

        const note = await ActivityNotification.findOne({
            _id:       req.params.id,
            recipient: req.user.id,
            type:      { $in: ['team_invite', 'supervisor_request'] },
        });

        if (!note) {
            return res.status(404).json({ message: 'Request notification not found.' });
        }

        if (note.actionStatus !== 'pending') {
            return res.status(400).json({
                message: `This request has already been ${note.actionStatus}.`,
            });
        }

        const newActionStatus = action === 'accept' ? 'accepted' : 'declined';
        note.actionStatus = newActionStatus;
        note.status       = 'read';
        await note.save();

        // Feedback Loop: Notify the original sender about the outcome
        if (note.sender) {
            try {
                const responder = await User.findById(req.user.id).select('name').lean();
                const responderName = responder ? responder.name : 'A user';

                await ActivityNotification.create({
                    recipient:    note.sender,
                    type:         'system',
                    title:        action === 'accept' ? 'Request Accepted' : 'Request Declined',
                    body:         action === 'accept'
                        ? `${responderName} accepted your request.`
                        : `${responderName} declined your request.`,
                    sender:       req.user.id,
                    senderName:   responderName,
                    senderAvatar: makeAvatar(responderName),
                    status:       'unread',
                    actionStatus: 'none',
                });
            } catch (feedbackErr) {
                console.error('Feedback notification error:', feedbackErr.message);
            }
        }

        res.json({ notification: toClientNote(note) });
    } catch (err) {
        console.error('Request Action Error:', err.message);
        res.status(500).json({ message: 'Failed to process request.' });
    }
});

// ─── POST /api/activity ───────────────────────────────────────────────────────
// Secure creation of notifications for Activity Log & Recipients
router.post('/', auth, async (req, res) => {
    try {
        const { recipientId, type, title, body, link, actionStatus, notifySelf } = req.body || {};

        if (!type || !title) {
            return res.status(400).json({ message: 'type and title are required.' });
        }

        const senderId = req.user.id;
        const sender = await User.findById(senderId).select('name').lean();
        const senderName = sender ? sender.name : 'System';
        const senderAvatar = makeAvatar(senderName);

        const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
        let createdNote = null;

        // ১. যদি কোনো ভ্যালিড রিসিপিয়েন্ট ID থাকে (যেমন Supervisor) এবং তা বর্তমান ইউজার না হয়
        if (recipientId && isValidObjectId(recipientId) && String(recipientId) !== String(senderId)) {
            createdNote = await ActivityNotification.create({
                recipient:    recipientId,
                type,
                title,
                body:         body         || '',
                sender:       senderId,
                senderName,
                senderAvatar,
                link:         link         || '',
                actionStatus: actionStatus || (['team_invite', 'supervisor_request'].includes(type) ? 'pending' : 'none'),
            });
        }

        // ২. স্টুডেন্টের নিজের Activity Log-এ এন্ট্রি সেভ করা
        if (notifySelf || !recipientId || !isValidObjectId(recipientId) || String(recipientId) === String(senderId)) {
            const selfNote = await ActivityNotification.create({
                recipient:    senderId,
                type,
                title,
                body:         body         || '',
                sender:       senderId,
                senderName,
                senderAvatar,
                link:         link         || '',
                actionStatus: 'none',
            });
            if (!createdNote) createdNote = selfNote;
        }

        res.status(201).json({ notification: toClientNote(createdNote) });
    } catch (err) {
        console.error('Create Notification Error:', err.message);
        res.status(500).json({ message: 'Failed to create notification.' });
    }
});

module.exports = router;