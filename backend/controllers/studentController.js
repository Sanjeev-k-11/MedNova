// controllers/studentController.js

import Student from '../models/studentModel.js';
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
// Assuming you have an error handling utility like AppError or catchAsync
// import AppError from '../utils/appError.js'; // Adjust path

// Helper function to delete a temporary file
const deleteTempFile = (filePath) => {
    if (filePath) {
        fs.unlink(filePath, (err) => {
            if (err) console.error('Failed to delete temporary file:', err);
        });
    }
};

// @desc    Create a new Student
// @route   POST /api/student/createstudent
// @access  Staff (Assuming Staff authentication middleware is applied)
const createStudent = async (req, res, next) => {
  let profileImageUrl = null;
  let tempFilePath = req.file ? req.file.path : null; // Store temp file path

  if (req.file) {
    try {
      const imageUploadResult = await cloudinary.uploader.upload(tempFilePath, {
        folder: 'student_profile_images',
        resource_type: 'image'
      });
      profileImageUrl = imageUploadResult.secure_url;

    } catch (uploadError) {
      console.error('Cloudinary upload error:', uploadError);
      deleteTempFile(tempFilePath); // Clean up temp file on upload failure
      const error = new Error('Failed to upload profile image.');
      error.statusCode = 500;
      return next(error);
    }
  }

  // Prepare student data, including data from body and the potential image URL
  const studentData = {
    ...req.body, // Includes virtualId and password from the form
    profileImage: profileImageUrl,
    // Note: Mongoose handles validation, required fields, and password hashing via pre-save middleware
  };

  try {
    const newStudent = await Student.create(studentData);

    // Clean up temp file on successful creation
    deleteTempFile(tempFilePath);

    res.status(201).json({
      status: 'success',
      data: {
        student: newStudent, // Password will not be included due to `select: false`
      },
    });
  } catch (err) {
    console.error('Database Error (Create Student):', err);
    // Clean up temp file if database save fails after Cloudinary upload
    deleteTempFile(tempFilePath);
    // Pass error to global error handler (e.g., for Mongoose validation/unique errors)
    return next(err);
  }
};


// @desc    Get all Students
// @route   GET /api/student
// @access  Staff (Assuming Staff authentication middleware is applied)
const getAllStudents = async (req, res, next) => {
  try {
    // Implement filtering, sorting, pagination here if needed
    const students = await Student.find(); // Find all students

    res.status(200).json({
      status: 'success',
      results: students.length,
      data: {
        students,
      },
    });
  } catch (err) {
    console.error('Database Error (Get All Students):', err);
    return next(err);
  }
};

// @desc    Get single Student by ID
// @route   GET /api/student/:id
// @access  Staff (Assuming Staff authentication middleware is applied)
const getStudent = async (req, res, next) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      // If using a custom error class: return next(new AppError('No student found with that ID', 404));
      const error = new Error('No student found with that ID');
      error.statusCode = 404;
      return next(error);
    }

    res.status(200).json({
      status: 'success',
      data: {
        student,
      },
    });
  } catch (err) {
     // Handle CastError if ID format is invalid
     if (err.name === 'CastError') {
         const error = new Error(`Invalid ID format: ${req.params.id}`);
         error.statusCode = 400; // Bad Request
         return next(error);
     }
    console.error('Database Error (Get Student):', err);
    return next(err);
  }
};


