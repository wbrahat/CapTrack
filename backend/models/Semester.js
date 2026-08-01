const mongoose = require('mongoose');

const SemesterSchema = new mongoose.Schema(
    {
        term: {
            type: String,
            required: true,
            trim: true
        },
        year: {
            type: Number,
            required: true,
            min: 2000,
            max: 2100
        },
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        startDate: {
            type: Date,
            default: null
        },
        endDate: {
            type: Date,
            default: null
        },
        registrationDeadline: {
            type: Date,
            default: null
        },
        groupFormationDeadline: {
            type: Date,
            default: null
        },
        proposalDeadline: {
            type: Date,
            default: null
        },
        status: {
            type: String,
            enum: ['Upcoming', 'Active', 'Archived'],
            default: 'Upcoming'
        },
        isActive: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

SemesterSchema.index({ term: 1, year: 1 }, { unique: true });

SemesterSchema.pre('validate', function normalizeSemester() {
    this.term = String(this.term || '').trim();
    this.name = `${this.term} ${this.year}`.trim();

    if (this.startDate && this.endDate && this.endDate < this.startDate) {
        this.invalidate('endDate', 'End date must be after the start date.');
    }

    if (this.status === 'Active') {
        this.isActive = true;
    } else if (this.status === 'Archived') {
        this.isActive = false;
    }
});

module.exports = mongoose.model('Semester', SemesterSchema);
