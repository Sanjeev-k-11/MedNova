// middleware/authMiddleware.js
// This is a conceptual placeholder. Implement your actual JWT or session auth.
import jwt from 'jsonwebtoken';
import UserModel from '../models/userModel.js'; // Assuming you have these
import DoctorModel from '../models/doctorModel.js';

export const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET); // Use your JWT secret

            // Attempt to find user or doctor based on ID in token
            // The 'decoded' object should contain the ID and potentially the role.
            // Let's assume decoded.id and decoded.role exists.
            if (decoded.role === 'user') {
                req.user = await UserModel.findById(decoded.id).select('-password'); // Exclude password
                if (!req.user) throw new Error('User not found');
                req.user.role = 'user'; // Ensure role is explicitly set
            } else if (decoded.role === 'doctor') {
                req.user = await DoctorModel.findById(decoded.id).select('-password');
                if (!req.user) throw new Error('Doctor not found');
                req.user.role = 'doctor'; // Ensure role is explicitly set
            } else {
                throw new Error('Invalid role in token');
            }

            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            next();
        } catch (error) {
            console.error('Auth Error:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }
    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};