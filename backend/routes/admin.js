const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const Submission = require('../models/Submission');
const User = require('../models/User');
const Semester = require('../models/Semester');

function ensureAdmin(req, res) {
    if (req.user.role !== 'admin') {
        res.status(403).json({ message: 'Admin access required.' });
        return false;
    }

    return true;
}



function parseOptionalDate(value, fieldLabel) {
    if (value === undefined) return undefined;
    if (value === null || value === '') return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        const error = new Error(`${fieldLabel} is not a valid date.`);
        error.statusCode = 400;
        throw error;
    }

    return date;
}

function formatSemester(semester, projectCount = 0) {
    if (!semester) return null;

    return {
        id: String(semester._id),
        term: semester.term,
        year: semester.year,
        name: semester.name,
        startDate: semester.startDate || null,
        endDate: semester.endDate || null,
        registrationDeadline: semester.registrationDeadline || null,
        groupFormationDeadline: semester.groupFormationDeadline || null,
        proposalDeadline: semester.proposalDeadline || null,
        status: semester.status,
        isActive: semester.isActive === true,
        projectCount,
        createdAt: semester.createdAt,
        updatedAt: semester.updatedAt
    };
}

async function ensureDefaultSemester() {
    let semesters = await Semester.find().sort({ year: -1, createdAt: -1 });

    if (semesters.length === 0) {
        const projectSemesters = (await Project.distinct('semester'))
            .map((name) => String(name || '').trim())
            .filter(Boolean);
        const names = projectSemesters.length > 0 ? projectSemesters : ['Summer 2026'];

        for (let index = 0; index < names.length; index += 1) {
            const name = names[index];
            const match = name.match(/^(.+?)\s+(\d{4})$/);
            const term = match ? match[1].trim() : name;
            const year = match ? Number(match[2]) : new Date().getFullYear();

            await Semester.create({
                term,
                year,
                name: `${term} ${year}`,
                status: index === 0 ? 'Active' : 'Upcoming',
                isActive: index === 0
            });
        }

        semesters = await Semester.find().sort({ year: -1, createdAt: -1 });
    }

    let activeSemester = semesters.find((semester) => semester.isActive && semester.status === 'Active');

    if (!activeSemester) {
        activeSemester = semesters.find((semester) => semester.status !== 'Archived') || null;
        if (activeSemester) {
            await Semester.updateMany(
                { _id: { $ne: activeSemester._id }, status: 'Active' },
                { $set: { isActive: false, status: 'Upcoming' } }
            );
            activeSemester.isActive = true;
            activeSemester.status = 'Active';
            await activeSemester.save();
        }
    }

    return activeSemester;
}

function matchesSupervisor(project, supervisor) {
    const assigned = String(project.supervisor || '').trim().toLowerCase();
    const name = String(supervisor.name || '').trim().toLowerCase();
    const email = String(supervisor.email || '').trim().toLowerCase();

    return Boolean(assigned) && (assigned === name || assigned === email);
}

function formatUser(user, assignedGroups = 0) {
    return {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive !== false,
        studentId: user.studentId || '',
        department: user.profileSettings?.department || 'Computer Science and Engineering',
        createdAt: user.createdAt,
        maxSupervisionSlots: Number.isFinite(user.maxSupervisionSlots)
            ? user.maxSupervisionSlots
            : 5,
        assignedGroups
    };
}

// GET /api/admin/users
// Admin-only user directory with search, role and status filters.
router.get('/users', auth, async (req, res) => {
    try {
        if (!ensureAdmin(req, res)) return;

        const search = String(req.query.search || '').trim();
        const role = String(req.query.role || 'all').trim().toLowerCase();
        const status = String(req.query.status || 'all').trim().toLowerCase();

        const query = {};

        if (['student', 'supervisor', 'admin'].includes(role)) {
            query.role = role;
        }

        if (status === 'active') {
            query.isActive = { $ne: false };
        } else if (status === 'inactive') {
            query.isActive = false;
        }

        if (search) {
            const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const searchRegex = new RegExp(escapedSearch, 'i');
            query.$or = [
                { name: searchRegex },
                { email: searchRegex },
                { studentId: searchRegex },
                { 'profileSettings.department': searchRegex }
            ];
        }

        const [users, projects, totalUsers, activeUsers, studentCount, supervisorCount] = await Promise.all([
            User.find(query)
                .select('-password')
                .sort({ createdAt: -1 })
                .lean(),
            Project.find().select('supervisor').lean(),
            User.countDocuments(),
            User.countDocuments({ isActive: { $ne: false } }),
            User.countDocuments({ role: 'student' }),
            User.countDocuments({ role: 'supervisor' })
        ]);

        const formattedUsers = users.map((user) => {
            const assignedGroups = user.role === 'supervisor'
                ? projects.filter((project) => matchesSupervisor(project, user)).length
                : 0;

            return formatUser(user, assignedGroups);
        });

        res.json({
            users: formattedUsers,
            stats: {
                total: totalUsers,
                active: activeUsers,
                inactive: Math.max(totalUsers - activeUsers, 0),
                students: studentCount,
                supervisors: supervisorCount
            },
            currentAdminId: req.user.id
        });
    } catch (error) {
        console.error('Admin users fetch error:', error);
        res.status(500).json({ message: 'Failed to load user management data.' });
    }
});

