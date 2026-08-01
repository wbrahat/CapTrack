const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    groupName: {
        type: String,
        default: 'Group 1',
        trim: true
    },
    domain: {
        type: String,
        default: 'Capstone Project',
        trim: true
    },
    semester: {
        type: String,
        default: 'Summer 2026',
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
        max: 20,
        default: 1
    },
    supervisor: {
        type: String,
        default: 'Not Assigned Yet',
        trim: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected', 'Completed'],
        default: 'Pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

ProjectSchema.pre('save', function setUpdatedAt() {
    this.updatedAt = new Date();
});

module.exports = mongoose.model('Project', ProjectSchema);
