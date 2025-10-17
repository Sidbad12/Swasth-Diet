const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    // Get token from header (usually sent as 'x-auth-token')
    const token = req.header('x-auth-token');

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach user object (with user ID) to the request
        req.user = decoded.user; 
        next();
    } catch (err) {
        // Token is not valid (expired, corrupted, etc.)
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
