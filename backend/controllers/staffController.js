import validator from 'validator';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';
import jwt from 'jsonwebtoken';
import staffModel from '../models/staffModel.js';
import contactModel from '../models/contactmodel.js';
import HeaderModel from '../models/HeaderModel.js';


const loginStaff = async (req, res) => {
   
    const { email, password } = req.body;

    // --- Basic Input Validation ---
    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Please provide both email and password.'
        });
    }

    try {
        // --- Find Staff by Email ---
        // IMPORTANT: Use .select('+password') because it's excluded by default in your schema
        const staffMember = await staffModel.findOne({ email: email.toLowerCase() }).select('+password');

        // --- Handle Staff Not Found ---
        if (!staffMember) {
            // Use a generic message for security (don't reveal if email exists)
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        // --- Compare Provided Password with Hashed Password ---
        // Use the comparePassword method defined in the staffModel schema
        const isMatch = await staffMember.comparePassword(password);

        // --- Handle Incorrect Password ---
        if (!isMatch) {
            // Use the same generic message
            return res.status(401).json({ success: false, message: 'Invalid credentials.' });
        }

        // --- Check if Account is Active ---
        if (!staffMember.isActive) {
             return res.status(403).json({ success: false, message: 'Account is inactive. Please contact administrator.' });
         }


        // --- Credentials Valid: Generate JWT Token ---
        const payload = {
            id: staffMember._id, // Use staff's unique ID
            role: staffMember.role, // Include role for authorization checks
            vid: staffMember.vid // Include VID if needed by frontend/backend logic
            // Add other non-sensitive info as needed
        };

        const secret = process.env.JWT_SECRET;
        if (!secret) {
             console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables!');
             return res.status(500).json({ success: false, message: 'Server configuration error.' });
        }

        const token = jwt.sign(
            payload,
            secret,
            { expiresIn: '1d' } // Example: Token expires in 1 day (adjust as needed)
        );


        // --- Send Success Response with Token ---
        res.status(200).json({
            success: true,
            message: 'Login successful.',
            token: token
            // Optionally send back some user info (excluding password!) if useful
            // user: { _id: staffMember._id, name: staffMember.name, role: staffMember.role, vid: staffMember.vid }
        });

    } catch (error) {
        console.error('!!! ERROR IN loginStaff !!!:', error);
        res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'production' ? 'Server error during login.' : error.message
        });
    }
};




const registerStaff = async (req, res) => {
    const {
        name,
        email,
        password,
        vid,
        role,
        salary,
        phone,
        address: addressString
    } = req.body;

    const imageFile = req.file;

    if (!imageFile) {
        return res.status(400).json({ success: false, message: 'Staff image file is required for upload.' });
    }
    if (!name || !email || !password || !vid || !role || salary === undefined || salary === null) {
        return res.status(400).json({
            success: false,
            message: 'Please provide name, email, password, VID, role, and salary.'
        });
    }
    if (!/^\d{6}$/.test(vid)) {
        return res.status(400).json({ success: false, message: "VID must contain exactly 6 digits." });
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
        return res.status(400).json({ success: false, message: "Please use a valid email address." });
    }

    let parsedAddress = {};
    if (addressString) {
        try {
            parsedAddress = JSON.parse(addressString);
            if (typeof parsedAddress !== 'object' || parsedAddress === null) {
                throw new Error('Parsed address is not an object.');
            }
            parsedAddress.line1 = parsedAddress.line1 || '';
            parsedAddress.line2 = parsedAddress.line2 || '';
            parsedAddress.city = parsedAddress.city || '';
            parsedAddress.postalCode = parsedAddress.postalCode || '';
            parsedAddress.country = parsedAddress.country || '';
        } catch (parseError) {
            return res.status(400).json({ success: false, message: 'Invalid address format provided.' });
        }
    }

    let imageUrl = "";

    try {
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
            folder: "staff_images",
            resource_type: "image"
        });
        imageUrl = imageUpload.secure_url;
        if (!imageUrl) {
            throw new Error('Cloudinary did not return a URL.');
        }

        const existingStaff = await staffModel.findOne({
            $or: [{ email: email.toLowerCase() }, { vid: vid }]
        }).lean();

        if (existingStaff) {
            const message = existingStaff.email === email.toLowerCase()
                ? 'Staff member with this email already exists.'
                : 'Staff member with this VID already exists.';
            return res.status(400).json({ success: false, message });
        }

        const newStaff = new staffModel({
            name,
            email: email.toLowerCase(),
            password,
            vid,
            role,
            salary: Number(salary),
            phone,
            address: parsedAddress,
            image: imageUrl
        });

        const savedStaff = await newStaff.save();

        const staffData = {
            _id: savedStaff._id,
            name: savedStaff.name,
            email: savedStaff.email,
            vid: savedStaff.vid,
            role: savedStaff.role,
            image: savedStaff.image,
            phone: savedStaff.phone,
            address: savedStaff.address,
            salary: savedStaff.salary,
            isActive: savedStaff.isActive,
            createdAt: savedStaff.createdAt,
            updatedAt: savedStaff.updatedAt,
        };

        res.status(201).json({
            success: true,
            message: 'Staff member registered successfully.',
            staff: staffData
        });

    } catch (error) {
        if (error.code === 11000) {
            const field = error.message.includes('email_') ? 'email' : error.message.includes('vid_') ? 'VID' : 'unique field';
            return res.status(400).json({
                success: false,
                message: `Staff member with this ${field} already exists.`
            });
        }

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({
                success: false,
                message: messages.join(' ')
            });
        }

        res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'production' ? 'Server error during staff registration.' : error.message
        });
    }
};