// @desc    Update Student by ID (including blocking/unblocking via status)
// @route   PATCH /api/student/:id
// @access  Staff (Assuming Staff authentication middleware is applied)
const updateStudent = async (req, res, next) => {
    let profileImageUrl = null;
    let tempFilePath = req.file ? req.file.path : null;

    // If there is a new file, upload it and get the URL
    if (req.file) {
        try {
            const imageUploadResult = await cloudinary.uploader.upload(tempFilePath, {
                folder: 'student_profile_images',
                resource_type: 'image',
                // Optional: if updating, you might want to handle replacing the old image
                // by passing the old image's public ID here. Needs finding the student first.
                // public_id: 'old_public_id', // if replacing
                // overwrite: true // if replacing
            });
            profileImageUrl = imageUploadResult.secure_url;
        } catch (uploadError) {
            console.error('Cloudinary upload error (Update Student):', uploadError);
            deleteTempFile(tempFilePath);
            const error = new Error('Failed to upload new profile image.');
            error.statusCode = 500;
            return next(error);
        }
    }

    // Prepare the data to update
    const updateData = { ...req.body };

    // If a new image URL was obtained, add it to updateData
    if (profileImageUrl) {
        updateData.profileImage = profileImageUrl;
    }
    // Note: If req.file is NOT present, profileImage in updateData comes from req.body
    // If req.body explicitly sends { profileImage: null } or { profileImage: "" }, Mongoose will clear it.
    // If req.body doesn't send profileImage and no file is uploaded, the field remains unchanged.

    // If password is in req.body, the model's pre('save') hook will hash it when `runValidators: true` is used.

    try {
        // findByIdAndUpdate is often used, BUT it bypasses save middleware (like password hashing) by default.
        // To trigger save middleware and schema validators, use findByIdAndUpdate with options:
        // `new: true` returns the updated document
        // `runValidators: true` runs schema validators (including required, enum, and the pre-save hook)
        const student = await Student.findByIdAndUpdate(req.params.id, updateData, {
            new: true, // Return the modified document rather than the original
            runValidators: true, // Run schema validators on update
            // Important: By default, findByIdAndUpdate only applies updates present in updateData.
            // If you send { email: 'new@example.com' } and not { password: '...' }, only email is updated.
            // The password hook only runs if password is IN updateData and IS MODIFIED.
        });

        // Clean up temp file on successful update
        deleteTempFile(tempFilePath);


        if (!student) {
             const error = new Error('No student found with that ID');
             error.statusCode = 404;
             return next(error);
        }

        res.status(200).json({
            status: 'success',
            data: {
                student, // Password excluded by select: false
            },
        });
    } catch (err) {
        console.error('Database Error (Update Student):', err);
        // Clean up temp file if database update fails after Cloudinary upload
        deleteTempFile(tempFilePath);

        // Handle specific errors like validation or cast errors
        if (err.name === 'CastError') {
             const error = new Error(`Invalid ID format: ${req.params.id}`);
             error.statusCode = 400;
             return next(error);
        }
         // Mongoose Validation Errors also have name 'ValidationError'
         // Duplicate key errors have code 11000
        return next(err); // Pass other errors (validation, unique) to global handler
    }
};


// @desc    Delete Student by ID
// @route   DELETE /api/student/:id
// @access  Staff (Assuming Staff authentication middleware is applied)
const deleteStudent = async (req, res, next) => {
    try {
        // Note: This deletes the database record. It does NOT automatically delete the image from Cloudinary.
        // If you need to delete the image from Cloudinary as well, you would first
        // find the student to get the image URL/public ID, then delete the image,
        // then delete the student document. This makes the operation more complex.
        // For simplicity here, we just delete the database record.
        const student = await Student.findByIdAndDelete(req.params.id);

        if (!student) {
            const error = new Error('No student found with that ID');
            error.statusCode = 404;
            return next(error);
        }

        // Successful deletion returns 204 No Content, often without a body
        res.status(204).json({
            status: 'success',
            data: null, // No content for 204
        });

    } catch (err) {
        console.error('Database Error (Delete Student):', err);
         if (err.name === 'CastError') {
             const error = new Error(`Invalid ID format: ${req.params.id}`);
             error.statusCode = 400;
             return next(error);
         }
        return next(err);
    }
};


const blockStudent = async (req, res, next) => {
    try {
        const student = await Student.findByIdAndUpdate(req.params.id, { status: 'blocked' }, {
            new: true,
            runValidators: true // Still run validators if you have constraints on status
        });

        if (!student) {
             const error = new Error('No student found with that ID');
             error.statusCode = 404;
             return next(error);
        }

         res.status(200).json({
            status: 'success',
            data: {
                student,
            },
        });

    } catch (err) {
         console.error('Database Error (Block Student):', err);
         if (err.name === 'CastError') {
             const error = new Error(`Invalid ID format: ${req.params.id}`);
             error.statusCode = 400;
             return next(error);
         }
        return next(err);
    }
};



export {
    createStudent,
    getAllStudents,
    getStudent,
    updateStudent, // Use this for general edits and status changes (block/unblock)
    deleteStudent,
    blockStudent, // Uncomment if you want a dedicated endpoint for blocking
};