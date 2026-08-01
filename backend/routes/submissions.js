const express = require('express');
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const Submission = require('../models/Submission');
const User = require('../models/User');
const SupervisionRequest = require('../models/SupervisionRequest');
const ActivityNotification = require('../models/ActivityNotification');

const router = express.Router();

const typeLabels = {
    document: 'Document',
    slides: 'Presentation',
    code: 'Repository',
    report: 'Document',
    other: 'Other'
};

const statusLabels = {
    Approved: 'Approved',
    Reviewed: 'Approved',
    'Revision Requested': 'Revision Needed',
    Pending: 'Pending Review'
};

function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function buildFileName(submission) {
    if (submission.fileLink) return submission.fileLink;

    if (submission.type === 'code') {
        return 'github.com/captrack/repository';
    }

    const extension = submission.type === 'slides' ? 'pptx' : 'pdf';
    const safeTitle = submission.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');

    return `${safeTitle}.${extension}`;
}

function formatSubmission(submission) {
    return {
        id: submission._id,
        task: submission.title,
        submittedBy: submission.submittedBy?.name || 'Unknown Student',
        type: typeLabels[submission.type] || 'Other',
        date: formatDate(submission.createdAt),
        version: submission.version || 'v1',
        status: statusLabels[submission.status] || submission.status,
        feedback: submission.feedback ? 'View' : submission.status === 'Pending' ? 'Pending' : 'View',
        link: buildFileName(submission)
    };
}

function formatSupervisorSubmission(submission) {
    const project = submission.project || {};

    return {
        id: submission._id,
        title: submission.title,
        group: project.groupName || 'Group',
        project: project.title || 'Capstone Project',
        submittedBy: submission.submittedBy?.name || 'Unknown Student',
        milestone: submission.title,
        file: buildFileName(submission),
        submittedDate: formatDate(submission.createdAt),
        type: typeLabels[submission.type] || 'Other',
        status: statusLabels[submission.status] || submission.status,
        priority: submission.status === 'Pending' ? 'High' : submission.status === 'Revision Requested' ? 'Medium' : 'Low',
        feedback: submission.feedback || ''
    };
}

function formatAdminSubmission(submission) {
    const project = submission.project || {};
    const status = statusLabels[submission.status] || submission.status;

    return {
        id: submission._id,
        title: submission.title,
        group: project.groupName || 'Group',
        project: project.title || 'Capstone Project',
        supervisor: project.supervisor || 'Not Assigned Yet',
        submittedBy: submission.submittedBy?.name || 'Unknown Student',
        type: typeLabels[submission.type] || 'Other',
        date: formatDate(submission.createdAt),
        status,
        attention: status === 'Pending Review' ? 'High' : status === 'Revision Needed' ? 'Medium' : 'Low',
        file: buildFileName(submission),
        feedback: submission.feedback || ''
    };
}

function formatTimeAgo(date) {
    const diffMs = Date.now() - new Date(date).getTime();
    const diffHours = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60)));

    if (diffHours < 24) {
        return `${diffHours}h ago`;
    }

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
}

function makeAvatar(name = '') {
    return String(name || '')
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'CT';
}

function isProjectAssignedToSupervisor(project, supervisor) {
    const normalize = (value) => String(value || '').trim().toLowerCase();
    const projectSupervisor = normalize(project.supervisor);
    const supervisorName = normalize(supervisor?.name);
    const supervisorEmail = normalize(supervisor?.email);
    const supervisorNameParts = supervisorName.split(/\s+/).filter((part) => part.length >= 3);

    if (!projectSupervisor || projectSupervisor === 'not assigned yet') {
        return false;
    }

    return (
        projectSupervisor === supervisorName ||
        projectSupervisor === supervisorEmail ||
        supervisorName.includes(projectSupervisor) ||
        projectSupervisor.includes(supervisorName) ||
        supervisorNameParts.some((part) => projectSupervisor.includes(part))
    );
}

