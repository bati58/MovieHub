const jwt = require('jsonwebtoken');

function userAuth(req, res, next) {
    if (!process.env.USER_JWT_SECRET) {
        return res.status(500).json({ message: 'USER_JWT_SECRET not configured' });
    }
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    try {
        const payload = jwt.verify(token, process.env.USER_JWT_SECRET);
        req.user = payload;
        return next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

module.exports = userAuth;
