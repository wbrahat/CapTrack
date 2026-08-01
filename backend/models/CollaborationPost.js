const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema(
    {
        authorId: {
            type: String,
            default: ''
        },
        authorName: {
            type: String,
            default: 'Anonymous'
        },
        text: {
            type: String,
            required: true,
            trim: true
        }
    },
    {
        timestamps: true
    }
);

const CollaborationPostSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ['supervisor', 'student'],
            required: true
        },
        isSupervisorPost: {
            type: Boolean,
            default: false
        },
        postType: {
            type: String,
            enum: ['supervisor_recruitment', 'student_team_up'],
            default: 'student_team_up'
        },
        author: {
            type: String,
            required: true,
            trim: true
        },
        authorRole: {
            type: String,
            required: true,
            trim: true
        },
        avatar: {
            type: String,
            required: true,
            trim: true
        },
        timeLabel: {
            type: String,
            default: 'just now'
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        body: {
            type: String,
            required: true,
            trim: true
        },
        projectTopic: {
            type: String,
            default: ''
        },
        researchArea: {
            type: String,
            default: ''
        },
        teamSize: {
            type: String,
            default: ''
        },
        projectIdea: {
            type: String,
            default: ''
        },
        currentTeamSize: {
            type: String,
            default: ''
        },
        lookingFor: {
            type: String,
            default: ''
        },
        skills: {
            type: [String],
            default: []
        },
        baseLikes: {
            type: Number,
            default: 0
        },
        baseComments: {
            type: Number,
            default: 0
        },
        likedBy: {
            type: [String],
            default: []
        },
        savedBy: {
            type: [String],
            default: []
        },
        joinedBy: {
            type: [String],
            default: []
        },
        requestedBy: {
            type: [String],
            default: []
        },
        comments: {
            type: [CommentSchema],
            default: []
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('CollaborationPost', CollaborationPostSchema);