router.get('/student', auth, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'Only students can access this page.' });
        }

        const project = await Project.findOne({ student: req.user.id }).lean();
        const query = project ? { project: project._id } : { submittedBy: req.user.id };

        const submissions = await Submission.find(query)
            .populate('submittedBy', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        const total = submissions.length;
        const approved = submissions.filter((item) => ['Approved', 'Reviewed'].includes(item.status)).length;
        const revisionNeeded = submissions.filter((item) => item.status === 'Revision Requested').length;
        const pending = submissions.filter((item) => item.status === 'Pending').length;

        res.json({
            stats: [
                {
                    label: 'Total Submissions',
                    value: String(total),
                    subtext: 'Across all milestones'
                },
                {
                    label: 'Approved',
                    value: String(approved),
                    subtext: 'Accepted by supervisor'
                },
                {
                    label: 'Revision Needed',
                    value: String(revisionNeeded),
                    subtext: 'Requires update'
                },
                {
                    label: 'Pending Review',
                    value: String(pending),
                    subtext: 'Waiting for feedback'
                }
            ],
            submissions: submissions.map(formatSubmission),
            recentReview: submissions.find((item) => item.feedback) || submissions.find((item) => item.status === 'Revision Requested') || null
        });
    } catch (error) {
        console.error('Student submissions fetch error:', error);
        res.status(500).json({ message: 'Failed to load student submissions.' });
    }
});

router.get('/admin', auth, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Only admins can access this page.' });
        }

        const submissions = await Submission.find()
            .populate('submittedBy', 'name email')
            .populate('project', 'title groupName supervisor')
            .sort({ createdAt: -1 })
            .lean();

        const total = submissions.length;
        const approved = submissions.filter((item) => ['Approved', 'Reviewed'].includes(item.status)).length;
        const pending = submissions.filter((item) => item.status === 'Pending').length;
        const needsAttention = submissions.filter((item) => ['Pending', 'Revision Requested'].includes(item.status)).length;

        const supervisorPendingMap = new Map();

        submissions.forEach((submission) => {
            if (submission.status !== 'Pending') return;

            const supervisor = submission.project?.supervisor || 'Not Assigned Yet';
            supervisorPendingMap.set(supervisor, (supervisorPendingMap.get(supervisor) || 0) + 1);
        });

        const reviewLoad = Array.from(supervisorPendingMap.entries()).map(([name, count]) => ({
            name,
            value: `${count} pending`
        }));

        res.json({
            stats: [
                {
                    label: 'Total Submissions',
                    value: String(total),
                    subtext: 'Across all groups'
                },
                {
                    label: 'Approved',
                    value: String(approved),
                    subtext: 'Accepted by supervisors'
                },
                {
                    label: 'Pending Review',
                    value: String(pending),
                    subtext: 'Waiting for supervisor review'
                },
                {
                    label: 'Needs Attention',
                    value: String(needsAttention),
                    subtext: 'Revision or pending review'
                }
            ],
            submissions: submissions.map(formatAdminSubmission),
            reviewLoad,
            attentionMessage: needsAttention > 0
                ? `${needsAttention} submission${needsAttention === 1 ? '' : 's'} need admin monitoring.`
                : 'All submissions are currently in good standing.',
            health: [
                `${approved} approved submissions`,
                `${pending} waiting for review`,
                `${needsAttention} require attention`
            ]
        });
    } catch (error) {
        console.error('Admin submissions fetch error:', error);
        res.status(500).json({ message: 'Failed to load admin submissions.' });
    }
});