const getAllStaff = async (req, res) => {
    try {
        const allStaffMembers = await staffModel.find({})
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            message: 'Staff members retrieved successfully.',
            staffList: allStaffMembers
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'production' ? 'Server error retrieving staff.' : error.message
        });
    }
};


const getStaffProfiles = async (req, res) => {
    try {
        const staffProfile = req.staff;

        if (staffProfile) {
            res.status(200).json({
                success: true,
                profile: {
                    _id: staffProfile._id,
                    name: staffProfile.name,
                    email: staffProfile.email,
                    role: staffProfile.role,
                    vid: staffProfile.vid,
                    image: staffProfile.image,
                    phone: staffProfile.phone,
                    address: staffProfile.address,
                    isActive: staffProfile.isActive,
                    createdAt: staffProfile.createdAt
                }
            });
        } else {
            res.status(404).json({ success: false, message: 'Staff profile not found. Authentication might have failed or user deleted.' });
        }

    } catch (error) {
        res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'production' ? 'Server Error fetching profile.' : error.message
        });
    }
};

const updateStaffProfile = async (req, res) => {
   
    try {
        const staffId = req.staff._id;
        if (!staffId) {
            return res.status(401).json({ success: false, message: 'Authentication error: User ID not found.' });
        }

        const { phone, address } = req.body;
        const updateData = {};

        if (phone !== undefined) {
            updateData.phone = phone;
        }

        if (address !== undefined) {
            if (typeof address !== 'object' || address === null) {
                return res.status(400).json({ success: false, message: 'Invalid address format provided (must be an object).' });
            }

            const currentAddress = req.staff.address || {};
            updateData.address = {
                line1: address.line1 !== undefined ? address.line1 : currentAddress.line1,
                line2: address.line2 !== undefined ? address.line2 : currentAddress.line2,
                city: address.city !== undefined ? address.city : currentAddress.city,
                postalCode: address.postalCode !== undefined ? address.postalCode : currentAddress.postalCode,
                country: address.country !== undefined ? address.country : currentAddress.country,
            };
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ success: false, message: 'No valid fields provided for update (only phone and address can be updated).' });
        }

        const updatedStaff = await staffModel.findByIdAndUpdate(
            staffId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedStaff) {
            return res.status(404).json({ success: false, message: 'Staff member not found.' });
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully.',
            staff: updatedStaff
        });

    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: `Validation Error: ${messages.join('. ')}` });
        }

        res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'production' ? 'Server error updating profile.' : `Server Error: ${error.message}`
        });
    }
};


// Controller function to toggle the 'isActive' status for the logged-in staff member
const toggleActiveStatus = async (req, res) => {
    try {
        const staffId = req.staff._id;

        if (!staffId) {
            return res.status(401).json({ success: false, message: "Authentication required. Staff ID not found." });
        } 
        const staffMember = await staffModel.findById(staffId);
 
        if (!staffMember) {
            return res.status(404).json({ success: false, message: "Staff member not found." });
        }
 
        const newIsActiveStatus = !staffMember.isActive;
 
        await staffModel.findByIdAndUpdate(staffId, { isActive: newIsActiveStatus });
 
        res.json({
            success: true,
            message: `Staff status successfully updated to ${newIsActiveStatus ? 'Active' : 'Inactive'}.`,
            // Optionally send back the new status if the frontend needs it immediately
            newStatus: newIsActiveStatus
        });

    } catch (error) {
        console.error("Error toggling staff active status:", error); // Log the error for debugging
        res.status(500).json({ success: false, message: "An error occurred while updating status. Please try again." }); // User-friendly error
    }
}
 
