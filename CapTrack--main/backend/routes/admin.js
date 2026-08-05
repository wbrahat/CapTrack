const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const Submission = require('../models/Submission');
const User = require('../models/User');

router.get('/dashboard', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Admin access required.' });
        }

        const [
            totalProjects,
            totalStudents,
            totalSupervisors,
            pendingProjects,
            approvedProjects,
            rejectedProjects,
            supervisors,
            projects,
            recentUsers,
            recentProjects,
            submissions
        ] = await Promise.all([
            Project.countDocuments(),
            User.countDocuments({ role: 'student' }),
            User.countDocuments({ role: 'supervisor' }),
            Project.countDocuments({ status: 'Pending' }),
            Project.countDocuments({ status: 'Approved' }),
            Project.countDocuments({ status: 'Rejected' }),
            User.find({ role: 'supervisor' }).select('name email').lean(),
            Project.find().select('supervisor groupName progress').lean(),
            User.find().sort({ createdAt: -1 }).limit(3).select('name role createdAt').lean(),
            Project.find().sort({ createdAt: -1 }).limit(3).select('title supervisor status createdAt').lean(),
            Submission.find().select('createdAt').lean()
        ]);

        const supervisorWorkload = supervisors.map((supervisor) => {
            const assignedGroups = projects.filter((project) => {
                const assignedSupervisor = String(project.supervisor || '').toLowerCase();
                return assignedSupervisor === supervisor.name.toLowerCase()
                    || assignedSupervisor === supervisor.email.toLowerCase();
            }).length;

            return {
                name: supervisor.name,
                email: supervisor.email,
                groups: assignedGroups,
                max: 5
            };
        });

        const groupProgress = projects.map((project, index) => ({
            group: project.groupName || `Group ${index + 1}`,
            progress: typeof project.progress === 'number' ? project.progress : 0
        }));

        const getWeekStart = (date) => {
            const weekStart = new Date(date);
            const day = weekStart.getDay();
            const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
            weekStart.setDate(diff);
            weekStart.setHours(0, 0, 0, 0);
            return weekStart;
        };

        const currentWeekStart = getWeekStart(new Date());
        const weeklySubmissions = Array.from({ length: 5 }, (_, index) => {
            const weekStart = new Date(currentWeekStart);
            weekStart.setDate(currentWeekStart.getDate() - (4 - index) * 7);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 7);

            return {
                week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                submissions: submissions.filter((submission) => {
                    const submittedAt = new Date(submission.createdAt);
                    return submittedAt >= weekStart && submittedAt < weekEnd;
                }).length
            };
        });

        const recentActivity = [
            ...recentProjects.map((project) => ({
                time: project.createdAt,
                actor: project.title,
                action: `project is ${project.status.toLowerCase()} with supervisor ${project.supervisor || 'not assigned'}`,
                type: 'submission'
            })),
            ...recentUsers.map((user) => ({
                time: user.createdAt,
                actor: user.name,
                action: `created a ${user.role} account`,
                type: user.role === 'supervisor' ? 'approval' : 'post'
            }))
        ]
            .sort((a, b) => new Date(b.time) - new Date(a.time))
            .slice(0, 5)
            .map((item) => ({
                ...item,
                time: new Date(item.time).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                })
            }));

        const unassignedStudents = Math.max(totalStudents - totalProjects, 0);
        const fullSupervisors = supervisorWorkload.filter((supervisor) => supervisor.groups >= supervisor.max);
        const alerts = [];

        if (rejectedProjects > 0) {
            alerts.push({
                label: `${rejectedProjects} project${rejectedProjects === 1 ? '' : 's'} need review after rejection.`,
                severity: 'high'
            });
        }

        if (pendingProjects > 0) {
            alerts.push({
                label: `${pendingProjects} project${pendingProjects === 1 ? '' : 's'} still awaiting supervisor/admin approval.`,
                severity: 'medium'
            });
        }

        if (unassignedStudents > 0) {
            alerts.push({
                label: `${unassignedStudents} student${unassignedStudents === 1 ? ' has' : 's have'} no project group yet.`,
                severity: 'low'
            });
        }

        fullSupervisors.forEach((supervisor) => {
            alerts.push({
                label: `${supervisor.name} is at full supervision capacity.`,
                severity: 'medium'
            });
        });

        if (alerts.length === 0) {
            alerts.push({
                label: 'No urgent admin alerts right now.',
                severity: 'low'
            });
        }

        res.json({
            stats: {
                totalGroups: totalProjects,
                enrolledStudents: totalStudents,
                activeSupervisors: totalSupervisors,
                needsAttention: pendingProjects + rejectedProjects
            },
            groupStatus: {
                active: approvedProjects,
                pendingSupervisor: pendingProjects,
                submittedFinal: 0,
                needsReview: rejectedProjects
            },
            supervisorWorkload,
            recentActivity,
            alerts,
            groupProgress,
            weeklySubmissions
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
