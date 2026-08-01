const mongoose = require('mongoose');

const SubmissionSchema = new mongoose.Schema({
    project: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Project',
        required: true
    },
    submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    fileLink: {
        type: String,
        default: '',
        trim: true
    },
    version: {
        type: String,
        default: 'v1',
        trim: true
    },
    type: {
        type: String,
        enum: ['document', 'slides', 'code', 'report', 'other'],
        default: 'document'
    },
    status: {
        type: String,
        enum: ['Pending', 'Reviewed', 'Revision Requested', 'Approved'],
        default: 'Pending'
    },
    feedback: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Submission', SubmissionSchema);
