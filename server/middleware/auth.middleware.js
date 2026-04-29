import jwt from 'jsonwebtoken'
import UserModel from '../models/User.model.js';

export const isAuthenticated = async(req, res, next) => {
    try {
        const token = req.cookies.jwt
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized' });
        } 

        // Verify the token using the secret key
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        if (!decoded) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        // Find the user by ID from the decoded token
        const user = await UserModel.findById(decoded.userId).select('-password')

        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        req.user = user;

        next()
    } catch (error) {
        console.error("Error in authentication middleware:", error);
        return res.status(500).json({ message: 'Server Error' });
    }
}

export const isAdmin = async(req, res, next) => {
    try {
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            return res.status(403).json({ message: 'Forbidden. Admin access required.' });
        }
    } catch (error) {
        console.error("Error in admin middleware:", error);
        return res.status(500).json({ message: 'Server Error' });
    }
}
