const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const CollaborationPost = require('../models/CollaborationPost');
const User = require('../models/User');
const ActivityNotification = require('../models/ActivityNotification');
const auth = require('../middleware/auth');

const seedPosts = [
    {
        type: 'supervisor',
        author: 'Ahmed Adnan',
        authorRole: 'Lecturer, CSE',
        avatar: 'AA',
        timeLabel: '2 hours ago',
        title: 'Looking for a team to build a Capstone Project Lifecycle Management System',
        body: 'I am seeking a group of 5–6 motivated students for a project focused on web-based capstone management. The system will manage student profiling, team formation, progress tracking, and evaluation workflows. Students should have prior experience with full-stack web development.',
        projectTopic: 'Web-Based Project Management Platform',
        researchArea: 'Software Engineering & Educational Technology',
        teamSize: '5–6 students',
        skills: ['React', 'Node.js', 'PostgreSQL', 'REST APIs', 'UI/UX'],
        baseLikes: 24,
        baseComments: 8,
    },
    {
        type: 'student',
        author: 'Arif Hossain',
        authorRole: 'Student · 2023-1-60-112',
        avatar: 'AH',
        timeLabel: '5 hours ago',
        title: 'Team of 4 seeking 1 more — AI Chatbot for Student Support',
        body: 'We are building an intelligent chatbot that can answer student queries about university regulations, course registrations, and academic policies. We currently have 4 members and need 1 more with experience in NLP or LLM fine-tuning.',
        projectIdea: 'University AI Support Chatbot',
        currentTeamSize: '4 / 5',
        lookingFor: 'NLP Engineer',
        skills: ['Python', 'LangChain', 'NLP', 'FastAPI', 'React'],
        baseLikes: 17,
        baseComments: 5,
        savedBy: [],
    },
    {
        type: 'supervisor',
        author: 'Dr. Nazmul Karim',
        authorRole: 'Professor, CSE',
        avatar: 'NK',
        timeLabel: '1 day ago',
        title: 'Research opportunity: Lightweight Intrusion Detection using Federated Learning',
        body: 'Seeking a team interested in cybersecurity research. The project involves designing a federated learning-based IDS for IoT networks, minimizing data sharing while maintaining detection accuracy. Strong interest in network security or ML is required.',
        projectTopic: 'Federated IDS for IoT Networks',
        researchArea: 'Cybersecurity & Machine Learning',
        teamSize: '4–5 students',
        skills: ['Python', 'TensorFlow', 'Network Security', 'Federated Learning', 'Linux'],
        baseLikes: 31,
        baseComments: 12,
    },
    {
        type: 'student',
        author: 'Farida Khanam',
        authorRole: 'Student · 2023-2-60-201',
        avatar: 'FK',
        timeLabel: '2 days ago',
        title: 'Forming a group — HealthTrack: Predictive Health Analytics Dashboard',
        body: 'Looking for teammates to collaborate on a healthcare analytics platform that uses historical patient data to predict disease risk and surface actionable insights. Currently 2 members. Need 2–3 more with data science or backend skills.',
        projectIdea: 'HealthTrack: Predictive Health Analytics',
        currentTeamSize: '2 / 5',
        lookingFor: 'Data Scientists & Backend Developers',
        skills: ['Python', 'Pandas', 'Scikit-learn', 'Django', 'Tableau'],
        baseLikes: 9,
        baseComments: 3,
    },
    {
        type: 'supervisor',
        author: 'Dr. Farzana Haque',
        authorRole: 'Assistant Professor, CSE',
        avatar: 'FH',
        timeLabel: '3 days ago',
        title: 'Open slot: Real-Time Business Intelligence Platform for SMEs',
        body: 'I have one supervision slot remaining for a team interested in building a BI platform targeting small and medium enterprises. The project will focus on data ingestion, transformation, and interactive dashboards. Business and data skills both welcome.',
        projectTopic: 'SME Business Intelligence Platform',
        researchArea: 'Data Engineering & Business Analytics',
        teamSize: '4–6 students',
        skills: ['SQL', 'Apache Kafka', 'Python', 'Power BI', 'React'],
        baseLikes: 14,
        baseComments: 6,
    },
];