const updateStaffStatusByAdmin = async (req, res) => { // Renamed to match router


    try {
        const { id } = req.params; // ID of staff member to update
        const { isActive } = req.body;
    
        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ success: false, message: "'isActive' must be true or false." });
        }
        
        const staff = await staffModel.findById(id);
        if (!staff) {
            return res.status(404).json({ success: false, message: "Staff member not found." });
        }

        staff.isActive = isActive;
        await staff.save(); // Use save to trigger hooks if any

        const updatedStaffData = { ...staff.toObject() };
        delete updatedStaffData.password;

        const action = isActive ? 'activated' : 'deactivated';
        console.log(`Admin (ID: ${req.user._id}) ${action} staff (ID: ${id})`);
        res.status(200).json({
            success: true,
            message: `Staff member ${action} successfully.`,
            staff: updatedStaffData // Send back updated staff data
        });

    } catch (error) {
        console.error(`Error updating staff status by admin (Admin: ${req.user._id}, Target: ${id}):`, error);
        if (error.name === 'CastError') return res.status(400).json({ success: false, message: "Invalid Staff ID format." });
        res.status(500).json({ success: false, message: "Server error while updating staff status." });
    }
};

// Admin deletes ANY staff member

const deleteStaffByAdmin = async (req, res) => {

    try {
        const { id } = req.params;

        if (!id) {
            return res.status(400).json({ success: false, message: "Staff ID is required in the URL path." });
        }
        const staff = await staffModel.findById(id);

        if (!staff) {
            return res.status(404).json({ success: false, message: "Staff member not found." });
        }

        await staffModel.deleteOne({ _id: id });

        res.status(200).json({ success: true, message: "Staff member deleted successfully." });

    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: "Invalid Staff ID format." });
        }
        res.status(500).json({ success: false, message: "Server error while deleting staff member." });
    }
};

const getStaffById = async (req, res) => {
   
    try {
        const staffId = req.params.id;
        // 2. Find staff member by ID (Asynchronous operation)
        const staff = await staffModel.findById(staffId).select('-password'); // Exclude password

        // 3. Check if found
        if (staff) {
            res.status(200).json({ success: true, staff });
        } else {
            // ID was valid format, but not found in DB
            res.status(404).json({ success: false, message: 'Staff member not found' });
        }
    } catch (error) {
        // // 4. Catch errors during database query or other async ops
        // console.error(`!!! ERROR IN getStaffById (Target: ${staffId}) !!!:`, error);
        // Send a generic 500 Internal Server Error
        res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'production' ? 'Server error retrieving staff data.' : `Server Error: ${error.message}`
        });
    }
};


const updateStaffProfiles = async (req, res) => {
    

 
    // --- Main Try Block for all async operations ---
    try {
        const staffId = req.params.id;
        const adminUserId = req.user?._id || 'Unknown Admin';
    
        const staff = await staffModel.findById(staffId);
        if (!staff) {
          return res.status(404).json({ success: false, message: 'Staff member not found.' });
        }
    
        const { name, role, phone, salary, isActive } = req.body;
        let address = req.body.address;
    
        // If address is a string (from FormData), parse it
        if (typeof address === 'string') {
          try {
            address = JSON.parse(address);
          } catch {
            return res.status(400).json({ success: false, message: 'Invalid address format.' });
          }
        }
    
        // Upload new image if available
        if (req.file) {
          const imageUpload = await cloudinary.uploader.upload(req.file.path, {
            resource_type: 'image',
            folder: 'staff_profiles',
          });
    
          if (!imageUpload?.secure_url) {
            return res.status(500).json({ success: false, message: 'Image upload failed.' });
          }
    
          staff.image = imageUpload.secure_url;
        }
    
        // Update other fields
        if (name) staff.name = name;
        if (role) staff.role = role;
        if (phone) staff.phone = phone;
        if (salary !== undefined) staff.salary = Number(salary);
        if (isActive !== undefined) {
          staff.isActive = isActive === 'true' || isActive === true;
        }
    
        if (address && typeof address === 'object') {
          staff.address = {
            ...staff.address,
            ...address,
          };
        }
    
        const updatedStaff = await staff.save();
        const responseData = updatedStaff.toObject();
        delete responseData.password;
    
        console.log(`Admin (ID: ${adminUserId}) updated staff (ID: ${staffId})`);
        res.status(200).json({ success: true, message: 'Staff profile updated.', staff: responseData });
    
      } catch (error) {
        console.error("Error in updateStaffProfiles:", error);
        res.status(500).json({ success: false, message: 'Server error during profile update.' });
      }
    };



    


