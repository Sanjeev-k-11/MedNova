import mongoose from 'mongoose';
import PatientModel from "../models/patientModel.js";

const addPatient = async (req, res) => {
    console.log('--- Start addPatient ---');
    console.log('Request Body RAW:', JSON.stringify(req.body, null, 2));

    const loggedInStaffId = req.staff?._id;

    if (!loggedInStaffId) {
        console.error('Error in addPatient: Staff ID not found in request. Middleware issue or unauthenticated request.');
        return res.status(401).json({ message: 'Authentication failed: Could not identify the logged-in staff member.' });
    }
    console.log(`Staff ID from request: ${loggedInStaffId}`);

    const {
        name, age, gender, phone, address,
        medicalHistory, previousVisit, previousDate, doctorName, vid,
        appointmentDetails,
        paymentDetails: receivedPaymentDetails,
        appointmentStatus
    } = req.body;

    console.log('Destructured receivedPaymentDetails:', JSON.stringify(receivedPaymentDetails, null, 2));

    if (!name || !age || !gender || !phone || !address) {
        return res.status(400).json({ message: 'Please provide all required basic patient information (Name, Age, Gender, Phone, Address).' });
    }

    const paymentStatusFromRequest = receivedPaymentDetails?.status;
    const allowedPaymentStatuses = PatientModel.schema.path('paymentDetails.status').enumValues;
    if (paymentStatusFromRequest && !allowedPaymentStatuses.includes(paymentStatusFromRequest)) {
        return res.status(400).json({ message: `Invalid payment status provided. Allowed values: ${allowedPaymentStatuses.join(', ')}` });
    }
    const allowedAppointmentStatuses = PatientModel.schema.path('appointmentStatus').enumValues;
    if (appointmentStatus && !allowedAppointmentStatuses.includes(appointmentStatus)) {
         return res.status(400).json({ message: `Invalid appointment status provided. Allowed values: ${allowedAppointmentStatuses.join(', ')}` });
    }

    try {
        const paymentAmountParsed = (receivedPaymentDetails?.amount) ? parseFloat(receivedPaymentDetails.amount) : null;

        const patientData = {
            staffId: loggedInStaffId,
            name,
            age: parseInt(age, 10),
            gender, phone, address,
            medicalHistory: medicalHistory || '',
            previousVisit: {
                hasVisited: previousVisit === 'yes',
                lastVisitDate: (previousVisit === 'yes' && previousDate) ? new Date(previousDate) : null,
                lastDoctorName: (previousVisit === 'yes') ? (doctorName || null) : null,
                lastVisitId: (previousVisit === 'yes') ? (vid || null) : null,
            },
            appointmentDetails: appointmentDetails || null,
            paymentDetails: {
                amount: paymentAmountParsed,
                method: receivedPaymentDetails?.method || null,
                status: paymentStatusFromRequest || 'Unpaid',
                transactionId: receivedPaymentDetails?.transactionId || null,
                paymentDate: (paymentStatusFromRequest === 'Paid' && paymentAmountParsed != null && paymentAmountParsed > 0) ? new Date() : null,
                notes: receivedPaymentDetails?.notes || null
            },
            appointmentStatus: appointmentStatus || 'Scheduled'
        };

        console.log('Data Prepared for Saving (patientData):', JSON.stringify(patientData, null, 2));

        if (isNaN(patientData.age)) {
             return res.status(400).json({ message: 'Invalid Age provided. Age must be a number.' });
        }
        if (receivedPaymentDetails?.amount && isNaN(patientData.paymentDetails.amount)) {
             return res.status(400).json({ message: 'Invalid Payment Amount provided. Amount must be a number.' });
        }

        console.log('Attempting to save patient data...');
        const newPatient = new PatientModel(patientData);
        const savedPatient = await newPatient.save();
        console.log('Patient saved successfully (savedPatient):', JSON.stringify(savedPatient, null, 2));

        res.status(201).json({
            message: 'Patient added successfully!',
            patient: savedPatient
        });

    } catch (error) {
         console.error('!!! Error in addPatient during save or validation:', error);

        if (error.name === 'ValidationError') {
            if (error.errors?.staffId) {
                 console.error("Validation Error specifically for staffId:", error.errors.staffId.message);
                 return res.status(500).json({ message: 'Internal Server Error: Could not associate patient with staff.' });
            }
            const errors = Object.values(error.errors).map(el => el.message);
            console.error("Validation Errors:", errors);
            res.status(400).json({ message: 'Validation Error creating patient record.', errors: errors });
        } else if (error.code === 11000) {
            const field = Object.keys(error.keyValue)[0];
            const value = error.keyValue[field];
            console.error(`Duplicate key error for field: ${field}, value: ${value}`);
            res.status(409).json({ message: `Error: A record with the ${field} '${value}' already exists.`, field: field });
        } else {
            res.status(500).json({ message: 'Server error occurred while adding the patient.' });
        }
    }
    console.log('--- End addPatient ---');
};

