import jwt from 'jsonwebtoken';
import User from '../models/userModel.js'; // Adjust the path as needed

/**
 * Authentication middleware to allow access to any authenticated user.
 * Attaches the authenticated user to req.user.
 */
const authPatientOrStaff = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    console.warn('authPatientOrStaff: No token provided');
    return res.status(401).json({ success: false, message: 'Not authorized, token missing' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded._id;

    if (!userId) {
      console.warn('authPatientOrStaff: No user ID in token payload');
      return res.status(401).json({ success: false, message: 'Not authorized, invalid token payload' });
    }

    const user = await User.findById(userId).select('-password');

    if (!user) {
      console.warn(`authPatientOrStaff: User not found for ID ${userId}`);
      return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
    }

    // ✅ No role check here
    req.user = user;
    next();

  } catch (error) {
    console.error('authPatientOrStaff Error:', error.message);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
    }
    res.status(500).json({ success: false, message: 'Authentication failed due to server error' });
  }
};

export default authPatientOrStaff;
