// using JWT
import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
}

function requireAuth(req, res, next) {
    const token = req.cookies?.token;
    // cookie is required
    if (!token) {
        return res.status(401).json({ error: "Not authenticated" });
    }
    // cookie
    try { // did the server sign this cookie, using this algorithm
        const payload = jwt.verify(token, process.env.JWT_SECRET, {
            algorithms: ['HS256']
        });
        // we use strings because the database ids could overflow int
        if (typeof payload.userId !== 'string' || !/^[1-9]\d*$/.test(payload.userId)) {
            return res.status(401).json({ error: "Invalid token payload" });
        }
        // controllers can use the user
        req.user = { id: payload.userId };

    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
    next(); // go to the next endpoint
}

export default requireAuth;