function hoursAgo(hours) {
    return new Date(Date.now() - hours * 60 * 60 * 1000);
}

function daysAgo(days) {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function seedDateFromLabel(label) {
    if (label === '2 hours ago') return hoursAgo(2);
    if (label === '5 hours ago') return hoursAgo(5);
    if (label === '1 day ago')   return daysAgo(1);
    if (label === '2 days ago')  return daysAgo(2);
    if (label === '3 days ago')  return daysAgo(3);
    return new Date();
}

async function ensureSeedPosts() {
    const count = await CollaborationPost.countDocuments();
    if (count > 0) return;

    const docs = seedPosts.map((post) => ({
        ...post,
        createdAt: seedDateFromLabel(post.timeLabel),
        updatedAt: seedDateFromLabel(post.timeLabel),
    }));

    await CollaborationPost.insertMany(docs);
}

function formatRelativeTime(dateValue) {
    const date = new Date(dateValue);
    const diffMs = Date.now() - date.getTime();
    const diffMinutes = Math.max(1, Math.round(diffMs / 60000));

    if (diffMinutes < 60) {
        return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    }

    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) {
        return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    }

    const diffDays = Math.round(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

function toClientPost(post, userId) {
    const likedBy     = Array.isArray(post.likedBy)     ? post.likedBy     : [];
    const savedBy     = Array.isArray(post.savedBy)     ? post.savedBy     : [];
    const joinedBy    = Array.isArray(post.joinedBy)    ? post.joinedBy    : [];
    const requestedBy = Array.isArray(post.requestedBy) ? post.requestedBy : [];
    const comments    = Array.isArray(post.comments)    ? post.comments    : [];

    const liked     = userId ? likedBy.some((id) => String(id) === String(userId))     : false;
    const saved     = userId ? savedBy.some((id) => String(id) === String(userId))     : false;
    const joined    = userId ? joinedBy.some((id) => String(id) === String(userId))    : false;
    const requested = userId ? requestedBy.some((id) => String(id) === String(userId)) : false;

    return {
        id:              String(post._id),
        type:            post.type,
        isSupervisorPost: post.isSupervisorPost,
        postType:        post.postType,
        author:          post.author,
        authorRole:      post.authorRole,
        avatar:          post.avatar,
        time:            formatRelativeTime(post.createdAt),
        title:           post.title,
        body:            post.body,
        projectTopic:    post.projectTopic || '',
        researchArea:    post.researchArea || '',
        teamSize:        post.teamSize || '',
        projectIdea:     post.projectIdea || '',
        currentTeamSize: post.currentTeamSize || '',
        lookingFor:      post.lookingFor || '',
        skills:          Array.isArray(post.skills) ? post.skills : [],
        likes:           (post.baseLikes || 0) + likedBy.length,
        comments:        (post.baseComments || 0) + comments.length,
        saved,
        liked,
        joined,
        requested,
        commentItems: comments.map((comment) => ({
            id:         String(comment._id),
            authorName: comment.authorName || 'Anonymous',
            text:       comment.text,
            createdAt:  comment.createdAt,
        })),
    };
}

// @route   GET /api/feed
// @desc    Get all collaboration posts (With optional auth checking)
router.get('/', async (req, res) => {
    try {
        await ensureSeedPosts();

        // Optional token check to determine if current user has liked/saved posts
        let userId = null;
        const authHeader = req.header('Authorization') || req.header('x-auth-token');
        if (authHeader) {
            try {
                const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
                userId = decoded.user ? decoded.user.id : decoded.id;
            } catch (tokenErr) {
                // Token invalid or expired - proceed as unauthenticated guest
            }
        }

        const posts = await CollaborationPost.find().sort({ createdAt: -1 });
        res.json({ posts: posts.map((post) => toClientPost(post, userId)) });
    } catch (err) {
        console.error('Feed Load Error:', err.message);
        res.status(500).json({ message: 'Failed to load collaboration feed.' });
    }
});

// @route   POST /api/feed
// @desc    Create a new collaboration post
router.post('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('name role');

        if (!user) {
            return res.status(404).json({ message: 'Current user not found.' });
        }

        const {
            title,
            body,
            topic,
            projectTopic,
            researchArea,
            projectIdea,
            teamSize,
            currentTeamSize,
            lookingFor,
            skills
        } = req.body || {};

        if (!String(title || '').trim() || !String(body || '').trim()) {
            return res.status(400).json({ message: 'Title and body are required.' });
        }

        const isSupervisorPost = user.role === 'supervisor';
        const postType = isSupervisorPost ? 'supervisor_recruitment' : 'student_team_up';

        // Safe skill parsing (Array or Comma-separated String)
        let parsedSkills = [];
        if (Array.isArray(skills)) {
            parsedSkills = skills.map((s) => String(s).trim()).filter(Boolean);
        } else if (typeof skills === 'string') {
            parsedSkills = skills.split(',').map((skill) => skill.trim()).filter(Boolean);
        }

        // Clean field extraction with smart fallbacks
        const finalTopic = String(projectTopic || topic || '').trim();
        const finalResearchArea = String(researchArea || topic || '').trim();
        const finalProjectIdea = String(projectIdea || topic || '').trim();
        const finalTeamSize = String(teamSize || '').trim();
        const finalCurrentTeamSize = String(currentTeamSize || teamSize || '').trim();
        const finalLookingFor = String(lookingFor || (typeof skills === 'string' ? skills : parsedSkills.join(', ')) || '').trim();

        const post = await CollaborationPost.create({
            type:            isSupervisorPost ? 'supervisor' : 'student',
            isSupervisorPost,
            postType,
            author:          user.name,
            authorId:        user._id,
            authorRole:      isSupervisorPost ? 'Supervisor, CSE' : 'Student, CapTrack',
            avatar:          String(user.name || 'CT')
                                 .split(' ')
                                 .map((part) => part[0])
                                 .slice(0, 2)
                                 .join('')
                                 .toUpperCase(),
            timeLabel:       'just now',
            title:           String(title).trim(),
            body:            String(body).trim(),
            projectTopic:    finalTopic,
            researchArea:    finalResearchArea,
            teamSize:        finalTeamSize,
            projectIdea:     finalProjectIdea,
            currentTeamSize: finalCurrentTeamSize,
            lookingFor:      finalLookingFor,
            skills:          parsedSkills,
        });

        res.status(201).json({ post: toClientPost(post, req.user.id) });
    } catch (err) {
        console.error('Feed Post Create Error:', err.message);
        res.status(500).json({ message: 'Failed to publish post.' });
    }
});