// PATCH /api/admin/users/:id/status
// Activate or deactivate an account. The logged-in admin cannot deactivate itself.
router.patch('/users/:id/status', auth, async (req, res) => {
    try {
        if (!ensureAdmin(req, res)) return;

        const { isActive } = req.body || {};

        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ message: 'isActive must be true or false.' });
        }

        if (String(req.params.id) === String(req.user.id) && isActive === false) {
            return res.status(400).json({ message: 'You cannot deactivate your own admin account.' });
        }

        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        user.isActive = isActive;
        await user.save();

        res.json({
            message: `${user.name}'s account has been ${isActive ? 'activated' : 'deactivated'}.`,
            user: formatUser(user.toObject())
        });
    } catch (error) {
        console.error('Admin user status update error:', error);
        res.status(500).json({ message: 'Failed to update user status.' });
    }
});

// PATCH /api/admin/users/:id/supervision-capacity
// Update maximum supervision slots for a supervisor.
router.patch('/users/:id/supervision-capacity', auth, async (req, res) => {
    try {
        if (!ensureAdmin(req, res)) return;

        const maxSupervisionSlots = Number(req.body?.maxSupervisionSlots);

        if (!Number.isInteger(maxSupervisionSlots) || maxSupervisionSlots < 1 || maxSupervisionSlots > 20) {
            return res.status(400).json({ message: 'Supervision capacity must be an integer between 1 and 20.' });
        }

        const supervisor = await User.findOne({ _id: req.params.id, role: 'supervisor' });

        if (!supervisor) {
            return res.status(404).json({ message: 'Supervisor not found.' });
        }

        supervisor.maxSupervisionSlots = maxSupervisionSlots;
        await supervisor.save();

        res.json({
            message: `${supervisor.name}'s supervision capacity was updated.`,
            user: formatUser(supervisor.toObject())
        });
    } catch (error) {
        console.error('Admin capacity update error:', error);
        res.status(500).json({ message: 'Failed to update supervision capacity.' });
    }
});



// GET /api/admin/semesters
// Return semester configuration, deadlines and project counts.
router.get('/semesters', auth, async (req, res) => {
    try {
        if (!ensureAdmin(req, res)) return;

        const activeSemester = await ensureDefaultSemester();
        const [semesters, projectCounts] = await Promise.all([
            Semester.find().sort({ year: -1, createdAt: -1 }).lean(),
            Project.aggregate([
                { $group: { _id: '$semester', count: { $sum: 1 } } }
            ])
        ]);

        const countMap = new Map(
            projectCounts.map((item) => [String(item._id || ''), item.count])
        );
        const items = semesters.map((semester) => formatSemester(
            semester,
            countMap.get(semester.name) || 0
        ));

        res.json({
            semesters: items,
            activeSemester: activeSemester
                ? formatSemester(activeSemester, countMap.get(activeSemester.name) || 0)
                : null,
            stats: {
                total: items.length,
                active: items.filter((item) => item.status === 'Active').length,
                upcoming: items.filter((item) => item.status === 'Upcoming').length,
                archived: items.filter((item) => item.status === 'Archived').length
            }
        });
    } catch (error) {
        console.error('Admin semesters fetch error:', error);
        res.status(500).json({ message: 'Failed to load semester management data.' });
    }
});