const validateTimeFormat = (time) => /^\d{2}:\d{2}$/.test(time);
const validateDate = (dateString) => !isNaN(Date.parse(dateString));

 const addRecurringAvailabilityRule = async (req, res) => {
    try {
        const { staffId } = req.params;
        const {
            frequency, interval, startTime, endTime,
            daysOfWeek,
            weekOfMonth, dayOfWeekMonthly,
            startDate, endDate, notes
        } = req.body;

        if (!frequency || !interval || !startTime || !endTime || !startDate) {
            return res.status(400).json({ success: false, message: 'Missing required availability rule fields (frequency, interval, startTime, endTime, startDate).' });
        }
        if (!validateTimeFormat(startTime) || !validateTimeFormat(endTime)) {
             return res.status(400).json({ success: false, message: 'Invalid time format. Use HH:MM.' });
        }
        if (!validateDate(startDate) || (endDate && !validateDate(endDate))) {
             return res.status(400).json({ success: false, message: 'Invalid date format for startDate or endDate.' });
        }

        const staffMember = await staffModel.findById(staffId);
        if (!staffMember) {
            return res.status(404).json({ success: false, message: 'Staff member not found.' });
        }

        const newRule = {
            frequency, interval: Number(interval), startTime, endTime,
            daysOfWeek: frequency === 'weekly' ? daysOfWeek : undefined,
            weekOfMonth: frequency === 'monthly' ? Number(weekOfMonth) : undefined,
            dayOfWeekMonthly: frequency === 'monthly' ? Number(dayOfWeekMonthly) : undefined,
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : null,
            notes: notes || ''
        };

        const updatedStaff = await staffModel.findByIdAndUpdate(
            staffId,
            { $push: { recurringAvailability: newRule } },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedStaff) {
             return res.status(404).json({ success: false, message: 'Staff member not found during update.' });
        }

        const addedRule = updatedStaff.recurringAvailability[updatedStaff.recurringAvailability.length - 1];

        res.status(201).json({
            success: true,
            message: 'Recurring availability rule added successfully.',
            rule: addedRule
        });

    } catch (error) {
        console.error("Error adding recurring availability:", error);
         if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: `Validation Error: ${error.message}` });
        }
        res.status(500).json({ success: false, message: 'Server error adding recurring availability rule.' });
    }
};

 const deleteRecurringAvailabilityRule = async (req, res) => {
    try {
        const { staffId, ruleId } = req.params;

        const updatedStaff = await staffModel.findByIdAndUpdate(
            staffId,
            { $pull: { recurringAvailability: { _id: ruleId } } },
            { new: true }
        );

        if (!updatedStaff) {
            return res.status(404).json({ success: false, message: 'Staff member not found or rule already deleted.' });
        }

        res.status(200).json({
            success: true,
            message: 'Recurring availability rule deleted successfully.'
        });

    } catch (error) {
        console.error("Error deleting recurring availability:", error);
         if (error.name === 'CastError') {
             return res.status(400).json({ success: false, message: "Invalid Staff ID or Rule ID format." });
        }
        res.status(500).json({ success: false, message: 'Server error deleting recurring availability rule.' });
    }
};

 const addScheduledShift = async (req, res) => {
    try {
        const { staffId } = req.params;
        const { startTime, endTime, roleOverride, notes } = req.body;

        if (!startTime || !endTime) {
             return res.status(400).json({ success: false, message: 'Shift startTime and endTime are required.' });
        }
        if (!validateDate(startTime) || !validateDate(endTime)) {
             return res.status(400).json({ success: false, message: 'Invalid date format for startTime or endTime.' });
        }
        if (new Date(startTime) >= new Date(endTime)) {
            return res.status(400).json({ success: false, message: 'Shift endTime must be after startTime.' });
        }

        const staffMember = await staffModel.findById(staffId);
        if (!staffMember) {
            return res.status(404).json({ success: false, message: 'Staff member not found.' });
        }

        const newShift = {
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            roleOverride: roleOverride || null,
            notes: notes || ''
        };

        const updatedStaff = await staffModel.findByIdAndUpdate(
            staffId,
            { $push: { scheduledShifts: newShift } },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedStaff) {
             return res.status(404).json({ success: false, message: 'Staff member not found during update.' });
        }

        const addedShift = updatedStaff.scheduledShifts[updatedStaff.scheduledShifts.length - 1];

        res.status(201).json({
            success: true,
            message: 'Scheduled shift added successfully.',
            shift: addedShift
        });

    } catch (error) {
        console.error("Error adding scheduled shift:", error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: `Validation Error: ${error.message}` });
        }
        res.status(500).json({ success: false, message: 'Server error adding scheduled shift.' });
    }
};

 const deleteScheduledShift = async (req, res) => {
    try {
        const { staffId, shiftId } = req.params;

        const updatedStaff = await staffModel.findByIdAndUpdate(
            staffId,
            { $pull: { scheduledShifts: { _id: shiftId } } },
            { new: true }
        );

        if (!updatedStaff) {
            return res.status(404).json({ success: false, message: 'Staff member not found or shift already deleted.' });
        }

        res.status(200).json({
            success: true,
            message: 'Scheduled shift deleted successfully.'
        });

    } catch (error) {
        console.error("Error deleting scheduled shift:", error);
        if (error.name === 'CastError') {
             return res.status(400).json({ success: false, message: "Invalid Staff ID or Shift ID format." });
        }
        res.status(500).json({ success: false, message: 'Server error deleting scheduled shift.' });
    }
};

 const addAvailabilityOverride = async (req, res) => {
    try {
        const { staffId } = req.params;
        const { date, isAvailable, startTime, endTime, reason, notes } = req.body;

        if (!date || isAvailable === undefined || !reason) {
            return res.status(400).json({ success: false, message: 'Override date, isAvailable status, and reason are required.' });
        }
        if (!validateDate(date)) {
             return res.status(400).json({ success: false, message: 'Invalid date format for override date.' });
        }
        if (typeof isAvailable !== 'boolean') {
             return res.status(400).json({ success: false, message: 'isAvailable must be true or false.' });
        }
        if (isAvailable && startTime && !validateTimeFormat(startTime)) {
             return res.status(400).json({ success: false, message: 'Invalid startTime format (HH:MM) for available override.' });
        }
         if (isAvailable && endTime && !validateTimeFormat(endTime)) {
             return res.status(400).json({ success: false, message: 'Invalid endTime format (HH:MM) for available override.' });
        }
         if (isAvailable && startTime && endTime && startTime >= endTime) {
             return res.status(400).json({ success: false, message: 'Override endTime must be after startTime.' });
        }

        const staffMember = await staffModel.findById(staffId);
        if (!staffMember) {
            return res.status(404).json({ success: false, message: 'Staff member not found.' });
        }

        const newOverride = {
            date: new Date(date),
            isAvailable: isAvailable,
            startTime: isAvailable && startTime ? startTime : undefined,
            endTime: isAvailable && endTime ? endTime : undefined,
            reason: reason,
            notes: notes || ''
        };

        const updatedStaff = await staffModel.findByIdAndUpdate(
            staffId,
            { $push: { availabilityOverrides: newOverride } },
            { new: true, runValidators: true }
        ).select('-password');

         if (!updatedStaff) {
             return res.status(404).json({ success: false, message: 'Staff member not found during update.' });
        }

        const addedOverride = updatedStaff.availabilityOverrides[updatedStaff.availabilityOverrides.length - 1];

        res.status(201).json({
            success: true,
            message: 'Availability override added successfully.',
            override: addedOverride
        });

    } catch (error) {
        console.error("Error adding availability override:", error);
         if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, message: `Validation Error: ${error.message}` });
        }
        res.status(500).json({ success: false, message: 'Server error adding availability override.' });
    }
};

 const deleteAvailabilityOverride = async (req, res) => {
    try {
        const { staffId, overrideId } = req.params;

        const updatedStaff = await staffModel.findByIdAndUpdate(
            staffId,
            { $pull: { availabilityOverrides: { _id: overrideId } } },
            { new: true }
        );

        if (!updatedStaff) {
            return res.status(404).json({ success: false, message: 'Staff member not found or override already deleted.' });
        }

        res.status(200).json({
            success: true,
            message: 'Availability override deleted successfully.'
        });

    } catch (error) {
        console.error("Error deleting availability override:", error);
        if (error.name === 'CastError') {
             return res.status(400).json({ success: false, message: "Invalid Staff ID or Override ID format." });
        }
        res.status(500).json({ success: false, message: 'Server error deleting availability override.' });
    }
};


