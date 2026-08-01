const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const User = require('../models/User');
const Submission = require('../models/Submission');
const SupervisionRequest = require('../models/SupervisionRequest');
const Semester = require('../models/Semester');


function getCalendarSemesterName(date = new Date()) {
    const month = date.getMonth() + 1;
    const term = month <= 4 ? 'Spring' : month <= 8 ? 'Summer' : 'Fall';
    return `${term} ${date.getFullYear()}`;
}

async function getActiveSemesterName() {
    const activeSemester = await Semester.findOne({ isActive: true, status: 'Active' })
        .select('name')
        .lean();
    return activeSemester?.name || getCalendarSemesterName();
}

function formatDate(date) {
    if (!date) return 'No submissions yet';

    return new Date(date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
}

function getInitials(name) {
    return String(name || 'User')
        .split(' ')
        .filter(Boolean)
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
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

function buildTeamMembers(studentName, totalMembers = 6) {
    const mainName = studentName || 'Student';
    const defaultMembers = [
        { name: 'Wasimul Bari Rahat', role: 'UI/UX Designer' },
        { name: 'Md Fahim Hassan Samir', role: 'Backend Developer' },
        { name: 'Nila Ashma Sara', role: 'Frontend Developer' },
        { name: 'Samira Akter', role: 'Documentation' },
        { name: 'Md Sabik Hossen', role: 'Team Coordinator' },
        { name: 'Nafiz Ibna Mahobub', role: 'Backend Developer' }
    ];

    const normalizedMainName = mainName.toLowerCase();
    const members = [
        { name: mainName, role: 'Team Leader · Full Stack Developer' },
        ...defaultMembers.filter((member) => member.name.toLowerCase() !== normalizedMainName)
    ];

    return members.slice(0, totalMembers).map((member, index) => ({
        id: String(index + 1),
        name: member.name,
        role: member.role,
        avatar: getInitials(member.name)
    }));
}

function buildTaskSummary(submissions = []) {
    const total = submissions.length;
    const completed = submissions.filter((submission) => ['approved', 'reviewed'].includes(String(submission.status || '').toLowerCase())).length;
    const pending = submissions.filter((submission) => String(submission.status || '').toLowerCase() === 'pending').length;
    const revisionNeeded = submissions.filter((submission) => String(submission.status || '').toLowerCase() === 'revision requested').length;
    const attentionCount = pending + revisionNeeded;

    let subtext = 'No pending tasks';
    if (attentionCount > 0) {
        subtext = `${attentionCount} ${attentionCount === 1 ? 'item needs' : 'items need'} attention`;
    }

    return {
        value: `${completed} / ${total}`,
        subtext
    };
}

function buildWeeklyActivity(submissions = []) {
    const weeks = [];
    const today = new Date();

    for (let i = 5; i >= 0; i -= 1) {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - (i * 7));
        weekStart.setHours(0, 0, 0, 0);

        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const weekSubmissions = submissions.filter((submission) => {
            const submittedAt = new Date(submission.createdAt);
            return submittedAt >= weekStart && submittedAt <= weekEnd;
        });

        const completed = weekSubmissions.filter((submission) => ['approved', 'reviewed'].includes(String(submission.status || '').toLowerCase())).length;

        weeks.push({
            week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            commits: weekSubmissions.length,
            tasks: completed
        });
    }

    return weeks;
}

function buildStudentTasks(submissions = [], project) {
    if (!submissions || submissions.length === 0) {
        return [
            {
                id: 'project-setup',
                title: project ? `Start work on ${project.title}` : 'Submit your first project document',
                priority: 'medium',
                due: 'No due date',
                status: 'pending'
            }
        ];
    }

    return submissions.slice(0, 5).map((submission, index) => {
        const status = String(submission.status || '').toLowerCase();
        const needsRevision = status === 'revision requested';
        const isCompleted = ['approved', 'reviewed'].includes(status);

        return {
            id: String(submission._id || index + 1),
            title: needsRevision ? `Revise: ${submission.title}` : `Review: ${submission.title}`,
            priority: needsRevision ? 'high' : status === 'pending' ? 'medium' : 'low',
            due: formatDate(submission.createdAt),
            status: isCompleted ? 'done' : needsRevision ? 'overdue' : 'pending'
        };
    });
}

function buildMilestones(submissions = []) {
    const milestoneTemplates = [
        { label: 'Project Proposal', due: 'Mar 10, 2026', keywords: ['proposal'] },
        { label: 'Literature Review', due: 'Apr 5, 2026', keywords: ['literature'] },
        { label: 'SRS Documentation', due: 'May 1, 2026', keywords: ['srs', 'documentation'] },
        { label: 'Sprint 1 Review', due: 'May 25, 2026', keywords: ['sprint 1'] },
        { label: 'Prototype Demo', due: 'Jun 20, 2026', keywords: ['prototype', 'demo'] },
        { label: 'Final Report', due: 'Jul 15, 2026', keywords: ['final', 'report'] }
    ];

    return milestoneTemplates.map((milestone) => {
        const matchedSubmission = submissions.find((submission) => {
            const title = String(submission.title || '').toLowerCase();
            return milestone.keywords.some((keyword) => title.includes(keyword));
        });

        if (!matchedSubmission) {
            return { label: milestone.label, due: milestone.due, status: 'upcoming' };
        }

        const status = String(matchedSubmission.status || '').toLowerCase();
        if (['approved', 'reviewed'].includes(status)) {
            return { label: milestone.label, due: milestone.due, status: 'done' };
        }

        return { label: milestone.label, due: milestone.due, status: 'active' };
    });
}

// @route   POST /api/projects
// @desc    Create/Submit a new project
router.post('/', auth, async (req, res) => {
    const { title, description } = req.body;

    if (!title || !description) {
        return res.status(400).json({ message: 'Title and description are required.' });
    }

    try {
        const activeSemesterName = await getActiveSemesterName();
        const newProject = new Project({
            title,
            description,
            student: req.user.id,
            semester: activeSemesterName
        });

        const project = await newProject.save();
        res.json(project);
    } catch (err) {
        console.error('Project Create Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/projects/user/me
// @desc    Get current logged-in student's project
router.get('/user/me', auth, async (req, res) => {
    try {
        const project = await Project.findOne({ student: req.user.id }).populate('student', ['name', 'email']);
        if (!project) {
            return res.status(404).json({ msg: 'No project found for this student.' });
        }
        res.json(project);
    } catch (err) {
        console.error('Fetch Project Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   POST /api/projects/request-supervision
// @desc    Create a pending supervision request for selected faculty
router.post('/request-supervision', auth, async (req, res) => {
    const { supervisorId } = req.body;

    if (req.user.role !== 'student') {
        return res.status(403).json({ message: 'Only students can request supervision.' });
    }

    try {
        const supervisor = await User.findOne({ _id: supervisorId, role: 'supervisor' }).select('name email role');
        const student = await User.findById(req.user.id).select('name email');

        if (!supervisor) {
            return res.status(404).json({ message: 'Faculty supervisor not found.' });
        }

        let project = await Project.findOne({ student: req.user.id });

        if (!project) {
            project = new Project({
                title: 'Untitled Capstone Project',
                description: 'Project details will be updated by the student team.',
                student: req.user.id,
                semester: await getActiveSemesterName()
            });
        }

        project.status = 'Pending';
        project = await project.save();

        await SupervisionRequest.updateMany(
            { student: req.user.id, project: project._id, status: 'Pending' },
            { status: 'Rejected', decidedAt: new Date() }
        );

        const supervisionRequest = await SupervisionRequest.findOneAndUpdate(
            {
                student: req.user.id,
                supervisor: supervisor._id,
                project: project._id
            },
            {
                student: req.user.id,
                supervisor: supervisor._id,
                project: project._id,
                message: `${student?.name || 'A student'} requested supervision for ${project.title}.`,
                status: 'Pending',
                decidedAt: null
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true
            }
        );

        res.json({
            message: `Supervision request sent to ${supervisor.name}.`,
            request: supervisionRequest,
            supervisor: {
                id: supervisor._id,
                name: supervisor.name,
                email: supervisor.email
            },
            project
        });
    } catch (err) {
        console.error('Supervision Request Error:', err.message);
        res.status(500).json({ message: 'Failed to send supervision request.' });
    }
});

// @route   GET /api/projects/supervision-requests
// @desc    Get pending supervision requests for logged-in supervisor
router.get('/supervision-requests', auth, async (req, res) => {
    if (req.user.role !== 'supervisor') {
        return res.status(403).json({ message: 'Only supervisors can view supervision requests.' });
    }

    try {
        const requests = await SupervisionRequest.find({
            supervisor: req.user.id,
            status: 'Pending'
        })
            .populate('student', 'name email')
            .populate('project', 'title groupName description members progress')
            .sort({ createdAt: -1 })
            .lean();

        res.json(
            requests.map((request) => ({
                id: request._id,
                studentName: request.student?.name || 'Unknown Student',
                studentEmail: request.student?.email || '',
                projectTitle: request.project?.title || 'Untitled Capstone Project',
                groupName: request.project?.groupName || 'Group',
                members: request.project?.members || 1,
                progress: request.project?.progress || 0,
                requestedAt: formatDate(request.createdAt),
                message: request.message || 'Requested supervision.'
            }))
        );
    } catch (err) {
        console.error('Fetch Requests Error:', err.message);
        res.status(500).json({ message: 'Failed to load supervision requests.' });
    }
});

// @route   PUT /api/projects/supervision-requests/:id
// @desc    Accept or reject a supervision request
router.put('/supervision-requests/:id', auth, async (req, res) => {
    const { status } = req.body;

    if (req.user.role !== 'supervisor') {
        return res.status(403).json({ message: 'Only supervisors can update supervision requests.' });
    }

    if (!['Accepted', 'Rejected'].includes(status)) {
        return res.status(400).json({ message: 'Request status must be Accepted or Rejected.' });
    }

    try {
        const request = await SupervisionRequest.findOne({
            _id: req.params.id,
            supervisor: req.user.id,
            status: 'Pending'
        })
            .populate('supervisor', 'name email')
            .populate('student', 'name email')
            .populate('project');

        if (!request) {
            return res.status(404).json({ message: 'Pending supervision request not found.' });
        }

        request.status = status;
        request.decidedAt = new Date();
        await request.save();

        if (status === 'Accepted' && request.project) {
            request.project.supervisor = request.supervisor.name;
            request.project.status = 'Approved';
            await request.project.save();

            await SupervisionRequest.updateMany(
                {
                    project: request.project._id,
                    _id: { $ne: request._id },
                    status: 'Pending'
                },
                {
                    status: 'Rejected',
                    decidedAt: new Date()
                }
            );
        }

        res.json({
            message:
                status === 'Accepted'
                    ? `Supervision request accepted for ${request.student?.name || 'student'}.`
                    : `Supervision request rejected for ${request.student?.name || 'student'}.`,
            request
        });
    } catch (err) {
        console.error('Update Request Error:', err.message);
        res.status(500).json({ message: 'Failed to update supervision request.' });
    }
});

// @route   PUT /api/projects/:id/status
// @desc    Update project status (SECURITY FIXED: Only Supervisor or Admin)
router.put('/:id/status', auth, async (req, res) => {
    // Role Authorization Check Added
    if (req.user.role !== 'supervisor' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Only supervisors or admins can update project status.' });
    }

    const { status, supervisor } = req.body;

    if (status && !['Pending', 'Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ msg: 'Invalid project status configuration.' });
    }

    try {
        // Bug Fix: Param ID checked safely
        let project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ msg: 'Project target not found.' });

        if (status) project.status = status;
        if (supervisor) project.supervisor = supervisor;

        await project.save();
        res.json(project);
    } catch (err) {
        console.error('Project Status Update Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/projects/dashboard/supervisor
// @desc    Get supervisor dashboard data

router.get('/dashboard/supervisor', auth, async (req, res) => {

    try {

        if (req.user.role !== 'supervisor') {
            return res.status(403).json({
                message: "Only supervisors can access this dashboard"
            });
        }


        const supervisor = await User.findById(req.user.id)
            .select('name email');


        const projects = await Project.find({
            supervisor: supervisor.name
        })
        .populate('student', 'name email')
        .lean();



        const projectIds = projects.map(
            project => project._id
        );


        const submissions = await Submission.find({
            project: {
                $in: projectIds
            }
        }).lean();



        res.json({

            supervisor: {
                name: supervisor.name,
                email: supervisor.email
            },


            statistics: {

                assignedGroups: projects.length,

                pendingSubmissions:
                    submissions.filter(
                        s => s.status === "Pending"
                    ).length,


                approvedSubmissions:
                    submissions.filter(
                        s => s.status === "Approved"
                    ).length,


                totalSubmissions:
                    submissions.length

            },


            groups: projects.map(project => ({

                id: project._id,

                title: project.title,

                groupName:
                    project.groupName || "Group 1",

                student:
                    project.student?.name || "Unknown",

                progress:
                    project.progress || 0,

                status:
                    project.status

            }))

        });



    } catch(err) {

        console.error(
            "Supervisor Dashboard Error:",
            err.message
        );


        res.status(500).json({
            message:
            "Failed to load supervisor dashboard"
        });

    }

});
// @route   GET /api/projects/dashboard/student
// @desc    Get complete student dashboard data
router.get('/dashboard/student', auth, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id).select('name email');
        const studentName = currentUser ? currentUser.name : 'Student';

        const project = await Project.findOne({ student: req.user.id }).populate('student', ['name', 'email']);

        if (!project) {
            return res.json({
                hasProject: false,
                user: {
                    name: studentName,
                    group: "No Group",
                    supervisor: "Pending Assignment",
                    term: "Summer 2026"
                },
                stats: {
                    progress: 0,
                    tasksCompleted: "0 / 0",
                    tasksSubtext: "No pending tasks",
                    totalMembers: 1,
                    submissions: 0,
                    lastSubmissionDate: 'No submissions yet'
                },
                milestones: [],
                weeklyActivity: [],
                teamMembers: buildTeamMembers(studentName, 1),
                tasks: []
            });
        }

        const submissions = await Submission.find({ project: project._id }).sort({ createdAt: -1 }).lean();
        const latestSubmission = submissions[0];
        const taskSummary = buildTaskSummary(submissions);
        const weeklyActivity = buildWeeklyActivity(submissions);
        const studentTasks = buildStudentTasks(submissions, project);
        const milestones = buildMilestones(submissions);

        res.json({
            hasProject: true,
            user: {
                name: project.student ? project.student.name : studentName,
                group: project.groupName || 'Group 1',
                supervisor: project.supervisor || 'Pending Assignment',
                term: "Summer 2026"
            },
            stats: { 
                progress: project.progress || 0,
                tasksCompleted: taskSummary.value,
                tasksSubtext: taskSummary.subtext, 
                totalMembers: project.members || 6,
                submissions: submissions.length,
                lastSubmissionDate: latestSubmission ? formatDate(latestSubmission.createdAt) : 'No submissions yet'
            },
            milestones,
            weeklyActivity,
            teamMembers: buildTeamMembers(project.student ? project.student.name : studentName, project.members || 6),
            tasks: studentTasks
        });

    } catch (err) {
        console.error('Student Dashboard Error:', err.message);
        res.status(500).json({ message: 'Server Error' });
    }
});

// @route   GET /api/projects/workspace
// @desc    Get project workspace data (SECURITY FIXED: Data Leak Protection)
router.get('/workspace', auth, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id).select('name email role').lean();

        if (!currentUser) {
            return res.status(404).json({ message: 'User account not found.' });
        }

        let project = null;

        if (req.user.role === 'student') {
            project = await Project.findOne({ student: req.user.id }).populate('student', 'name email').lean();
            // Data Leak Fix: Blind Group 1 fallback removed!
        } else if (req.user.role === 'supervisor') {
            const supervisorProjects = await Project.find().populate('student', 'name email').lean();
            project = supervisorProjects.find((item) => isProjectAssignedToSupervisor(item, currentUser));
        } else {
            project = await Project.findOne().populate('student', 'name email').lean();
        }

        // Return clean 404 response if no project belongs to the user
        if (!project) {
            return res.status(404).json({ message: 'No project workspace found for your account.' });
        }

        const submissions = await Submission.find({ project: project._id })
            .populate('submittedBy', 'name email')
            .sort({ createdAt: -1 })
            .lean();

        const milestoneTemplates = [
            { id: 'm1', title: 'Project Proposal', due: 'Mar 10, 2026', keywords: ['proposal'] },
            { id: 'm2', title: 'Literature Review', due: 'Apr 5, 2026', keywords: ['literature'] },
            { id: 'm3', title: 'SRS Documentation', due: 'May 1, 2026', keywords: ['srs', 'documentation'] },
            { id: 'm4', title: 'Sprint 1 Review', due: 'May 25, 2026', keywords: ['sprint 1'] },
            { id: 'm5', title: 'Sprint 2 Review', due: 'Jun 15, 2026', keywords: ['sprint 2'] },
            { id: 'm6', title: 'Prototype Demo', due: 'Jun 20, 2026', keywords: ['prototype', 'demo'] },
            { id: 'm7', title: 'Final Report', due: 'Jul 15, 2026', keywords: ['final', 'report'] }
        ];

        const getSubmissionTaskStatus = (status) => {
            const normalizedStatus = String(status || '').toLowerCase();
            if (['approved', 'reviewed'].includes(normalizedStatus)) return 'done';
            if (normalizedStatus === 'revision requested') return 'overdue';
            return 'pending';
        };

        const milestones = milestoneTemplates.map((milestone) => {
            const matchedSubmissions = submissions.filter((submission) => {
                const title = String(submission.title || '').toLowerCase();
                return milestone.keywords.some((keyword) => title.includes(keyword));
            });

            const tasks = matchedSubmissions.map((submission, index) => ({
                id: String(submission._id || index + 1),
                title: submission.title,
                assignee: submission.submittedBy?.name || project.student?.name || 'Group',
                priority: submission.status === 'Revision Requested' ? 'high' : submission.status === 'Pending' ? 'medium' : 'low',
                status: getSubmissionTaskStatus(submission.status),
                due: formatDate(submission.createdAt),
                submissions: 1
            }));

            const hasDoneTask = tasks.some((task) => task.status === 'done');
            const hasActiveTask = tasks.some((task) => task.status !== 'done');
            const status = hasActiveTask ? 'active' : hasDoneTask ? 'approved' : 'upcoming';

            return {
                ...milestone,
                status,
                tasks
            };
        });

        const allTasks = milestones.flatMap((milestone) => milestone.tasks);
        const completedTasks = allTasks.filter((task) => task.status === 'done').length;
        const inProgressTasks = allTasks.filter((task) => task.status === 'pending').length;
        const overdueTasks = allTasks.filter((task) => task.status === 'overdue').length;
        const nextMilestone = milestones.find((milestone) => milestone.status === 'active') || milestones.find((milestone) => milestone.status === 'upcoming');

        const feedback = submissions
            .filter((submission) => submission.feedback || submission.status !== 'Pending')
            .slice(0, 5)
            .map((submission) => ({
                author: project.supervisor || 'Supervisor',
                time: formatDate(submission.updatedAt || submission.createdAt),
                text: submission.feedback || `${submission.title} has been reviewed by the supervisor.`
            }));

        const submissionHistory = submissions.map((submission) => ({
            task: submission.title,
            submittedBy: submission.submittedBy?.name || 'Unknown Student',
            date: formatDate(submission.createdAt),
            status: submission.status === 'Revision Requested' ? 'Revision Needed' : ['Approved', 'Reviewed'].includes(submission.status) ? 'Approved' : 'Pending Review',
            feedback: submission.feedback ? 'View' : submission.status === 'Pending' ? 'Pending' : 'View'
        }));

        res.json({
            project: {
                id: project._id,
                title: project.title,
                description: project.description,
                groupName: project.groupName || 'Group 1',
                supervisor: project.supervisor || 'Not Assigned Yet',
                studentName: project.student?.name || currentUser.name,
                progress: project.progress || 0,
                members: project.members || 1,
                status: project.status || 'Pending',
                sprint: 'Sprint 1 Active'
            },
            stats: {
                totalTasks: allTasks.length,
                completedTasks,
                inProgressTasks,
                overdueTasks,
                nextDeadline: nextMilestone?.due || 'No upcoming deadline',
                nextDeadlineTitle: nextMilestone?.title || 'All milestones reviewed'
            },
            milestones,
            feedback,
            submissionHistory
        });
    } catch (err) {
        console.error('Workspace Load Error:', err.message);
        res.status(500).json({ message: 'Failed to load project workspace.' });
    }
});

module.exports = router;