// POST /api/admin/semesters
// Create a semester. Optionally make it the active semester immediately.
router.post('/semesters', auth, async (req, res) => {
    try {
        if (!ensureAdmin(req, res)) return;

        const term = String(req.body?.term || '').trim();
        const year = Number(req.body?.year);
        const activate = req.body?.activate === true;

        if (!term) {
            return res.status(400).json({ message: 'Semester term is required.' });
        }
        if (!Number.isInteger(year) || year < 2000 || year > 2100) {
            return res.status(400).json({ message: 'Semester year must be between 2000 and 2100.' });
        }

        const name = `${term} ${year}`;
        const duplicate = await Semester.findOne({ name });
        if (duplicate) {
            return res.status(409).json({ message: `${name} already exists.` });
        }

        const semester = new Semester({
            term,
            year,
            name,
            startDate: parseOptionalDate(req.body?.startDate, 'Start date'),
            endDate: parseOptionalDate(req.body?.endDate, 'End date'),
            registrationDeadline: parseOptionalDate(req.body?.registrationDeadline, 'Registration deadline'),
            groupFormationDeadline: parseOptionalDate(req.body?.groupFormationDeadline, 'Group formation deadline'),
            proposalDeadline: parseOptionalDate(req.body?.proposalDeadline, 'Proposal deadline'),
            status: activate ? 'Active' : 'Upcoming',
            isActive: activate
        });

        if (activate) {
            await Semester.updateMany(
                { isActive: true },
                { $set: { isActive: false, status: 'Upcoming' } }
            );
        }

        await semester.save();
        res.status(201).json({
            message: `${semester.name} was created${activate ? ' and activated' : ''}.`,
            semester: formatSemester(semester)
        });
    } catch (error) {
        console.error('Admin semester create error:', error);
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        if (error.code === 11000) {
            return res.status(409).json({ message: 'That semester already exists.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: Object.values(error.errors)[0]?.message || 'Invalid semester information.' });
        }
        res.status(500).json({ message: 'Failed to create semester.' });
    }
});

// PATCH /api/admin/semesters/:id
// Edit dates and identity for an existing semester.
router.patch('/semesters/:id', auth, async (req, res) => {
    try {
        if (!ensureAdmin(req, res)) return;

        const semester = await Semester.findById(req.params.id);
        if (!semester) {
            return res.status(404).json({ message: 'Semester not found.' });
        }

        const term = req.body?.term === undefined ? semester.term : String(req.body.term || '').trim();
        const year = req.body?.year === undefined ? semester.year : Number(req.body.year);

        if (!term) {
            return res.status(400).json({ message: 'Semester term is required.' });
        }
        if (!Number.isInteger(year) || year < 2000 || year > 2100) {
            return res.status(400).json({ message: 'Semester year must be between 2000 and 2100.' });
        }

        const name = `${term} ${year}`;
        const duplicate = await Semester.findOne({ name, _id: { $ne: semester._id } });
        if (duplicate) {
            return res.status(409).json({ message: `${name} already exists.` });
        }

        const previousName = semester.name;
        semester.term = term;
        semester.year = year;
        semester.name = name;

        const dateFields = [
            ['startDate', 'Start date'],
            ['endDate', 'End date'],
            ['registrationDeadline', 'Registration deadline'],
            ['groupFormationDeadline', 'Group formation deadline'],
            ['proposalDeadline', 'Proposal deadline']
        ];
        dateFields.forEach(([field, label]) => {
            const parsed = parseOptionalDate(req.body?.[field], label);
            if (parsed !== undefined) semester[field] = parsed;
        });

        await semester.save();

        if (previousName !== semester.name) {
            await Project.updateMany(
                { semester: previousName },
                { $set: { semester: semester.name } }
            );
        }

        res.json({
            message: `${semester.name} was updated.`,
            semester: formatSemester(semester, await Project.countDocuments({ semester: semester.name }))
        });
    } catch (error) {
        console.error('Admin semester update error:', error);
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid semester identifier.' });
        }
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: Object.values(error.errors)[0]?.message || 'Invalid semester information.' });
        }
        res.status(500).json({ message: 'Failed to update semester.' });
    }
});