// @route   POST /api/feed/:id/like
// @desc    Toggle like on a post
router.post('/:id/like', auth, async (req, res) => {
    try {
        const post = await CollaborationPost.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        if (!Array.isArray(post.likedBy)) post.likedBy = [];

        const userId = String(req.user.id);
        const index  = post.likedBy.findIndex((id) => String(id) === userId);

        if (index >= 0) {
            post.likedBy.splice(index, 1);
        } else {
            post.likedBy.push(userId);
        }

        await post.save();
        res.json({ post: toClientPost(post, userId) });
    } catch (err) {
        console.error('Post Action Error:', err.message);
        res.status(500).json({ message: 'Failed to update like state.' });
    }
});

// @route   POST /api/feed/:id/save
// @desc    Toggle save on a post
router.post('/:id/save', auth, async (req, res) => {
    try {
        const post = await CollaborationPost.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        if (!Array.isArray(post.savedBy)) post.savedBy = [];

        const userId = String(req.user.id);
        const index  = post.savedBy.findIndex((id) => String(id) === userId);

        if (index >= 0) {
            post.savedBy.splice(index, 1);
        } else {
            post.savedBy.push(userId);
        }

        await post.save();
        res.json({ post: toClientPost(post, userId) });
    } catch (err) {
        console.error('Post Action Error:', err.message);
        res.status(500).json({ message: 'Failed to update save state.' });
    }
});

