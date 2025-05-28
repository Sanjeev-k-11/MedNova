import validator from 'validator';
import bcrypt from 'bcrypt';

import { v2 as cloudinary } from 'cloudinary';
import doctorModel from '../models/doctorModel.js';
import jwt from 'jsonwebtoken';
import appointmentModel from '../models/appointmentModel.js';
import userModel from '../models/userModel.js';
import medicineModel from '../models/medicineModel.js';
import PatientModel from '../models/patientModel.js';
import fs from 'fs';
import mongoose from 'mongoose';

// API for adding a doctor
const addDoctor = async (req, res) => {
    try {
        const { name, email, password, speciality, degree, experience,salary, about, fees, address ,phone} = req.body;
        const imageFile = req.file;

        // Check for missing fields and return specific error messages
        if (!name) return res.json({ success: false, message: "Doctor name is required." });
        if (!email) return res.json({ success: false, message: "Email is required." });
        if (!password) return res.json({ success: false, message: "Password is required." });
        if (!speciality) return res.json({ success: false, message: "Speciality is required." });
        if (!degree) return res.json({ success: false, message: "Degree is required." });
        if (!experience) return res.json({ success: false, message: "Experience is required." });
        if (!about) return res.json({ success: false, message: "About field is required." });
        if (!fees) return res.json({ success: false, message: "Fees are required." });
        if (!phone) return res.json({ success: false, message: "phone are required." });
        if (!salary) return res.json({ success: false, message: "salary are required." });
        if (!address) return res.json({ success: false, message: "Address is required." });
        if (!imageFile) return res.json({ success: false, message: "Doctor image is required." });

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Please enter a valid email address." });
        }

        // Validate strong password
        if (password.length < 8) {
            return res.json({ success: false, message: "Password must be at least 8 characters long." });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Upload image to Cloudinary
        const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
        const imageUrl = imageUpload.secure_url;

        const doctorData = {
            name,
            email,
            password: hashedPassword,
            image: imageUrl,
            speciality,
            degree,
            experience,
            about,
            fees,
            salary,
            phone,
            address: JSON.parse(address),
            date: Date.now(),
        };

        const newDoctor = new doctorModel(doctorData);
        await newDoctor.save();

        res.json({ success: true, message: "Doctor added successfully!", doctor: newDoctor });

    } catch (error) { 
        res.json({ success: false, message: error.message });
    }
};

// API for admin login
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: "365d" });
            res.json({ success: true, token });
        } else {
            res.json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) { 
        res.json({ success: false, message: error.message });
    }
};


//API TO get all doctor list for amin pannel

const allDoctors = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select('-password')
        res.json({ success: true, doctors })

    } catch (error) { 
        res.json({ success: false, message: error.message })
    }
}

// Api to get all appointments list

const appointmentsAdmin = async (req, res) => {
    try {
        const appintments = await appointmentModel.find({})
        res.json({ success: true, appointments: appintments })


    } catch (error) { 
        res.json({ success: false, message: error.message })

    }
}


// APi for appointment cancel


const appointmentCancelByAdmin = async (req, res) => {

    try {

        const { appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)

        

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        // releasing doctor slot

        const { docId, slotDate, slotTime } = appointmentData

        const doctorData = await doctorModel.findById(docId)

        let slots_booked = doctorData.slots_booked

        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        res.json({ success: true, message: "Appointment Cancelled" })

    } catch (error) { 
        res.json({ success: false, message: error.message })




    }
}


//Api to get dashbord data for admin panel