// PATCH /api/admin/semesters/:id/activate
router.patch('/semesters/:id/activate', auth, async (req, res) => {
    try {
        if (!ensureAdmin(req, res)) return;

        const semester = await Semester.findById(req.params.id);
        if (!semester) {
            return res.status(404).json({ message: 'Semester not found.' });
        }

        await Semester.updateMany(
            { _id: { $ne: semester._id }, isActive: true },
            { $set: { isActive: false, status: 'Upcoming' } }
        );
        semester.isActive = true;
        semester.status = 'Active';
        await semester.save();

        res.json({
            message: `${semester.name} is now the active semester.`,
            semester: formatSemester(semester, await Project.countDocuments({ semester: semester.name }))
        });
    } catch (error) {
        console.error('Admin semester activation error:', error);
        res.status(500).json({ message: 'Failed to activate semester.' });
    }
});

// PATCH /api/admin/semesters/:id/archive
router.patch('/semesters/:id/archive', auth, async (req, res) => {
    try {
        if (!ensureAdmin(req, res)) return;

        const semester = await Semester.findById(req.params.id);
        if (!semester) {
            return res.status(404).json({ message: 'Semester not found.' });
        }
        if (semester.isActive) {
            return res.status(400).json({ message: 'Activate another semester before archiving the current one.' });
        }

        semester.isActive = false;
        semester.status = 'Archived';
        await semester.save();

        res.json({
            message: `${semester.name} was archived.`,
            semester: formatSemester(semester, await Project.countDocuments({ semester: semester.name }))
        });
    } catch (error) {
        console.error('Admin semester archive error:', error);
        res.status(500).json({ message: 'Failed to archive semester.' });
    }
});


function inferProjectDomain(project) {
    if (project.domain && project.domain !== 'Capstone Project') {
        return project.domain;
    }

    const value = String(project.title || '').toLowerCase();
    if (value.includes('ai') || value.includes('machine learning') || value.includes('prediction')) return 'Artificial Intelligence';
    if (value.includes('iot') || value.includes('energy')) return 'Internet of Things';
    if (value.includes('hospital') || value.includes('medical')) return 'Health Informatics';
    if (value.includes('attendance')) return 'Software Engineering';
    if (value.includes('analytics') || value.includes('dashboard')) return 'Data Analytics';
    return project.domain || 'Capstone Project';
}

