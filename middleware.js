// Middleware för att autentisera JWT
const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, error: 'Ingen token tillhandahållen' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, error: 'Ogiltlig token' });
        }
        req.user = user; // Sätt användaren här
        next();
    });
};

module.exports = {
    authenticateJWT
};