// --- Keep your existing updatePatientStatus function ---
const updatePatientStatus = async (req, res) => {
    // ... (updatePatientStatus code remains the same)
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid Patient ID format.' });
    }
    if (!status) {
        return res.status(400).json({ message: 'New status is required.' });
    }
    const allowedStatuses = PatientModel.schema.path('appointmentStatus').enumValues;
    if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
            message: `Invalid status value '${status}'. Allowed values are: ${allowedStatuses.join(', ')}.`
        });
    }
    try {
        const updatedPatient = await PatientModel.findByIdAndUpdate(
            id,
            { $set: { appointmentStatus: status } },
            { new: true, runValidators: true }
        );
        if (!updatedPatient) {
            return res.status(404).json({ message: 'Patient not found with the provided ID.' });
        }
        console.log(`Patient status updated successfully for ID ${id} to ${status}`);
        res.status(200).json({
            message: `Patient appointment status successfully updated to '${status}'!`,
            patient: updatedPatient
        });
    } catch (error) {
        console.error('Error updating patient status:', error);
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(el => el.message);
            res.status(400).json({ message: 'Validation Error during update', errors: errors });
        } else if (error.name === 'CastError') {
             res.status(400).json({ message: 'Invalid ID format causing cast error.' });
        } else {
            res.status(500).json({ message: 'Server error occurred while updating patient status.' });
        }
    }
};


const getAllStaffPatients = async (req, res) => {
    console.log(`Staff member ${req.staff?._id || 'Unknown'} requested all patients.`);

    try {
        const patients = await PatientModel.find({})
            .sort({ createdAt: -1 });

        console.log(`Successfully fetched ${patients.length} patient records.`);

        res.status(200).json({
            success: true,
            count: patients.length,
            patients: patients
        });

    } catch (error) {
        console.error('!!! ERROR fetching all patients:', error);

        res.status(500).json({
            success: false,
            message: 'Server error occurred while retrieving patient records.'
        });
    }
};


const getPatientByIdForStaff = async (req, res) => {
    const { patientId } = req.params;
    console.log(`Staff ${req.staff?._id || 'Unknown'} requested details for Patient ID: ${patientId}`);

    if (!mongoose.Types.ObjectId.isValid(patientId)) {
        console.warn(`Invalid Patient ID format received: ${patientId}`);
        return res.status(400).json({ success: false, message: 'Invalid Patient ID format.' });
    }

    try {
        const patient = await PatientModel.findById(patientId);

        if (!patient) {
            console.warn(`Patient not found for ID: ${patientId}`);
            return res.status(404).json({ success: false, message: 'Patient not found.' });
        }

        console.log(`Successfully fetched patient details for ID: ${patientId}`);
        res.status(200).json({
            success: true,
            patient: patient
        });

    } catch (error) {
        console.error(`!!! ERROR fetching patient by ID (${patientId}):`, error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred while retrieving patient details.'
        });
    }
};

export { addPatient, updatePatientStatus, getAllStaffPatients ,getPatientByIdForStaff };
