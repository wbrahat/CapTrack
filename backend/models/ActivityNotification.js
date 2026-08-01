const mongoose = require('mongoose');

/**
 * ActivityNotification model
 *
 * Powers the Activity Log feed on the Student & Supervisor Dashboards.
 *
 * type values
 * ─────────────────────────────────────────────────────
 * 'team_invite'        – another student invited this user to their team
 * 'supervisor_msg'     – a supervisor sent a message / replied
 * 'supervisor_request' – a student requested supervision from a faculty member
 * 'system'             – deadline reminders, workflow updates, admin alerts
 *
 * status
 * ─────────────────────────────────────────────────────
 * 'unread' | 'read'
 *
 * For team_invite & supervisor_request, actionStatus tracks 
 * whether the request is pending, accepted, or declined.
 */
const ActivityNotificationSchema = new mongoose.Schema(
    {
        // The user who receives this notification (Recipient)
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },

        type: {
            type: String,
            enum: ['team_invite', 'supervisor_msg', 'supervisor_request', 'system'],
            required: true,
        },

        // Human-readable headline shown in the feed (e.g., "Application Submitted")
        title: {
            type: String,
            required: true,
            trim: true,
        },

        // Optional longer description
        body: {
            type: String,
            default: '',
            trim: true,
        },

        // The user who triggered this notification (optional – null for system)
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },

        // Name of the sender baked in so we don't need an extra populate query on read
        senderName: {
            type: String,
            default: '',
        },

        // Avatar initials for the sender (e.g., "HM")
        senderAvatar: {
            type: String,
            default: '',
        },

        status: {
            type: String,
            enum: ['unread', 'read'],
            default: 'unread',
        },

        // Tracks response state for requests or invites
        actionStatus: {
            type: String,
            enum: ['pending', 'accepted', 'declined', 'none'],
            default: 'none',
        },

        // Optional navigation link (e.g. /workspace, /supervisors)
        link: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('ActivityNotification', ActivityNotificationSchema);