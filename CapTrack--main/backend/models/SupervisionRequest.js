const mongoose = require('mongoose');

const SupervisionRequestSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        supervisor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: true
        },
        message: {
            type: String,
            default: ''
        },
        status: {
            type: String,
            enum: ['Pending', 'Accepted', 'Rejected'],
            default: 'Pending'
        },
        decidedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('SupervisionRequest', SupervisionRequestSchema);