const getOwnSchedule = async (req, res) => {
    try {
        const staffId = req.staff?._id;

        if (!staffId) {
            return res.status(401).json({ success: false, message: "Authentication required. User ID not found." });
        }

        const staffMember = await staffModel.findById(staffId)
            .select('name recurringAvailability scheduledShifts availabilityOverrides');

        if (!staffMember) {
            return res.status(404).json({ success: false, message: "Staff member profile not found." });
        }

        res.status(200).json({
            success: true,
            message: "Schedule retrieved successfully.",
            schedule: {
                _id: staffMember._id,
                name: staffMember.name,
                recurringAvailability: staffMember.recurringAvailability || [],
                scheduledShifts: staffMember.scheduledShifts || [],
                availabilityOverrides: staffMember.availabilityOverrides || [],
            }
        });

    } catch (error) {
        console.error("Error fetching own schedule:", error);
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, message: "Invalid staff ID format." });
        }
        res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'production' ? 'Server error retrieving schedule.' : `Server Error: ${error.message}`
        });
    }
};


const addAvailabilityOverrides = async (req, res) => {
    try {
        const staffId = req.staff?._id;
        if (!staffId) {
            return res.status(401).json({ success: false, message: "Authentication required." });
        }
        const { date, isAvailable, startTime, endTime, reason, notes } = req.body;
        if (!date || typeof isAvailable !== 'boolean') {
            return res.status(400).json({ success: false, message: "Missing required fields: date and isAvailable (must be true or false)." });
        }
        const newOverride = {
            _id: new mongoose.Types.ObjectId(),
            date: new Date(date),
            isAvailable,
            startTime: isAvailable ? startTime : null,
            endTime: isAvailable ? endTime : null,
            reason: reason || (isAvailable ? 'Marked Available' : 'Marked Unavailable'),
            notes: notes || null,
        };
        const updatedStaff = await staffModel.findByIdAndUpdate(
            staffId,
            { $push: { availabilityOverrides: newOverride } },
            { new: true, runValidators: true, select: 'availabilityOverrides' }
        );
        if (!updatedStaff) return res.status(404).json({ success: false, message: "Staff member not found." });
        const addedOverride = updatedStaff.availabilityOverrides.find(ov => ov._id.equals(newOverride._id));
        res.status(201).json({ success: true, message: "Availability exception added.", override: addedOverride });
    } catch (error) {
        console.error("Error adding availability override:", error);
        if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: `Validation Error: ${error.message}` });
        res.status(500).json({ success: false, message: 'Server error adding exception.' });
    }
};

