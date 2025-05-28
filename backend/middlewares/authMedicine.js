import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';  // Import your User model

const authMedicine= async (req, res, next) => {
    try {
        // Extract token from the Authorization header
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ success: false, message: 'Authentication required: Missing token' });
        }

        // Verify the token
        jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ success: false, message: 'Authentication failed: Invalid token' });
            }

            // Fetch user based on the decoded ID
            const user = await userModel.findById(decoded.id).select('-password'); // Exclude password for security

            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }

            // Attach the user object to the request
            req.user = user;
            next(); // Proceed to the next middleware or route handler
        });
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ success: false, message: 'Authentication failed: Internal server error' });
    }
};

export default authMedicine;