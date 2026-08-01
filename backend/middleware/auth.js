const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
    const token = req.header('x-auth-token');

    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        const user = await User.findById(decoded.user.id).select('_id role isActive');

        if (!user) {
            return res.status(401).json({ message: 'User account no longer exists.' });
        }

        if (user.isActive === false) {
            return res.status(403).json({ message: 'Your account has been deactivated. Contact the department administrator.' });
        }

        req.user = {
            id: String(user._id),
            role: user.role
        };

        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token is not valid' });
    }
};