router.get('/supervisor/dashboard', auth, async (req, res) => {
    try {
        if (req.user.role !== 'supervisor') {
            return res.status(403).json({ message: 'Only supervisors can access this dashboard.' });
        }

        const supervisor = await User.findById(req.user.id).select('name email').lean();

        if (!supervisor) {
            return res.status(404).json({ message: 'Supervisor account not found.' });
        }

        const allProjects = await Project.find().select('_id title groupName members progress supervisor status createdAt').lean();
        const assignedProjects = allProjects.filter((project) => isProjectAssignedToSupervisor(project, supervisor));
        const assignedProjectIds = assignedProjects.map((project) => project._id);
        const supervisionRequests = await SupervisionRequest.find({
            supervisor: req.user.id,
            status: 'Pending'
        })
            .populate('student', 'name email')
            .populate('project', 'title groupName members progress')
            .sort({ createdAt: -1 })
            .lean();

        const submissions = await Submission.find({ project: { $in: assignedProjectIds } })
            .populate('submittedBy', 'name email')
            .populate('project', 'title groupName supervisor progress members')
            .sort({ createdAt: -1 })
            .lean();

        const pendingSubmissions = submissions.filter((item) => item.status === 'Pending');
        const feedbackNeeded = submissions.filter((item) => item.status === 'Revision Requested');
        const milestoneApprovals = submissions.filter((item) => ['Pending', 'Revision Requested'].includes(item.status));
        const averageProgress = assignedProjects.length
            ? Math.round(assignedProjects.reduce((sum, project) => sum + (project.progress || 0), 0) / assignedProjects.length)
            : 0;
        const slotLimit = 5;
        const slotsTaken = assignedProjects.length;

        const groups = assignedProjects.map((project) => {
            const projectSubmissions = submissions.filter((submission) => String(submission.project?._id) === String(project._id));

            return {
                id: project._id,
                name: project.groupName || 'Group',
                topic: project.title,
                progress: project.progress || 0,
                members: project.members || 1,
                lastActivity: projectSubmissions[0] ? formatTimeAgo(projectSubmissions[0].createdAt) : formatTimeAgo(project.createdAt),
                milestones: {
                    done: project.status === 'Approved' ? 3 : 1,
                    total: 6
                },
                tasks: {
                    overdue: 0,
                    pending: projectSubmissions.filter((submission) => submission.status === 'Pending').length,
                    done: projectSubmissions.filter((submission) => ['Approved', 'Reviewed'].includes(submission.status)).length
                },
                pendingSubmission: projectSubmissions.some((submission) => submission.status === 'Pending')
            };
        });

        res.json({
            stats: [
                { label: 'Assigned Groups', value: String(assignedProjects.length), color: '#1e3a5f' },
                { label: 'Pending Submissions', value: String(pendingSubmissions.length), color: '#f59e0b' },
                { label: 'Milestone Approvals', value: String(milestoneApprovals.length), color: '#0891b2' },
                { label: 'Feedback Needed', value: String(feedbackNeeded.length), color: '#ef4444' },
                { label: 'Slots Available', value: `${Math.max(slotLimit - slotsTaken, 0)} / ${slotLimit}`, color: '#10b981' }
            ],
            groups,
            groupProgressBar: groups.map((group) => ({ name: group.name, v: group.progress })),
            averageProgress,
            slots: {
                taken: slotsTaken,
                limit: slotLimit,
                remaining: Math.max(slotLimit - slotsTaken, 0)
            },
            supervisionRequests: supervisionRequests.map((request) => ({
                id: request._id,
                studentName: request.student?.name || 'Unknown Student',
                studentEmail: request.student?.email || '',
                projectTitle: request.project?.title || 'Untitled Capstone Project',
                groupName: request.project?.groupName || 'Group',
                progress: request.project?.progress || 0,
                members: request.project?.members || 1,
                requestedAt: formatTimeAgo(request.createdAt),
                message: request.message || 'Requested supervision.'
            })),
            pendingSubmissions: pendingSubmissions.map((submission) => ({
                id: submission._id,
                group: submission.project?.groupName || 'Group',
                task: submission.title,
                submittedBy: submission.submittedBy?.name || 'Unknown Student',
                time: formatDate(submission.createdAt),
                type: submission.type
            })),
            milestoneApprovals: milestoneApprovals.map((submission) => ({
                id: submission._id,
                group: submission.project?.groupName || 'Group',
                milestone: submission.title,
                status: submission.status === 'Pending' ? 'awaiting' : 'revision_sent',
                due: formatDate(submission.createdAt)
            })),
            feedbackQueue: feedbackNeeded.map((submission) => ({
                id: submission._id,
                group: submission.project?.groupName || 'Group',
                student: submission.submittedBy?.name || 'Team',
                item: submission.title,
                age: formatTimeAgo(submission.updatedAt || submission.createdAt)
            })),
            recentStudentActivity: submissions.slice(0, 5).map((submission) => ({
                time: formatTimeAgo(submission.createdAt),
                actor: submission.project?.groupName || 'Group',
                action: `submitted ${submission.title}`,
                type: 'upload'
            }))
        });
    } catch (error) {
        console.error('Supervisor dashboard fetch error:', error);
        res.status(500).json({ message: 'Failed to load supervisor dashboard.' });
    }
});