function formatAdminDate(date) {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function buildAdminProject(project, submissions = []) {
    const sortedSubmissions = [...submissions].sort(
        (a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt)
    );
    const pending = sortedSubmissions.filter((item) => item.status === 'Pending').length;
    const revision = sortedSubmissions.filter((item) => item.status === 'Revision Requested').length;
    const approved = sortedSubmissions.filter((item) => ['Approved', 'Reviewed'].includes(item.status)).length;
    const latest = sortedSubmissions[0] || null;
    const isCompleted = project.status === 'Completed' || Number(project.progress) >= 100;
    const needsAttention = ['Pending', 'Rejected'].includes(project.status) || revision > 0 || !project.supervisor || project.supervisor === 'Not Assigned Yet';

    let displayStatus = 'Active';
    if (isCompleted) displayStatus = 'Completed';
    else if (project.status === 'Pending') displayStatus = 'Pending Approval';
    else if (project.status === 'Rejected') displayStatus = 'Rejected';

    let attention = 'On track';
    if (!project.supervisor || project.supervisor === 'Not Assigned Yet') attention = 'Supervisor not assigned';
    else if (project.status === 'Pending') attention = 'Awaiting project approval';
    else if (project.status === 'Rejected') attention = 'Project was rejected';
    else if (revision > 0) attention = `${revision} revision request${revision === 1 ? '' : 's'}`;
    else if (pending > 0) attention = `${pending} submission${pending === 1 ? '' : 's'} awaiting review`;

    return {
        id: String(project._id),
        title: project.title,
        description: project.description,
        groupName: project.groupName || 'Group',
        domain: inferProjectDomain(project),
        semester: project.semester || 'Summer 2026',
        supervisor: project.supervisor || 'Not Assigned Yet',
        status: project.status || 'Pending',
        displayStatus,
        progress: Number(project.progress) || 0,
        members: Number(project.members) || 1,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt || project.createdAt,
        lastUpdate: formatAdminDate(project.updatedAt || latest?.updatedAt || latest?.createdAt || project.createdAt),
        student: project.student ? {
            id: String(project.student._id),
            name: project.student.name,
            email: project.student.email,
            studentId: project.student.studentId || ''
        } : null,
        submissionSummary: {
            total: sortedSubmissions.length,
            pending,
            revision,
            approved
        },
        latestSubmission: latest ? {
            id: String(latest._id),
            title: latest.title,
            file: latest.fileLink || '',
            type: latest.type,
            status: latest.status,
            submittedBy: latest.submittedBy?.name || 'Unknown Student',
            date: formatAdminDate(latest.updatedAt || latest.createdAt)
        } : null,
        submissions: sortedSubmissions.map((submission) => ({
            id: String(submission._id),
            title: submission.title,
            file: submission.fileLink || '',
            type: submission.type,
            status: submission.status,
            feedback: submission.feedback || '',
            submittedBy: submission.submittedBy?.name || 'Unknown Student',
            date: formatAdminDate(submission.updatedAt || submission.createdAt)
        })),
        needsAttention,
        attention
    };
}

// GET /api/admin/projects
// Return every project directly from the project collection, including projects with no submissions.
router.get('/projects', auth, async (req, res) => {
    try {
        if (!ensureAdmin(req, res)) return;

        const activeSemester = await ensureDefaultSemester();
        const [projects, supervisors, semesters] = await Promise.all([
            Project.find()
                .populate('student', 'name email studentId')
                .sort({ createdAt: -1 })
                .lean(),
            User.find({ role: 'supervisor', isActive: { $ne: false } })
                .select('name email maxSupervisionSlots')
                .sort({ name: 1 })
                .lean(),
            Semester.find().sort({ year: -1, createdAt: -1 }).lean()
        ]);

        const projectIds = projects.map((project) => project._id);
        const submissions = await Submission.find({ project: { $in: projectIds } })
            .populate('submittedBy', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        const submissionMap = new Map();
        submissions.forEach((submission) => {
            const key = String(submission.project);
            if (!submissionMap.has(key)) submissionMap.set(key, []);
            submissionMap.get(key).push(submission);
        });

        const items = projects.map((project) => buildAdminProject(
            project,
            submissionMap.get(String(project._id)) || []
        ));

        const completed = items.filter((item) => item.displayStatus === 'Completed').length;
        const active = items.filter((item) => item.displayStatus === 'Active').length;
        const needsAttention = items.filter((item) => item.needsAttention).length;

        res.json({
            projects: items,
            stats: {
                total: items.length,
                active,
                completed,
                needsAttention
            },
            activeSemester: activeSemester ? formatSemester(activeSemester) : null,
            semesters: semesters.map((semester) => formatSemester(semester)),
            supervisors: supervisors.map((supervisor) => ({
                id: String(supervisor._id),
                name: supervisor.name,
                email: supervisor.email,
                maxSupervisionSlots: Number.isFinite(supervisor.maxSupervisionSlots)
                    ? supervisor.maxSupervisionSlots
                    : 5,
                assignedGroups: projects.filter((project) => matchesSupervisor(project, supervisor)).length
            }))
        });
    } catch (error) {
        console.error('Admin projects fetch error:', error);
        res.status(500).json({ message: 'Failed to load project management data.' });
    }
});

// PATCH /api/admin/projects/:id
// Edit project details, approval status, supervisor assignment and progress.
router.patch('/projects/:id', auth, async (req, res) => {
    try {
        if (!ensureAdmin(req, res)) return;

        const project = await Project.findById(req.params.id);
        if (!project) {
            return res.status(404).json({ message: 'Project not found.' });
        }

        const {
            title,
            description,
            groupName,
            domain,
            semester,
            status,
            progress,
            members,
            supervisorId
        } = req.body || {};

        if (title !== undefined) {
            const value = String(title).trim();
            if (!value) return res.status(400).json({ message: 'Project title cannot be empty.' });
            project.title = value;
        }

        if (description !== undefined) {
            const value = String(description).trim();
            if (!value) return res.status(400).json({ message: 'Project description cannot be empty.' });
            project.description = value;
        }

        if (groupName !== undefined) {
            const value = String(groupName).trim();
            if (!value) return res.status(400).json({ message: 'Group name cannot be empty.' });
            project.groupName = value;
        }

        if (domain !== undefined) project.domain = String(domain).trim() || 'Capstone Project';
        if (semester !== undefined) {
            const semesterName = String(semester).trim();
            if (!semesterName) {
                return res.status(400).json({ message: 'Semester is required.' });
            }
            const semesterRecord = await Semester.findOne({ name: semesterName });
            if (!semesterRecord) {
                return res.status(400).json({ message: 'Select a semester configured by the administrator.' });
            }
            project.semester = semesterRecord.name;
        }

        if (status !== undefined) {
            const allowedStatuses = ['Pending', 'Approved', 'Rejected', 'Completed'];
            if (!allowedStatuses.includes(status)) {
                return res.status(400).json({ message: 'Invalid project status.' });
            }
            project.status = status;
        }

        if (progress !== undefined) {
            const numericProgress = Number(progress);
            if (!Number.isInteger(numericProgress) || numericProgress < 0 || numericProgress > 100) {
                return res.status(400).json({ message: 'Progress must be an integer between 0 and 100.' });
            }
            project.progress = numericProgress;
        }

        if (members !== undefined) {
            const numericMembers = Number(members);
            if (!Number.isInteger(numericMembers) || numericMembers < 1 || numericMembers > 20) {
                return res.status(400).json({ message: 'Member count must be an integer between 1 and 20.' });
            }
            project.members = numericMembers;
        }

        if (supervisorId !== undefined) {
            const normalizedSupervisorId = String(supervisorId || '').trim();

            if (!normalizedSupervisorId || normalizedSupervisorId === 'unassigned') {
                project.supervisor = 'Not Assigned Yet';
            } else {
                const supervisor = await User.findOne({
                    _id: normalizedSupervisorId,
                    role: 'supervisor',
                    isActive: { $ne: false }
                }).select('name email maxSupervisionSlots').lean();

                if (!supervisor) {
                    return res.status(404).json({ message: 'Active supervisor not found.' });
                }

                const otherProjects = await Project.find({ _id: { $ne: project._id } })
                    .select('supervisor')
                    .lean();
                const assignedGroups = otherProjects.filter((item) => matchesSupervisor(item, supervisor)).length;
                const maxSlots = Number.isFinite(supervisor.maxSupervisionSlots)
                    ? supervisor.maxSupervisionSlots
                    : 5;

                if (assignedGroups >= maxSlots) {
                    return res.status(400).json({ message: `${supervisor.name} has no supervision slots remaining.` });
                }

                project.supervisor = supervisor.name;
            }
        }

        if (project.status === 'Completed') {
            project.progress = 100;
        }

        await project.save();

        const populatedProject = await Project.findById(project._id)
            .populate('student', 'name email studentId')
            .lean();
        const submissions = await Submission.find({ project: project._id })
            .populate('submittedBy', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            message: 'Project updated successfully.',
            project: buildAdminProject(populatedProject, submissions)
        });
    } catch (error) {
        console.error('Admin project update error:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid project or supervisor identifier.' });
        }
        res.status(500).json({ message: 'Failed to update project.' });
    }
});