const updateAvailabilityOverride = async (req, res) => {
    try {
        const staffId = req.staff?._id;
        const { overrideId } = req.params;
        if (!staffId) return res.status(401).json({ success: false, message: "Authentication required." });
        if (!overrideId || !mongoose.Types.ObjectId.isValid(overrideId)) return res.status(400).json({ success: false, message: "Invalid or missing override ID." });

        const { date, isAvailable, startTime, endTime, reason, notes } = req.body;
        if (
            date === undefined &&
            isAvailable === undefined &&
            startTime === undefined &&
            endTime === undefined &&
            reason === undefined &&
            notes === undefined
        ) return res.status(400).json({ success: false, message: "No update data provided." });

        if (typeof isAvailable !== 'undefined' && typeof isAvailable !== 'boolean') {
            return res.status(400).json({ success: false, message: "isAvailable must be true or false if provided." });
        }

        const updateFields = {};
        if (date !== undefined) updateFields['availabilityOverrides.$[elem].date'] = new Date(date);
        if (isAvailable !== undefined) updateFields['availabilityOverrides.$[elem].isAvailable'] = isAvailable;
        if (isAvailable === true) {
            if (startTime !== undefined) updateFields['availabilityOverrides.$[elem].startTime'] = startTime;
            if (endTime !== undefined) updateFields['availabilityOverrides.$[elem].endTime'] = endTime;
        } else if (isAvailable === false) {
            updateFields['availabilityOverrides.$[elem].startTime'] = null;
            updateFields['availabilityOverrides.$[elem].endTime'] = null;
        } else {
            if (startTime !== undefined) updateFields['availabilityOverrides.$[elem].startTime'] = startTime;
            if (endTime !== undefined) updateFields['availabilityOverrides.$[elem].endTime'] = endTime;
        }
        if (reason !== undefined) updateFields['availabilityOverrides.$[elem].reason'] = reason;
        if (notes !== undefined) updateFields['availabilityOverrides.$[elem].notes'] = notes;

        const updatedStaff = await staffModel.findOneAndUpdate(
            { _id: staffId },
            { $set: updateFields },
            {
                arrayFilters: [{ 'elem._id': new mongoose.Types.ObjectId(overrideId) }],
                new: true,
                runValidators: true,
                select: 'availabilityOverrides'
            }
        );
        if (!updatedStaff) {
            const staffExists = await staffModel.findById(staffId).select('_id');
            return res.status(404).json({ success: false, message: !staffExists ? "Staff member not found." : "Availability exception not found for this staff member." });
        }
        const updatedOverride = updatedStaff.availabilityOverrides.find(ov => ov._id.equals(overrideId));
        res.status(200).json({ success: true, message: "Availability exception updated.", override: updatedOverride });
    } catch (error) {
        console.error("Error updating availability override:", error);
        if (error.name === 'ValidationError') return res.status(400).json({ success: false, message: `Validation Error: ${error.message}` });
        if (error.name === 'CastError') return res.status(400).json({ success: false, message: "Invalid ID format." });
        res.status(500).json({ success: false, message: 'Server error updating exception.' });
    }
};