router.get('/student/feedback', auth, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'Only students can access feedback.' });
        }

        const project = await Project.findOne({ student: req.user.id }).lean();
        const query = project ? { project: project._id } : { submittedBy: req.user.id };

        const submissions = await Submission.find(query)
            .populate('project', 'title groupName supervisor')
            .sort({ updatedAt: -1 })
            .lean();

        const totalFeedback = submissions.filter((submission) => submission.feedback || submission.status !== 'Pending').length;
        const revisionNeeded = submissions.filter((submission) => submission.status === 'Revision Requested').length;
        const approved = submissions.filter((submission) => ['Approved', 'Reviewed'].includes(submission.status)).length;
        const pendingResponse = submissions.filter((submission) => submission.status === 'Pending').length;

        const feedbackItems = submissions.map((submission) => {
            const status = statusLabels[submission.status] || submission.status;
            const hasFeedback = Boolean(submission.feedback);

            return {
                id: submission._id,
                task: submission.title,
                supervisor: submission.project?.supervisor || project?.supervisor || 'Not Assigned Yet',
                date: formatDate(submission.updatedAt || submission.createdAt),
                status,
                relatedSubmission: buildFileName(submission),
                message: hasFeedback
                    ? submission.feedback
                    : submission.status === 'Pending'
                        ? 'Your submission is waiting for supervisor review.'
                        : 'This submission has been reviewed by your supervisor.',
                action: submission.status === 'Revision Requested' ? 'Update Submission' : 'View Details'
            };
        });

        const latestNote = feedbackItems.find((item) => item.message && item.status !== 'Pending Review') || feedbackItems[0] || null;
        const revisionChecklist = revisionNeeded > 0
            ? [
                'Read supervisor feedback carefully',
                'Update the required document or presentation',
                'Mention the changes in the next submission',
                'Resubmit before the next review deadline'
            ]
            : [
                'Keep approved files archived',
                'Monitor pending submissions',
                'Prepare the next milestone deliverable'
            ];

        res.json({
            project: {
                group: project?.groupName || 'Group 1',
                supervisor: project?.supervisor || 'Adnan'
            },
            stats: [
                { label: 'Total Feedback', value: String(totalFeedback), subtext: 'Across all submissions' },
                { label: 'Revision Needed', value: String(revisionNeeded), subtext: 'Need resubmission' },
                { label: 'Approved', value: String(approved), subtext: 'Accepted by supervisor' },
                { label: 'Pending Response', value: String(pendingResponse), subtext: 'Waiting for review' }
            ],
            feedbackItems,
            latestNote,
            revisionChecklist
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Failed to load student feedback.' });
    }
});

router.post('/student', auth, async (req, res) => {
    try {
        if (req.user.role !== 'student') {
            return res.status(403).json({ message: 'Only students can create submissions.' });
        }

        const { title, type = 'document', fileLink = '', version = 'v1' } = req.body;

        if (!title || !title.trim()) {
            return res.status(400).json({ message: 'Submission title is required.' });
        }

        const project =
            await Project.findOne({ student: req.user.id }) ||
            await Project.findOne({ groupName: 'Group 1' }) ||
            await Project.findOne();

        if (!project) {
            return res.status(404).json({ message: 'No project found for this student.' });
        }

        const allowedTypes = ['document', 'slides', 'code', 'report', 'other'];
        const safeType = allowedTypes.includes(type) ? type : 'other';

        const submission = await Submission.create({
            project: project._id,
            submittedBy: req.user.id,
            title: title.trim(),
            type: safeType,
            fileLink: fileLink.trim(),
            version: version.trim() || 'v1',
            status: 'Pending'
        });

        const populatedSubmission = await Submission.findById(submission._id)
            .populate('submittedBy', 'name email')
            .lean();

        res.status(201).json(formatSubmission(populatedSubmission));
    } catch (error) {
        console.error('Student submission create error:', error);
        res.status(500).json({ message: 'Failed to create submission.' });
    }
});