router.get('/dashboard', auth, async (req, res) => {
    try {
        if (!ensureAdmin(req, res)) return;

        const activeSemester = await ensureDefaultSemester();
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
            User.countDocuments({ role: 'student', isActive: { $ne: false } }),
            User.countDocuments({ role: 'supervisor', isActive: { $ne: false } }),
            Project.countDocuments({ status: 'Pending' }),
            Project.countDocuments({ status: 'Approved' }),
            Project.countDocuments({ status: 'Rejected' }),
            User.find({ role: 'supervisor', isActive: { $ne: false } })
                .select('name email maxSupervisionSlots')
                .lean(),
            Project.find().select('supervisor groupName progress').lean(),
            User.find().sort({ createdAt: -1 }).limit(3).select('name role createdAt').lean(),
            Project.find().sort({ createdAt: -1 }).limit(3).select('title supervisor status createdAt').lean(),
            Submission.find().select('createdAt').lean()
        ]);

        const supervisorWorkload = supervisors.map((supervisor) => {
            const assignedGroups = projects.filter((project) => matchesSupervisor(project, supervisor)).length;

            return {
                name: supervisor.name,
                email: supervisor.email,
                groups: assignedGroups,
                max: Number.isFinite(supervisor.maxSupervisionSlots)
                    ? supervisor.maxSupervisionSlots
                    : 5
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
                action: `project is ${String(project.status || 'pending').toLowerCase()} with supervisor ${project.supervisor || 'not assigned'}`,
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
            activeSemester: activeSemester ? formatSemester(activeSemester) : null,
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
        res.status(500).json({ message: 'Failed to load the admin dashboard.' });
    }
});

module.exports = router;