const createOrUpdateContact = async (req, res) => {
    const imageFile = req.file;
    const { _id, ...updateData } = req.body;

    let uploadedImageUrl = null;

    try {
        // 1. Handle Image Upload (if a new file is provided)
        if (imageFile) {
            console.log("New image file provided. Uploading to Cloudinary:", imageFile.filename);
            try {
                const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
                    resource_type: "image",
                    folder: "contact_page",
                });
                uploadedImageUrl = imageUpload.secure_url;
                updateData.contactImage = uploadedImageUrl;
                console.log("Image uploaded, URL to be saved:", uploadedImageUrl);

                // NOTE: Temporary file at imageFile.path is NOT deleted here.
                // Handle cleanup separately if using disk storage.

            } catch (uploadError) {
                console.error("Cloudinary Upload Error:", uploadError);
                // NOTE: Temporary file at imageFile.path is NOT deleted here on error.
                return res.status(500).json({ success: false, message: 'Failed to upload image to Cloudinary.' });
            }
        } else {
             // Logic to prevent accidental image removal during update without new file
            if (_id && updateData.hasOwnProperty('contactImage')) {
                if (updateData.contactImage === undefined) {
                    delete updateData.contactImage;
                    console.log("No new image file; ensuring existing image is not overwritten with undefined.");
                } else {
                    console.log("No new image file, but contactImage field was explicitly provided in body:", updateData.contactImage);
                }
            } else if (!_id) {
                console.log("No image file provided for new contact creation.");
            }
        }

        // 2. Perform Database Operation (Create or Update)
        if (_id) {
            // --- UPDATE ---
            // Deletion of previous contacts does NOT happen on update
            console.log(`Attempting to update contact with ID: ${_id}`);
            const existingContact = await contactModel.findById(_id);

            if (!existingContact) {
                console.log(`Contact with ID: ${_id} not found for update.`);
                return res.status(404).json({ success: false, message: 'Contact not found.' });
            }

            const updatedContact = await contactModel.findByIdAndUpdate(
                _id,
                { $set: updateData },
                { new: true, runValidators: true }
            );

            console.log("Contact updated successfully.");
            res.status(200).json({
                success: true,
                message: 'Contact updated successfully.',
                data: updatedContact
            });

        } else {
            // --- CREATE ---
            // Create the new contact FIRST
            console.log("Attempting to create new contact.");
            const createData = { ...updateData };
            if (uploadedImageUrl) {
                createData.contactImage = uploadedImageUrl;
            }

            const newContact = await contactModel.create(createData);
            console.log("New contact created successfully with ID:", newContact._id);

            // *** DELETE ALL OTHER CONTACTS ***
            // This happens only after the new contact is successfully created.
            console.log(`Attempting to delete all previous contacts except the new one (${newContact._id})...`);
            try {
                const deleteResult = await contactModel.deleteMany({ _id: { $ne: newContact._id } });
                console.log(`Deleted ${deleteResult.deletedCount} previous contact(s).`);
            } catch (deleteError) {
                // Log the deletion error, but proceed with success response for the creation
                // as the primary operation (creation) succeeded.
                console.error("Error deleting previous contacts after creating new one:", deleteError);
                // Optionally, you could change the response message here to indicate partial success
            }

            res.status(201).json({
                success: true,
                message: 'New contact created successfully. Previous contacts deleted.', // Updated message
                data: newContact
            });
        }

    } catch (error) {
        console.error("Error during contact create/update:", error);

        // NOTE: Temporary file at imageFile.path is NOT deleted here on error.

        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: 'Validation failed.',
                errors: error.errors
            });
        }

        res.status(500).json({ success: false, message: 'An internal server error occurred.', error: error.message });
    }
};


const getContacts = async (req, res) => {
    console.log("--- Backend: getContacts ---");
    try {
        // Fetch the single document, lean can improve performance if not modifying
        const contactInfo = await contactModel.findOne({}).lean();

        if (!contactInfo) {
             console.log("No contact document found.");
            // Return success: true, data: null as agreed convention
            return res.status(200).json({
                success: true,
                data: null,
                message: 'Contact information has not been configured yet.'
            });
        }

        console.log("Contact document found and sending.");
        res.status(200).json({
            success: true,
            data: contactInfo // Send the found document
        });

    } catch (error) {
        console.error("Error fetching contact info:", error);
        res.status(500).json({
            success: false,
            message: 'Server error while fetching contact information.',
            error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message
        });
    }
};

const changePassword = async (req, res) => {
    const staffId = req.staff?._id;

    if (!staffId) {
        return res.status(401).json({ success: false, message: 'Authentication required. Unable to identify user.' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Please provide both your current password and a new password.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    if (currentPassword === newPassword) {
        return res.status(400).json({ success: false, message: 'New password cannot be the same as the current password.' });
    }

    try {
        const staffMember = await staffModel.findById(staffId).select('+password');

        if (!staffMember) {
            return res.status(404).json({ success: false, message: 'Staff member account not found.' });
        }

        const isMatch = await staffMember.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect current password.' });
        }

        staffMember.password = newPassword;
        await staffMember.save();

        res.status(200).json({ success: true, message: 'Password changed successfully.' });

    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: `Validation Error: ${messages.join('. ')}` });
        }

        res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'production' ? 'Server error changing password.' : `Server Error: ${error.message}`
        });
    }
};