const adminDashboard = async (req, res) =>{

    try{

        const doctors = await doctorModel.find({})
        const users = await userModel.find({})
        const appointments = await appointmentModel.find({})

        const dashData = {
            doctors : doctors.length,
            appointments:appointments.length,
            patients: users.length,
            users: users.length,
            latestAppointments: appointments.reverse().slice(0,5)

        }
        res.json({success:true,dashData}) 


    }catch (error){ 
        res.json({success:false,message : error.message})
    }
}

 const deleteDoctor = async (req, res) => {
    try {
        const { id } = req.params; 

        if (!id) {
            console.error("Doctor ID is missing");
            return res.status(400).json({ success: false, message: "Doctor ID is required" });
        }

        const doctor = await doctorModel.findByIdAndDelete(id);  // Make sure Doctor is defined

        if (!doctor) {
            console.error("Doctor not found:", id);
            return res.status(404).json({ success: false, message: "Doctor not found" });
        }

        res.status(200).json({ success: true, message: "Doctor deleted successfully!" });
    } catch (error) {
        console.error("Error in deleteDoctor:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

// Get All Medicines
const addMedicine = async (req, res) => {
    try {
        const { name, discountedPrice,originalPrice, quantity, expiryDate, manufacturer, description } = req.body;
        const imageFile = req.file;

        if (!name || !originalPrice || !discountedPrice || !quantity || !expiryDate || !manufacturer) {
            return res.status(400).json({ success: false, message: "Please fill all required fields!" });
        }

        let imageUrl = "";
        if (imageFile) {
            // Upload image to Cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: "image" });
            imageUrl = imageUpload.secure_url;
        }

        const newMedicine = new medicineModel({
            name,
            discountedPrice,
            originalPrice,
            quantity,
            expiryDate,
            manufacturer,
            description,
            imageUrl,
        });

        await newMedicine.save();
        res.status(201).json({ success: true, message: "Medicine added successfully!", newMedicine });
    } catch (error) {
        console.error("Error adding medicine:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

const getAllMedicines = async (req, res) => {
    try {
        
        // Fetch all medicines
        const medicines = await medicineModel.find({});

        // Check if a medicine is bought (through a query param)
        if (req.query.buyMedicineId) {
            const medicine = await medicineModel.findById(req.query.buyMedicineId);

            if (!medicine) {
                return res.status(404).json({ success: false, message: "Medicine not found" });
            }

            if (medicine.quantity <= 0) {
                return res.status(400).json({ success: false, message: "Out of stock" });
            }

            // Decrement the quantity by 1
            medicine.quantity -= 1;
            await medicine.save();
        }

        // Send the final list of medicines
        res.status(200).json({ success: true, medicines });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};




// Get single medicine by ID
const getMedicineById = async (req, res) => {
    try {
        const { id } = req.params;
        const medicine = await medicineModel.findById(id);
        if (!medicine) return res.status(404).json({ success: false, message: "Medicine not found!" });
        res.status(200).json({ success: true, medicine });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch medicine" });
    }
};




const updateMedicine = async (req, res) => {
    try {
        const { id } = req.params;
        let updatedData = req.body;

        console.log("--- Update Medicine Controller Start ---");
        console.log(`Attempting to update medicine with ID: ${id}`);
        console.log("Initial req.body:", req.body);
        console.log("Received file object (req.file) from multer:", req.file);


        if (req.file && req.file.path) {
            console.log(`File detected: ${req.file.originalname}, Mimetype: ${req.file.mimetype}, Path: ${req.file.path}`);
            console.log("Proceeding with Cloudinary upload using file path...");

            try {
                 const result = await cloudinary.uploader.upload(req.file.path, {
                    resource_type: 'image',
                    folder: 'medicines',
                 });

                if (!result || !result.secure_url) {
                     console.error("Cloudinary upload succeeded but returned no secure_url:", result);
                     fs.unlink(req.file.path, (err) => { if (err) console.error("Failed to delete temp file after failed upload:", err); });
                     return res.status(500).json({ success: false, message: "Image upload failed: Could not get image URL from Cloudinary result." });
                }

                updatedData.imageUrl = result.secure_url;
                console.log("Cloudinary upload successful. New imageUrl set:", updatedData.imageUrl);

                 fs.unlink(req.file.path, (err) => {
                     if (err) console.error("Error deleting temporary file:", err);
                     else console.log("Temporary file deleted:", req.file.path);
                 });

            } catch (uploadError) {
                 console.error("Error details during Cloudinary upload:", uploadError);
                 fs.unlink(req.file.path, (err) => {
                      if (err) console.error("Error deleting temporary file on upload failure:", err);
                      else console.log("Temporary file deleted on upload failure:", req.file.path);
                 });
                 return res.status(500).json({ success: false, message: "Failed to upload image to Cloudinary." });
            }

        } else {
            console.log("No new image file uploaded (req.file is missing or path is undefined).");
        }


        console.log("Data being passed to Mongoose findByIdAndUpdate:", updatedData);
        const updatedMedicine = await medicineModel.findByIdAndUpdate(
            id,
            updatedData,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedMedicine) {
            console.log(`Mongoose update failed: Medicine with ID ${id} not found.`);
            return res.status(404).json({ success: false, message: "Medicine not found!" });
        }

        console.log("Mongoose findByIdAndUpdate successful.");
        console.log("Updated medicine document from DB:", updatedMedicine);

        res.status(200).json({ success: true, message: "Medicine updated successfully!", medicine: updatedMedicine });
        console.log("--- Update Medicine Controller End (Success) ---");


    } catch (error) {
        console.error("--- Update Medicine Controller Error ---");
        console.error("Catch block triggered. Error details:", error);

        if (error.name === 'CastError') {
             console.error("CastError: Invalid ID format.");
             return res.status(400).json({ success: false, message: "Invalid medicine ID format." });
        }
        if (error.name === 'ValidationError') {
             console.error("ValidationError:", error.message);
             const messages = Object.values(error.errors).map(val => val.message);
             return res.status(400).json({ success: false, message: messages.join(', ') });
        }

        console.error("Generic 500 error.");
        res.status(500).json({ success: false, message: "Failed to update medicine." });
        console.log("--- Update Medicine Controller End (Error) ---");
    }
};


// Delete medicine
const deleteMedicine = async (req, res) => {
    try {
        const { id } = req.params;
        const medicine = await medicineModel.findByIdAndDelete(id);
        if (!medicine) return res.status(404).json({ success: false, message: "Medicine not found!" });
        res.status(200).json({ success: true, message: "Medicine deleted successfully!" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete medicine" });
    }
};


// Check Medicine Stock Status
const checkStockStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const medicine = await medicineModel.findById(id);

        if (!medicine) {
            return res.status(404).json({ success: false, message: "Medicine not found!" });
        }

        // Check stock status
        const isInStock = medicine.quantity > 0;
        const statusMessage = isInStock ? "✅ Medicine is in stock." : "🛑 Medicine is out of stock.";

        res.status(200).json({
            success: true,
            message: statusMessage,
            inStock: isInStock,
            quantity: medicine.quantity,
        });
    } catch (error) {
        console.error("❌ Error:", error.message);
        res.status(500).json({ success: false, message: "Failed to check stock status." });
    }
};

// const registerStaff = async (req, res) => {
//     console.log('--- registerStaff Controller (FormData) ---');
//     console.log('Received body:', req.body);
//     console.log('Received file:', req.file);

//     const {
//         name,
//         email,
//         password,
//         vid,
//         role,
//         salary,
//         phone,
//         address: addressString
//     } = req.body;

//     const imageFile = req.file;

//     if (!imageFile) {
//         return res.status(400).json({ success: false, message: 'Staff image file is required for upload.' });
//     }
//     if (!name || !email || !password || !vid || !role || salary === undefined || salary === null) {
//         return res.status(400).json({
//             success: false,
//             message: 'Please provide name, email, password, VID, role, and salary.'
//         });
//     }
//     if (!/^\d{6}$/.test(vid)) {
//         return res.status(400).json({ success: false, message: "VID must contain exactly 6 digits." });
//     }
//     if (!/\S+@\S+\.\S+/.test(email)) {
//         return res.status(400).json({ success: false, message: "Please use a valid email address." });
//     }

//     let parsedAddress = {};
//     if (addressString) {
//         try {
//             parsedAddress = JSON.parse(addressString);
//             if (typeof parsedAddress !== 'object' || parsedAddress === null) {
//                 throw new Error('Parsed address is not an object.');
//             }
//             parsedAddress.line1 = parsedAddress.line1 || '';
//             parsedAddress.line2 = parsedAddress.line2 || '';
//             parsedAddress.city = parsedAddress.city || '';
//             parsedAddress.postalCode = parsedAddress.postalCode || '';
//             parsedAddress.country = parsedAddress.country || '';
//         } catch (parseError) {
//             return res.status(400).json({ success: false, message: 'Invalid address format provided.' });
//         }
//     }

//     let imageUrl = "";

//     try {
//         const imageUpload = await cloudinary.uploader.upload(imageFile.path, {
//             folder: "staff_images",
//             resource_type: "image"
//         });
//         imageUrl = imageUpload.secure_url;
//         if (!imageUrl) {
//             throw new Error('Cloudinary did not return a URL.');
//         }

//         const existingStaff = await staffModel.findOne({
//             $or: [{ email: email.toLowerCase() }, { vid: vid }]
//         }).lean();

//         if (existingStaff) {
//             const message = existingStaff.email === email.toLowerCase()
//                 ? 'Staff member with this email already exists.'
//                 : 'Staff member with this VID already exists.';
//             return res.status(400).json({ success: false, message });
//         }

//         const newStaff = new staffModel({
//             name,
//             email: email.toLowerCase(),
//             password,
//             vid,
//             role,
//             salary: Number(salary),
//             phone,
//             address: parsedAddress,
//             image: imageUrl
//         });

//         const savedStaff = await newStaff.save();

//         const staffData = {
//             _id: savedStaff._id,
//             name: savedStaff.name,
//             email: savedStaff.email,
//             vid: savedStaff.vid,
//             role: savedStaff.role,
//             image: savedStaff.image,
//             phone: savedStaff.phone,
//             address: savedStaff.address,
//             salary: savedStaff.salary,
//             isActive: savedStaff.isActive,
//             createdAt: savedStaff.createdAt,
//             updatedAt: savedStaff.updatedAt,
//         };

//         res.status(201).json({
//             success: true,
//             message: 'Staff member registered successfully.',
//             staff: staffData
//         });

//     } catch (error) {
//         if (error.code === 11000) {
//             const field = error.message.includes('email_') ? 'email' : error.message.includes('vid_') ? 'VID' : 'unique field';
//             return res.status(400).json({
//                 success: false,
//                 message: `Staff member with this ${field} already exists.`
//             });
//         }

//         if (error.name === 'ValidationError') {
//             const messages = Object.values(error.errors).map(val => val.message);
//             return res.status(400).json({
//                 success: false,
//                 message: messages.join(' ')
//             });
//         }

//         res.status(500).json({
//             success: false,
//             message: process.env.NODE_ENV === 'production' ? 'Server error during staff registration.' : error.message
//         });
//     }
// };
const getAllPatients = async (req, res) => {
    
    try {
        const patients = await PatientModel.find({})
            .sort({ createdAt: -1 })
            .lean();


        res.status(200).json({
            success: true,
            count: patients.length,
            patients: patients
        });

    } catch (error) {
        console.error('!!! Backend ERROR fetching all patients for ', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred while retrieving patient records.'
        });
    }
};


const getPatientById = async (req, res) => {
    const { patientId } = req.params;
    try {
        const patient = await PatientModel.findById(patientId).lean();

        if (!patient) {
            console.warn(`Patient not found for ID: ${patientId})`);
            return res.status(404).json({ success: false, message: 'Patient not found.' });
        }
 
        res.status(200).json({
            success: true,
            patient: patient
        });

    } catch (error) {
        console.error(`!!! ERROR fetching patient by ID (${patientId})`, error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred while retrieving patient details.'
        });
    }
};



const getAllUsers = async (req, res) => {
    if (req.method !== 'GET') {
        return res.status(405).json({ success: false, message: 'Method Not Allowed' });
    }

    try {
        const users = await userModel.find({}).select('-password -otp -otpExpiry');
        return res.status(200).json({ success: true, data: users });
    } catch (error) {
        console.error('Error fetching users for admin:', error);
        return res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
};


const handleBlockUser = async (req, res) => {
    const targetUserId = req.params.id;

    if (!targetUserId || !mongoose.Types.ObjectId.isValid(targetUserId)) {
        return res.status(400).json({ success: false, message: 'Invalid target user ID format.' });
    }

    if (req.adminUser && req.adminUser._id.toString() === targetUserId) {
        return res.status(400).json({ success: false, message: 'Cannot block or unblock your own account.' });
    }

    try {
        const user = await userModel.findById(targetUserId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'Target user not found.' });
        }

        if (user.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Cannot block or unblock another admin account.' });
        }

        user.isBlocked = !user.isBlocked;
        await user.save();

        const updatedUserSafe = user.toObject();
        delete updatedUserSafe.password;
        delete updatedUserSafe.otp;
        delete updatedUserSafe.otpExpiry;

        res.status(200).json({
            success: true,
            message: `User account ${user.isBlocked ? 'blocked' : 'unblocked'} successfully.`,
            data: updatedUserSafe
        });
    } catch (error) {
        console.error(`Error blocking/unblocking user ${targetUserId}:`, error);
        res.status(500).json({ success: false, message: 'Failed to update user block status.', error: error.message });
    }
};

const handleDeleteUser = async (req, res) => {
    const targetUserId = req.params.id;

    if (!targetUserId || !mongoose.Types.ObjectId.isValid(targetUserId)) {
        return res.status(400).json({ success: false, message: 'Invalid target user ID format.' });
    }

    if (req.adminUser && req.adminUser._id.toString() === targetUserId) {
        return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    }

    try {
        const userToDelete = await userModel.findById(targetUserId);

        if (!userToDelete) {
            return res.status(404).json({ success: false, message: 'Target user not found.' });
        }

        if (userToDelete.role === 'admin') {
            return res.status(403).json({ success: false, message: 'Cannot delete another admin account.' });
        }

        await userModel.findByIdAndDelete(targetUserId);
        res.status(200).json({ success: true, message: 'User deleted successfully.' });
    } catch (error) {
        console.error(`Error deleting user ${targetUserId}:`, error);
        res.status(500).json({ success: false, message: 'Failed to delete user.', error: error.message });
    }
};
export { addDoctor, loginAdmin, allDoctors, appointmentsAdmin , appointmentCancelByAdmin,adminDashboard, deleteDoctor ,addMedicine,deleteMedicine,getAllMedicines,getMedicineById,updateMedicine, checkStockStatus,getAllPatients, getPatientById
    ,getAllUsers,handleBlockUser,handleDeleteUser
};
