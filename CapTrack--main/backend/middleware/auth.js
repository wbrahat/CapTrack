const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    console.log(">>> 1. Auth Middleware Hit! <<<"); // চেক ১
    
    // Get token from header
    const token = req.header('x-auth-token');
    console.log(">>> 2. Received Token:", token);  // চেক ২

    // Check if no token
    if (!token) {
        console.log(">>> 3. Token Missing! <<<");
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        console.log(">>> 4. JWT Error:", err.message); // চেক ৩
        res.status(401).json({ message: 'Token is not valid' });
    }
};