router.get('/supervisor', auth, async (req, res) => {
    try {
        if (req.user.role !== 'supervisor') {
            return res.status(403).json({ message: 'Only supervisors can access this page.' });
        }

        const supervisor = await User.findById(req.user.id).select('name email').lean();

        if (!supervisor) {
            return res.status(404).json({ message: 'Supervisor account not found.' });
        }

        const allProjects = await Project.find().select('_id title groupName supervisor').lean();
        const assignedProjects = allProjects.filter((project) => isProjectAssignedToSupervisor(project, supervisor));

        const assignedProjectIds = assignedProjects.map((project) => project._id);

        const submissions = await Submission.find({ project: { $in: assignedProjectIds } })
            .populate('submittedBy', 'name email')
            .populate('project', 'title groupName supervisor')
            .sort({ createdAt: -1 })
            .lean();

        const pending = submissions.filter((item) => item.status === 'Pending').length;
        const revisionNeeded = submissions.filter((item) => item.status === 'Revision Requested').length;
        const approved = submissions.filter((item) => ['Approved', 'Reviewed'].includes(item.status)).length;
        const overdue = 0;

        res.json({
            stats: [
                {
                    label: 'Pending Review',
                    value: String(pending),
                    subtext: 'Waiting for supervisor decision'
                },
                {
                    label: 'Revision Needed',
                    value: String(revisionNeeded),
                    subtext: 'Returned to students'
                },
                {
                    label: 'Approved',
                    value: String(approved),
                    subtext: 'Accepted this semester'
                },
                {
                    label: 'Overdue',
                    value: String(overdue),
                    subtext: 'Needs immediate attention'
                }
            ],
            submissions: submissions.map(formatSupervisorSubmission),
            reviewFocus: pending > 0
                ? `You have ${pending} submission${pending === 1 ? '' : 's'} waiting for review.`
                : 'No submissions are waiting for review right now.'
        });
    } catch (error) {
        console.error('Supervisor submissions fetch error:', error);
        res.status(500).json({ message: 'Failed to load supervisor submissions.' });
    }
});

router.patch('/supervisor/:id/review', auth, async (req, res) => {
    try {
        if (req.user.role !== 'supervisor') {
            return res.status(403).json({ message: 'Only supervisors can review submissions.' });
        }

        const { status, feedback = '' } = req.body;
        const allowedStatuses = ['Pending', 'Revision Requested', 'Approved', 'Reviewed'];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid submission status.' });
        }

        const supervisor = await User.findById(req.user.id).select('name email').lean();
        const submission = await Submission.findById(req.params.id).populate('project');

        if (!submission) {
            return res.status(404).json({ message: 'Submission not found.' });
        }

        const projectSupervisor = String(submission.project?.supervisor || '').trim().toLowerCase();
        const supervisorName = String(supervisor?.name || '').trim().toLowerCase();
        const supervisorEmail = String(supervisor?.email || '').trim().toLowerCase();
        const supervisorNameParts = supervisorName.split(/\s+/).filter((part) => part.length >= 3);
        const isAssignedSupervisor = projectSupervisor && projectSupervisor !== 'not assigned yet' && (
            projectSupervisor === supervisorName ||
            projectSupervisor === supervisorEmail ||
            supervisorName.includes(projectSupervisor) ||
            projectSupervisor.includes(supervisorName) ||
            supervisorNameParts.some((part) => projectSupervisor.includes(part))
        );

        if (!isAssignedSupervisor) {
            return res.status(403).json({ message: 'This submission is not assigned to you.' });
        }

        submission.status = status;
        submission.feedback = feedback.trim();
        await submission.save();

        const student = await User.findById(submission.submittedBy).select('name email').lean();

        if (student) {
            try {
                const reviewerName = supervisor?.name || 'Supervisor';
                const noteTitle = status === 'Approved' || status === 'Reviewed'
                    ? 'Submission Approved'
                    : 'Revision Requested';
                const noteBody = status === 'Approved' || status === 'Reviewed'
                    ? `Your submission "${submission.title}" was approved by ${reviewerName}.`
                    : feedback.trim() || `Please revise "${submission.title}" and resubmit.`;

                await ActivityNotification.create({
                    recipient: student._id,
                    type: 'supervisor_msg',
                    title: noteTitle,
                    body: noteBody,
                    sender: req.user.id,
                    senderName: reviewerName,
                    senderAvatar: makeAvatar(reviewerName),
                    status: 'unread',
                    actionStatus: 'none',
                    link: '/student/feedback',
                });
            } catch (notificationError) {
                console.error('Supervisor feedback notification error:', notificationError.message);
            }
        }

        const updatedSubmission = await Submission.findById(submission._id)
            .populate('submittedBy', 'name email')
            .populate('project', 'title groupName supervisor')
            .lean();

        res.json(formatSupervisorSubmission(updatedSubmission));
    } catch (error) {
        console.error('Supervisor submission review error:', error);
        res.status(500).json({ message: 'Failed to update submission review.' });
    }
});

module.exports = router;
