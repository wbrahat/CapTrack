const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'student', 'supervisor'],
        default: 'student'
    },
    profileSettings: {
        institution: {
            type: String,
            default: 'East West University',
            trim: true
        },
        department: {
            type: String,
            default: 'Computer Science and Engineering',
            trim: true
        },
        system: {
            type: String,
            default: 'CapTrack',
            trim: true
        }
    },
    notificationPreferences: {
        submissionUpdates: {
            type: Boolean,
            default: true
        },
        milestoneReminders: {
            type: Boolean,
            default: true
        },
        supervisorFeedback: {
            type: Boolean,
            default: true
        },
        collaborationFeed: {
            type: Boolean,
            default: false
        }
    },
    privacyPreferences: {
        profileVisibility: {
            type: Boolean,
            default: true
        },
        projectVisibility: {
            type: Boolean,
            default: true
        },
        archivePermission: {
            type: Boolean,
            default: true
        }
    },
    systemPreferences: {
        emailAlerts: {
            type: Boolean,
            default: true
        },
        inAppNotifications: {
            type: Boolean,
            default: true
        },
        autoSaveFeedback: {
            type: Boolean,
            default: true
        }
    },
    studentId: {
        type: String,
        unique: true,
        trim: true,
    },
    phoneNumber: {
        type: String,
        trim: true,
    },
    // Academic and profile fields
    cgpa: { type: Number, min: 0, max: 4, default: null },
    credits: { type: Number, min: 0, max: 200, default: null },
    capstoneSemester: { type: String, default: '' },
    researchInterest: { type: String, default: '' },
    github: { type: String, default: '' },
    linkedin: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    skills: { type: [String], default: [] },
    teamStatus: { type: String, enum: ['Open', 'In a Team', ''], default: '' },
}, {
    timestamps: true 
});

module.exports = mongoose.model('User', UserSchema);