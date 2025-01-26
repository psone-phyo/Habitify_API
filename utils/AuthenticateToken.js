const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    if (authHeader){
        const [type, token] = authHeader.split(" ");

        if (type === "Bearer" && token){
            jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
                if (err){
                    return res.status(403).json({
                        error: "Forbidden",
                        message: "Invalid token"
                    });
                }
                req.user = user;
                next();
            });
        }else{
            return res.status(401).json({
                error: "Unauthorized Access",
                message: "Access Denied"
            });
        }
    }else{
        return res.status(401).json({
            error: "Unauthorized Access",
            message: "Access Denied"
        });
    }
}
module.exports = {authenticateToken};