const getHeaderConfig = async (req, res) => {
  console.log('--- Backend: getHeaderConfig called ---'); // Add this line
  try {
    console.log('Attempting findOneAndUpdate with upsert: true...'); // Add this line
    const config = await HeaderModel.findOneAndUpdate(
      { name: 'mainHeaderConfig' },
      {
        $setOnInsert: {
          name: 'mainHeaderConfig',
          images: [{ url: '/path/to/default/image.jpg', altText: 'Default header image' }],
          loggedOutContent: { heading: 'Default Header', paragraph: 'Default welcome text.' },
          loggedInContent: { heading: 'Welcome Back', paragraph: 'Default logged-in text.' },
          loggedOutButton: { text: 'Get Started', link: '#' },
          loggedInButton: { text: 'My Dashboard', link: '#' },
        }
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    console.log('findOneAndUpdate completed.'); // Add this line
    if (config) {
        console.log('Config document found or created:', config._id); // Add this line
        // You could also check timestamps to see if it was just created
        // console.log('Created At:', config.createdAt, 'Updated At:', config.updatedAt);
    } else {
         console.log('findOneAndUpdate returned null/undefined unexpectedly.'); // Add this line
    }


    res.status(200).json({ success: true, data: config });
    console.log('--- Backend: getHeaderConfig finished successfully ---'); // Add this line


  } catch (error) {
    // This block is reached if findOneAndUpdate or something before it fails
    console.error('!!! Error fetching header config in catch block !!!:', error); // Make sure this stands out
    if (error.name === 'CastError' && error.path === 'images') {
        console.error("Specific CastError on images field:", error.reason);
        return res.status(500).json({ success: false, message: 'Server configuration error: Invalid default image format in database setup.' });
    }
     if (error.name === 'CastError' && error.path === '_id') {
         console.error("Specific CastError on _id:", error);
         return res.status(500).json({ success: false, message: 'Server routing or query error for header config.' });
    }
    // Log other types of errors explicitly
    console.error("Other error details:", error);

    res.status(500).json({ success: false, message: 'Server error fetching header configuration.' });
    console.log('--- Backend: getHeaderConfig finished with error ---'); // Add this line

  }
};

const updateHeaderConfig = async (req, res) => {
  const updatedData = req.body;

  try {
    const config = await HeaderModel.findOneAndUpdate(
      { name: 'mainHeaderConfig' },
      updatedData,
      {
        new: true,
        runValidators: true
      }
    );

    if (!config) {
      return res.status(404).json({ success: false, message: 'Header configuration not found.' });
    }

    // --- ADD THIS LINE FOR SUCCESS LOGGING ---
    console.log('Backend: Header configuration updated successfully.');
    // Or include details: console.log('Backend: Header config updated', config.updatedAt);
    // Or log who updated it if authStaff adds user info to req: console.log(`Backend: Staff ${req.staff?._id} updated header config.`);
    // --- END ADD ---

    res.status(200).json({ success: true, data: config });

  } catch (error) {
    // This block is only reached on failure
    console.error('Error updating header config:', error);
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ success: false, message: messages.join(', ') });
    }
    res.status(500).json({ success: false, message: 'Server error updating header configuration.' });
  }
};
const uploadHeaderImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded or file format is incorrect.' });
    }

    const uploadResult = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'image',
      folder: 'header_images'
    });

    if (!uploadResult || !uploadResult.secure_url) {
      console.error('Cloudinary upload failed for header image:', uploadResult);
      return res.status(500).json({ success: false, message: 'Image upload to Cloudinary failed.' });
    }

    const imageUrl = uploadResult.secure_url;

    res.status(200).json({ success: true, imageUrl: imageUrl });
  } catch (error) {
    console.error('Error uploading header image:', error);
    res.status(500).json({ success: false, message: 'Server error uploading image.' });
  }
};


export { registerStaff,getAllStaff,loginStaff ,getStaffProfiles, updateStaffProfile,toggleActiveStatus,updateStaffStatusByAdmin,deleteStaffByAdmin,getStaffById,updateStaffProfiles,deleteAvailabilityOverride,addAvailabilityOverride,deleteScheduledShift,addScheduledShift,deleteRecurringAvailabilityRule,addRecurringAvailabilityRule ,getOwnSchedule,addAvailabilityOverrides,updateAvailabilityOverride,createOrUpdateContact,getContacts,
    changePassword,getHeaderConfig,updateHeaderConfig,uploadHeaderImage
}
