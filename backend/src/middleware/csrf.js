const ALLOWED_ORIGIN = process.env.FRONTEND_ORIGIN;

// make sure that backend requests originate exactly from the frontend
function requireTrustedOrigin(req, res, next) {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    if (req.get('Origin') !== ALLOWED_ORIGIN) {
        return res.status(403).json({
            error: 'Untrusted request origin'
        });
    }

    next();
}

export default requireTrustedOrigin;