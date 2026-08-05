const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Amader User model er shathe tracking link
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    groupName: {
        type: String,
        default: 'Group 1',
        trim: true
    },
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 25
    },
    members: {
        type: Number,
        min: 1,
        default: 1
    },
    supervisor: {
        type: String,
        default: 'Not Assigned Yet'
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Project', ProjectSchema);
