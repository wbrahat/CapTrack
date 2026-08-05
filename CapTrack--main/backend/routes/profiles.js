const express = require('express');
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const Submission = require('../models/Submission');
const User = require('../models/User');

const router = express.Router();

function formatDate(date) {
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

function hashString(value) {
    return String(value || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

function buildEmailSlug(name) {
    return String(name || 'user')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/^\.|\.$/g, '');
}

function buildDeterministicCgpa(name) {
    const base = 3.4;
    const fraction = (hashString(name) % 51) / 100;
    return Math.min(3.99, Number((base + fraction).toFixed(2)));
}

function buildCredits(name) {
    return 96 + (hashString(name) % 35);
}

function buildSkillSet(userName, userSkills = [], projectTitle = '', assigned = false) {
    if (Array.isArray(userSkills) && userSkills.length > 0) {
        return userSkills;
    }
    const pool = [
        'React',
        'Node.js',
        'MongoDB',
        'Python',
        'Java',
        'TypeScript',
        'UI/UX Design',
        'Machine Learning',
        'Data Science',
        'REST APIs',
        'Tailwind CSS',
        'Firebase',
        'Android',
        'Cybersecurity',
        'Docker'
    ];
    const nameHash = hashString(userName + projectTitle);
    const baseIndex = nameHash % pool.length;
    const skills = [];
    for (let i = 0; i < 5; i++) {
        skills.push(pool[(baseIndex + i * 2) % pool.length]);
    }
    if (projectTitle) {
        const lower = projectTitle.toLowerCase();
        if (lower.includes('ai') || lower.includes('machine')) skills.unshift('Machine Learning');
        if (lower.includes('attendance') || lower.includes('management')) skills.unshift('React');
        if (lower.includes('dashboard')) skills.unshift('Data Visualization');
        if (lower.includes('security')) skills.unshift('Cybersecurity');
    }
    if (assigned) {
        skills.unshift('Team Collaboration');
    }
    return [...new Set(skills)].slice(0, 5);
}

function buildResearchInterest(userName, projectTitle = '') {
    const text = String(projectTitle || '').toLowerCase();
    if (text.includes('attendance')) return 'Web-based project tracking and team workflow systems';
    if (text.includes('library')) return 'Software engineering and scheduling systems';
    if (text.includes('security')) return 'Network security and ethical systems';
    if (text.includes('medical') || text.includes('hospital')) return 'Database-driven healthcare applications';
    if (text.includes('dashboard') || text.includes('analytics')) return 'Data visualization and decision support systems';
    if (text.includes('ai') || text.includes('machine')) return 'Machine learning and intelligent web applications';
    const nameHash = hashString(userName);
    const options = [
        'Full-stack web development and capstone workflow tools',
        'Frontend design systems and accessibility',
        'Backend APIs and data modeling',
        'Research documentation and academic systems',
        'Mobile and cloud application development'
    ];
    return options[nameHash % options.length];
}

function buildStudentSummary(users, projects, submissions) {
    const projectMap = new Map();
    projects.forEach((project) => {
        if (project.student) {
            projectMap.set(String(project.student), project);
        }
    });
    const submissionMap = new Map();
    submissions.forEach((submission) => {
        const key = String(submission.submittedBy?._id || submission.submittedBy || '');
        if (!submissionMap.has(key)) submissionMap.set(key, []);
        submissionMap.get(key).push(submission);
    });

    const visibleUsers = users.filter((user) => {
        if (user.privacyPreferences && user.privacyPreferences.profileVisibility === false) {
            return false;
        }
        return true;
    });

    const profiles = visibleUsers.map((user, index) => {
        const name = user.name || `Student ${index + 1}`;
        const email = user.email || '';
        const _id = user._id;
        const project = projectMap.get(String(_id));
        const studentSubmissions = submissionMap.get(String(_id)) || [];
        const latestSubmission = studentSubmissions[0];
        const assigned = Boolean(project);
        const title = project?.title || '';
        const skills = buildSkillSet(name, user.skills, title, assigned);
        const githubSlug = buildEmailSlug(name);

        // FIX: Normalize team status string to 'In Team' or 'Open' consistently
        const rawStatus = user.teamStatus || '';
        const isInTeam = assigned || rawStatus === 'In a Team' || rawStatus === 'In Team';
        const finalStatus = isInTeam ? 'In Team' : 'Open';

        return {
            id: email || String(_id),
            userId: String(_id),
            name,
            department: 'CSE',
            semester: user.capstoneSemester || 'Summer 2026',
            cgpa: typeof user.cgpa === 'number' ? user.cgpa : buildDeterministicCgpa(name),
            credits: typeof user.credits === 'number' ? user.credits : buildCredits(name),
            avatar: getInitials(name),
            skills,
            research: typeof user.researchInterest === 'string' && user.researchInterest.trim() !== '' 
                ? user.researchInterest 
                : buildResearchInterest(name, title),
            status: finalStatus, // Always returns 'In Team' or 'Open'
            github: user.github || `github.com/${githubSlug}`,
            linkedin: user.linkedin || `linkedin.com/in/${githubSlug}`,
            groupName: project?.groupName || (isInTeam ? 'In Team' : 'Open Student'),
            projectTitle: title || 'No project assigned yet',
            supervisor: project?.supervisor || 'Not Assigned Yet',
            progress: project?.progress || 0,
            submissions: studentSubmissions.length,
            lastUpdate: latestSubmission ? formatDate(latestSubmission.createdAt) : 'No submissions yet'
        };
    });

    const skillFrequency = new Map();
    profiles.forEach((profile) => {
        profile.skills.forEach((skill) => {
            skillFrequency.set(skill, (skillFrequency.get(skill) || 0) + 1);
        });
    });
    const topSkills = Array.from(skillFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 9)
        .map(([skill]) => skill);

    return { profiles, topSkills };
}

function buildSupervisorFocus(name, projects) {
    const baseTitles = projects.slice(0, 3).map((p) => p.title).join(' ').toLowerCase();
    const pool = [
        'Web Engineering',
        'Software Architecture',
        'Cloud Computing',
        'Machine Learning',
        'Computer Vision',
        'NLP',
        'Cybersecurity',
        'Network Security',
        'Data Science',
        'Big Data',
        'Mobile Development',
        'IoT'
    ];
    const hash = hashString(name + baseTitles);
    const focus = [];
    for (let i = 0; i < 3; i++) {
        focus.push(pool[(hash + i * 3) % pool.length]);
    }
    return focus;
}

function buildSupervisorInterest(name, projects) {
    const focus = buildSupervisorFocus(name, projects).join(', ');
    if (focus) return `Research supervision focused on ${focus.toLowerCase()} and capstone project mentoring.`;
    return 'Research supervision and capstone mentoring across software and data-driven systems.';
}

function buildSupervisorPastProjects(projects) {
    return projects.slice(0, 3).map((project) => ({
        semester: 'Summer 2026',
        title: project.title,
        team: project.groupName || 'Group',
        members: project.members || 0
    }));
}

function buildSupervisorCard(supervisor, projects) {
    const sup = {
        _id: supervisor._id,
        name: supervisor.name || 'Unnamed Supervisor',
        email: supervisor.email || '',
        designation: supervisor.designation || 'Faculty Supervisor',
        department: supervisor.department || 'CSE'
    };
    const assignedProjects = projects.filter((project) => {
        const assignedSupervisor = String(project.supervisor || '').toLowerCase();
        const name = String(sup.name).toLowerCase();
        const email = String(sup.email).toLowerCase();
        return assignedSupervisor === name || assignedSupervisor === email;
    });
    const slotsTotal = 5;
    const slotsTaken = assignedProjects.length;
    const remaining = Math.max(slotsTotal - slotsTaken, 0);
    const status = slotsTaken >= slotsTotal ? 'full' : remaining <= 2 ? 'limited' : 'available';
    const expertise = buildSupervisorFocus(sup.name, assignedProjects);
    return {
        id: String(sup._id),
        name: sup.name,
        designation: sup.designation,
        department: sup.department,
        email: sup.email,
        avatar: getInitials(sup.name),
        expertise,
        researchInterests: buildSupervisorInterest(sup.name, assignedProjects),
        slotsTotal,
        slotsTaken,
        remaining,
        status,
        pastProjects: buildSupervisorPastProjects(assignedProjects),
        projectCount: assignedProjects.length,
        lastActivity: assignedProjects[0] ? formatDate(assignedProjects[0].createdAt) : 'No project assigned yet'
    };
}

router.get('/overview', async (req, res) => {
    try {
        const currentUser = req.user ? await User.findById(req.user.id).select('name email role').lean() : null;
        if (req.user && !currentUser) {
            return res.status(404).json({ message: 'User account not found.' });
        }
        const viewerInfo = currentUser ? { name: currentUser.name, email: currentUser.email, role: currentUser.role } : null;
        
        const [users, projects] = await Promise.all([
            User.find({ role: 'student' })
                .select('name email role createdAt cgpa credits capstoneSemester researchInterest github linkedin portfolio skills teamStatus privacyPreferences')
                .lean(),
            Project.find().select('title groupName members progress supervisor status student createdAt').lean()
        ]);

        const submissions = await Submission.find({ submittedBy: { $in: users.map((u) => u._id) } })
            .populate('submittedBy', 'name email')
            .populate('project', 'title groupName supervisor')
            .sort({ createdAt: -1 })
            .lean();

        const { profiles, topSkills } = buildStudentSummary(users, projects, submissions);

        res.json({
            viewer: viewerInfo,
            stats: {
                totalStudents: profiles.length,
                openStudents: profiles.filter((p) => p.status === 'Open').length,
                inTeamStudents: profiles.filter((p) => p.status === 'In Team').length
            },
            profiles,
            topSkills
        });
    } catch (err) {
        console.error('Directory Fetch Error:', err);
        res.status(500).json({ message: 'Failed to load student profiles.' });
    }
});

router.get('/supervisors', async (req, res) => {
    try {
        const currentUser = req.user ? await User.findById(req.user.id).select('name email role').lean() : null;
        const viewerInfo = currentUser ? { name: currentUser.name, email: currentUser.email, role: currentUser.role } : null;
        const [supervisors, projects, students] = await Promise.all([
            User.find({ role: 'supervisor' }).select('name email designation department').lean(),
            Project.find().select('title groupName members progress supervisor status createdAt').lean(),
            User.find({ role: 'student' }).select('_id').lean()
        ]);
        const supervisorCards = supervisors.map((sup) => buildSupervisorCard(sup, projects));
        const available = supervisorCards.filter((c) => c.status === 'available').length;
        const limited = supervisorCards.filter((c) => c.status === 'limited').length;
        const full = supervisorCards.filter((c) => c.status === 'full').length;
        const totalAssignments = supervisorCards.reduce((sum, c) => sum + c.slotsTaken, 0);
        const uniqueTopics = Array.from(new Set(projects.map((p) => p.title))).slice(0, 6);
        res.json({
            viewer: viewerInfo,
            stats: {
                totalSupervisors: supervisorCards.length,
                available,
                limited,
                full,
                totalAssignments,
                totalStudents: students.length
            },
            supervisors: supervisorCards,
            topics: uniqueTopics
        });
    } catch (err) {
        console.error('Directory Fetch Error:', err);
        res.status(500).json({ message: 'Failed to load supervisor directory.' });
    }
});

module.exports = router;