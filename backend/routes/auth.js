const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');

function isValidEmailForRole(email, role) {
    if (role === 'student') {
        return email.endsWith('@std.ewubd.edu');
    }

    if (role === 'supervisor' || role === 'admin') {
        return email.endsWith('@ewubd.edu');
    }

    return false;
}

// @route   POST /api/auth/register
// @desc    Register a new user (Student/Supervisor)
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const normalizedEmail = String(email || '').toLowerCase().trim();
        const selectedRole = role || 'student';

        if (!name || !normalizedEmail || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required.' });
        }

        if (!['student', 'supervisor'].includes(selectedRole)) {
            return res.status(400).json({ message: 'Only student and supervisor accounts can be created from registration.' });
        }

        if (selectedRole === 'student' && !normalizedEmail.endsWith('@std.ewubd.edu')) {
            return res.status(400).json({ message: 'Student accounts must use an EWU student email ending with @std.ewubd.edu.' });
        }

        if (selectedRole === 'supervisor' && !normalizedEmail.endsWith('@ewubd.edu')) {
            return res.status(400).json({ message: 'Supervisor accounts must use an EWU faculty email ending with @ewubd.edu.' });
        }

        let user = await User.findOne({ email: normalizedEmail });
        if (user) {
            return res.status(400).json({ message: 'User already exists with this email.' });
        }

        user = new User({ name, email: normalizedEmail, password, role: selectedRole });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();
        res.status(201).json({ message: 'Account created successfully.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server configuration execution layer error');
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token (Login)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const normalizedEmail = String(email || '').toLowerCase().trim();

        let user = await User.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        if (!isValidEmailForRole(user.email, user.role)) {
            return res.status(403).json({
                message: 'This account does not use a valid East West University email domain.'
            });
        }

        if (user.isActive === false) {
            return res.status(403).json({
                message: 'Your account has been deactivated. Contact the department administrator.'
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    },
                    message: 'Login successful!'
                });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/auth/me
// @desc    Get current user profile data (Secure/Protected)
// FIX: Added null-user guard for legacy/deleted accounts so a missing
//      document returns 404 instead of crashing on user.toObject().
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');

        // Guard: user document may not exist (legacy token for deleted account).
        if (!user) {
            return res.status(404).json({ message: 'User account not found. Please log in again.' });
        }

        const safeUser = user.toObject();

        // Inject safe defaults for fields that may be missing on legacy documents.
        safeUser.cgpa              = safeUser.cgpa    != null ? safeUser.cgpa    : '';
        safeUser.credits           = safeUser.credits != null ? safeUser.credits : 0;
        safeUser.capstoneSemester  = safeUser.capstoneSemester  || '';
        safeUser.researchInterest  = safeUser.researchInterest  || '';
        safeUser.github            = safeUser.github            || '';
        safeUser.linkedin          = safeUser.linkedin          || '';
        safeUser.portfolio         = safeUser.portfolio         || '';
        safeUser.skills            = Array.isArray(safeUser.skills) ? safeUser.skills : [];
        safeUser.teamStatus        = safeUser.teamStatus        || '';

        // Ensure nested preference objects always exist for the frontend.
        safeUser.profileSettings = safeUser.profileSettings || {
            institution: 'East West University',
            department:  'Computer Science and Engineering',
            system:      'CapTrack',
        };
        safeUser.notificationPreferences = safeUser.notificationPreferences || {
            submissionUpdates:  true,
            milestoneReminders: true,
            supervisorFeedback: true,
            collaborationFeed:  false,
        };
        safeUser.privacyPreferences = safeUser.privacyPreferences || {
            profileVisibility: true,
            projectVisibility: true,
            archivePermission: true,
        };
        safeUser.systemPreferences = safeUser.systemPreferences || {
            emailAlerts:          true,
            inAppNotifications:   true,
            autoSaveFeedback:     true,
        };

        res.status(200).json(safeUser);

    } catch (err) {
        console.error('Settings Load Error (GET /auth/me):', err.message);
        res.status(500).json({ message: 'Failed to load settings from the server.' });
    }
});

// @route   PUT /api/auth/me
// @desc    Update the current user's profile and preference settings
router.put('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const {
            name,
            profileSettings,
            notificationPreferences,
            privacyPreferences,
            systemPreferences,
            cgpa,
            credits,
            capstoneSemester,
            researchInterest,
            github,
            linkedin,
            portfolio,
            skills,
            teamStatus,
        } = req.body || {};

        if (typeof name === 'string' && name.trim()) {
            user.name = name.trim();
        }

        if (profileSettings && typeof profileSettings === 'object') {
            user.profileSettings = {
                ...user.profileSettings?.toObject?.(),
                ...profileSettings,
            };
        }

        if (notificationPreferences && typeof notificationPreferences === 'object') {
            user.notificationPreferences = {
                ...user.notificationPreferences?.toObject?.(),
                ...notificationPreferences,
            };
        }

        if (privacyPreferences && typeof privacyPreferences === 'object') {
            user.privacyPreferences = {
                ...user.privacyPreferences?.toObject?.(),
                ...privacyPreferences,
            };
        }

        if (systemPreferences && typeof systemPreferences === 'object') {
            user.systemPreferences = {
                ...user.systemPreferences?.toObject?.(),
                ...systemPreferences,
            };
        }

        if (typeof cgpa === 'number')             user.cgpa             = cgpa;
        if (typeof credits === 'number')          user.credits          = credits;
        if (typeof capstoneSemester === 'string') user.capstoneSemester = capstoneSemester;
        if (typeof researchInterest === 'string') user.researchInterest = researchInterest;
        if (typeof github === 'string')           user.github           = github;
        if (typeof linkedin === 'string')         user.linkedin         = linkedin;
        if (typeof portfolio === 'string')        user.portfolio        = portfolio;
        if (Array.isArray(skills))                user.skills           = skills;
        if (typeof teamStatus === 'string')       user.teamStatus       = teamStatus;

        await user.save();

        const userDoc   = await User.findById(req.user.id).select('-password');
        const safeUser  = userDoc?.toObject?.() || {};

        safeUser.cgpa              = safeUser.cgpa    != null ? safeUser.cgpa    : '';
        safeUser.credits           = safeUser.credits != null ? safeUser.credits : 0;
        safeUser.capstoneSemester  = safeUser.capstoneSemester  || '';
        safeUser.researchInterest  = safeUser.researchInterest  || '';
        safeUser.github            = safeUser.github            || '';
        safeUser.linkedin          = safeUser.linkedin          || '';
        safeUser.portfolio         = safeUser.portfolio         || '';
        safeUser.skills            = Array.isArray(safeUser.skills) ? safeUser.skills : [];
        safeUser.teamStatus        = safeUser.teamStatus        || '';

        res.json({
            message: 'Profile updated successfully.',
            user: safeUser,
        });

    } catch (err) {
        console.error('Settings Save Error (PUT /auth/me):', err.message);
        res.status(500).json({ message: 'Failed to save settings to the server.' });
    }
});

module.exports = router;
