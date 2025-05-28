 
import jwt from 'jsonwebtoken';
import staffModel from '../models/staffModel.js';  

const authStaff = async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization || !authorization.startsWith('Bearer ')) {
        console.log('Auth Middleware: No Bearer token found.');
        return res.status(401).json({ success: false, message: 'Authorization token required (Bearer)' });
    }

    const token = authorization.split(' ')[1];

    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error("FATAL: JWT_SECRET not defined in environment variables!");
            return res.status(500).json({ success: false, message: 'Server configuration error.' });
        }

        // --- Step 1: Verify the token and get the ID ---
        const decoded = jwt.verify(token, secret);
        const staffId = decoded.id;  

        if (!staffId) {
             console.error('Auth Middleware: Token decoded but missing staff ID (id).');
             return res.status(401).json({ success: false, message: 'Invalid token payload.' });
        }

        const staffMember = await staffModel.findById(staffId).select(
            '_id name email role vid image phone address isActive createdAt'  
        ).lean();  
 
        if (!staffMember) {
            console.warn(`Auth Middleware: Staff not found for ID ${staffId} from token.`);
            return res.status(401).json({ success: false, message: 'Authentication failed: Staff member not found.' });
        }
 
        if (!staffMember.isActive) {
             console.warn(`Auth Middleware: Staff account inactive for ID ${staffId}.`);
             return res.status(403).json({ success: false, message: 'Staff account is inactive.' });
        }
 
        req.staff = staffMember;
        console.log(`Auth Middleware: Authenticated Staff ID: ${req.staff._id}, Role: ${req.staff.role}`);

        next();  

    } catch (error) {
        console.error("Auth Middleware Error:", error.message);
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ success: false, message: 'Invalid or malformed token.' });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired. Please log in again.' });
        } 
        return res.status(401).json({ success: false, message: 'Not authorized.' });
    }
};

export default authStaff;