// @route   POST /api/feed/:id/action
// @desc    Toggle join/request on a post (primary CTA) & record Activity safely
router.post('/:id/action', auth, async (req, res) => {
    try {
        const post = await CollaborationPost.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        const userId        = String(req.user.id);
        const { action }    = req.body || {};
        const allowedAction = post.type === 'supervisor' ? 'request' : 'join';

        if (action !== allowedAction) {
            return res.status(400).json({ message: 'Invalid action for this post type.' });
        }

        const fieldName = action === 'request' ? 'requestedBy' : 'joinedBy';

        if (!Array.isArray(post[fieldName])) post[fieldName] = [];

        const targetList = post[fieldName];
        const index      = targetList.findIndex((id) => String(id) === userId);

        let isAdding = false;

        if (index >= 0) {
            targetList.splice(index, 1);
        } else {
            targetList.push(userId);
            isAdding = true;
        }

        await post.save();

        if (isAdding) {
            try {
                const isRequest  = action === 'request';
                const senderUser = await User.findById(req.user.id).select('name');
                const senderName = senderUser ? senderUser.name : 'A student';

                // ১. Sender Log (নোটিফিকেশন রিসিভ করবে যে রিকোয়েস্ট পাঠানো হয়েছে)
                await ActivityNotification.create({
                    recipient: req.user.id,
                    type: 'system',
                    title: isRequest ? 'Application Submitted' : 'Team Join Request Sent',
                    body: isRequest 
                        ? `You applied to supervisor post: "${post.title}"`
                        : `You requested to join team for: "${post.title}"`,
                    sender: req.user.id,
                    senderName: senderName,
                    status: 'unread',
                    actionStatus: 'none'
                });

                // ২. Receiver Log (পোস্টের ওনার পাবে Accept/Decline বাটন সহ)
                if (post.authorId && String(post.authorId) !== userId) {
                    await ActivityNotification.create({
                        recipient: post.authorId,
                        type: 'team_invite',
                        title: isRequest ? 'New Student Application' : 'New Team Join Request',
                        body: `${senderName} requested to join your post: "${post.title}"`,
                        sender: req.user.id,
                        senderName: senderName,
                        status: 'unread',
                        actionStatus: 'pending'
                    });
                }
            } catch (notifErr) {
                console.error('Notification Log Warning:', notifErr.message);
            }
        }

        res.json({ post: toClientPost(post, userId) });
    } catch (err) {
        console.error('Post Action Error:', err.message);
        res.status(500).json({ message: 'Failed to update the post action.' });
    }
});

// @route   POST /api/feed/:id/comments
// @desc    Add a comment to a post
router.post('/:id/comments', auth, async (req, res) => {
    try {
        const post = await CollaborationPost.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Post not found.' });
        }

        const commentText = String(req.body?.text || '').trim();
        if (!commentText) {
            return res.status(400).json({ message: 'Comment text is required.' });
        }

        if (!Array.isArray(post.comments)) post.comments = [];

        const user = await User.findById(req.user.id).select('name');
        post.comments.push({
            authorId:   req.user.id,
            authorName: user?.name || 'Anonymous',
            text:       commentText,
        });

        await post.save();
        res.status(201).json({ post: toClientPost(post, req.user.id) });
    } catch (err) {
        console.error('Post Action Error:', err.message);
        res.status(500).json({ message: 'Failed to save comment.' });
    }
});

module.exports = router;