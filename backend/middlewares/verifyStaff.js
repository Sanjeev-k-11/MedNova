import jwt from 'jsonwebtoken';
import staffModel from '../models/staffModel.js';
import mongoose from 'mongoose'; // Import mongoose for ObjectId validation


const verifyStaff = async (req, res, next) => {
    // 1. Get the token from the Authorization header
    const authHeader = req.headers['authorization'];

    // Check if the Authorization header exists and is in the "Bearer <token>" format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('VerifyStaff Middleware: Authorization header missing or not Bearer.');
        return res.status(401).json({ success: false, message: 'Authorization token required (Bearer token).' });
    }

    const token = authHeader.split(' ')[1]; // Extract the token string

    // 2. Verify the token using the secret key
    const secret = process.env.JWT_SECRET; // Use the same secret used during token creation

    // Check if the secret key is configured
    if (!secret) {
        console.error("FATAL: JWT_SECRET is not defined in environment variables!");
        // In a real production app, you might not expose this specific error details
        return res.status(500).json({ success: false, message: 'Server configuration error.' });
    }

    try {
        // Verify the token. This throws an error if the token is invalid, expired, etc.
        const decoded = jwt.verify(token, secret);

        // 3. Extract staff ID from the decoded payload
        // Assuming the staff ID is stored under the 'id' key in the JWT payload
        const staffId = decoded.id;

        // Validate the format of the extracted ID
        if (!staffId || !mongoose.Types.ObjectId.isValid(staffId)) {
             console.warn('VerifyStaff Middleware: Invalid or missing staff ID in token payload.');
             return res.status(401).json({ success: false, message: 'Invalid token payload: Staff ID missing or invalid format.' });
        }


        // 4. Find the staff member in the database by ID
        // Select necessary fields, *excluding* the password. Include isActive and role for checks.
        const staffMember = await staffModel.findById(staffId).select(
            '_id name email role vid image phone address isActive createdAt' // Select desired fields
        ).lean(); // Use .lean() for better performance when just reading data


        // 5. Check if the staff member exists
        if (!staffMember) {
            console.warn(`VerifyStaff Middleware: Staff not found for ID ${staffId} from token.`);
            // Using 401 as the token is valid but doesn't map to an existing user
            return res.status(401).json({ success: false, message: 'Authentication failed: Staff member not found.' });
        }

        // 6. Check if the staff account is active
        if (!staffMember.isActive) {
             console.warn(`VerifyStaff Middleware: Staff account inactive for ID ${staffId}.`);
             // Using 403 Forbidden because the account exists but is not authorized to log in/act
             return res.status(403).json({ success: false, message: 'Staff account is inactive. Please contact an administrator.' });
         }

        // 7. If all checks pass, attach staff data to the request object
        // Attaching the full staff document (excluding password) to req.staff
        req.staff = staffMember;
        // Also attach basic info to req.user for consistency if needed by other general middleware
        req.user = {
            _id: staffMember._id,
            role: staffMember.role,
            vid: staffMember.vid // Include VID if relevant for user context
        };


        // Log successful authentication
        console.log(`VerifyStaff Middleware: Authenticated Staff ID: ${req.user._id}, Role: ${req.user.role}`);


        // 8. Proceed to the next middleware or route handler
        next();

    } catch (error) {
        // 9. Handle JWT verification errors and other unexpected errors
        console.error("VerifyStaff Middleware Error:", error.message);

        if (error.name === 'JsonWebTokenError') {
            // e.g., malformed token, bad signature
            return res.status(401).json({ success: false, message: 'Invalid authentication token.' });
        }
        if (error.name === 'TokenExpiredError') {
            // Token has expired
            return res.status(401).json({ success: false, message: 'Authentication token expired. Please log in again.' });
        }
         if (error.name === 'CastError' && error.path === '_id') {
             // Occurs if staffModel.findById receives an invalid ID format from the token payload
             return res.status(401).json({ success: false, message: 'Invalid ID format in token payload.' });
         }

        // Catch any other unexpected errors (e.g., database issues during findById)
        return res.status(500).json({ success: false, message: 'An unexpected error occurred during authentication.' });
    }
};

// Export the middleware function
export default verifyStaff;