import asyncHandler from 'express-async-handler';
import appointmentModel from '../models/appointmentModel.js';
import Staff from '../models/staffModel.js';
import User from '../models/userModel.js';

const checkSchedulingConflict = async (docId, dateTimeStart, dateTimeEnd, appointmentIdToExclude = null) => {
    const start = new Date(dateTimeStart);
    const end = new Date(dateTimeEnd);

    const query = {
        doctor: docId,
        status: { $nin: ['Cancelled', 'NoShow'] },
        $or: [
            { dateTimeStart: { $gte: start, $lt: end } },
            { dateTimeEnd: { $gt: start, $lte: end } },
            { dateTimeStart: { $lte: start }, dateTimeEnd: { $gte: end } },
        ],
    };

    if (appointmentIdToExclude) {
        query._id = { $ne: appointmentIdToExclude };
    }

    const existingAppointment = await appointmentModel.findOne(query);
    return existingAppointment;
};

const createAppointment = asyncHandler(async (req, res) => {
    const {
        patientId,
        docId,
        dateTimeStart,
        dateTimeEnd,
        reason,
        type,
        notes,
    } = req.body;

    if (!patientId || !docId || !dateTimeStart || !dateTimeEnd || !reason || !type) {
        res.status(400);
        throw new Error('Missing required appointment fields: patientId, docId, dateTimeStart, dateTimeEnd, reason, type');
    }

    const start = new Date(dateTimeStart);
    const end = new Date(dateTimeEnd);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
        res.status(400);
        throw new Error('Invalid dateTimeStart or dateTimeEnd. Ensure they are valid ISO strings and start is before end.');
    }

    let isAuthorized = false;
    if (req.staff && ['admin', 'receptionist'].includes(req.staff.role)) {
        isAuthorized = true;
    } else if (req.user && req.user._id.toString() === patientId) {
        isAuthorized = true;
    }

    if (!isAuthorized) {
        res.status(403);
        throw new Error('Not authorized to create this appointment');
    }

    const conflict = await checkSchedulingConflict(docId, dateTimeStart, dateTimeEnd);
    if (conflict) {
        res.status(409);
        throw new Error(`Scheduling conflict: Doctor is already booked between ${conflict.dateTimeStart.toLocaleString()} and ${conflict.dateTimeEnd.toLocaleString()}`);
    }

    const appointment = new appointmentModel({
        patient: patientId,
        doctor: docId,
        dateTimeStart: start,
        dateTimeEnd: end,
        reason,
        type,
        status: 'Upcoming',
        notes,
        createdBy: req.user?._id || req.staff?._id,
    });

    const createdAppointment = await appointment.save();

    const populatedAppointment = await appointmentModel.findById(createdAppointment._id)
        .populate('patient', 'name email')
        .populate('doctor', 'name specialty');

    res.status(201).json(populatedAppointment);
});

const getAllAppointmentsAdmin = asyncHandler(async (req, res) => {
    const { docId, patientId, status, startDate, endDate } = req.query;
    const queryFilter = {};

    if (docId) queryFilter.doctor = docId;
    if (patientId) queryFilter.patient = patientId;
    if (status) queryFilter.status = status;
    if (startDate || endDate) {
        queryFilter.dateTimeStart = {};
        if (startDate) queryFilter.dateTimeStart.$gte = new Date(startDate);
        if (endDate) queryFilter.dateTimeStart.$lte = new Date(endDate);
    }

    const appointments = await appointmentModel.find(queryFilter)
        .populate('patient', 'name email')
        .populate('doctor', 'name specialty')
        .sort({ dateTimeStart: 1 });

    res.json({ success: true, count: appointments.length, appointments });
});

const getMyAppointments = asyncHandler(async (req, res) => {
    let query = {};

    if (req.user) {
        query = { patient: req.user._id };
    } else if (req.staff?.role === 'doctor') {
        query = { doctor: req.staff._id };
    } else {
        res.json([]);
        return;
    }

    const appointments = await appointmentModel.find(query)
        .populate('patient', 'name email')
        .populate('doctor', 'name specialty')
        .sort({ dateTimeStart: -1 });

    res.json(appointments);
});

const getAppointmentById = asyncHandler(async (req, res) => {
    const appointment = await appointmentModel.findById(req.params.id)
        .populate('patient', 'name email contact gender age')
        .populate('doctor', 'name specialty email');

    if (!appointment) {
        res.status(404);
        throw new Error('Appointment not found');
    }

    let isAuthorized = false;
    const userId = req.user?._id.toString();
    const staffId = req.staff?._id.toString();
    const staffRole = req.staff?.role;

    if (userId && appointment.patient._id.toString() === userId) {
        isAuthorized = true;
    } else if (staffId) {
        if (['admin', 'receptionist'].includes(staffRole)) {
            isAuthorized = true;
        } else if (staffRole === 'doctor' && appointment.doctor._id.toString() === staffId) {
            isAuthorized = true;
        }
    }

    if (!isAuthorized) {
        res.status(403);
        throw new Error('Not authorized to view this appointment');
    }

    res.json(appointment);
});

export {
    createAppointment,
    getAllAppointmentsAdmin,
    getMyAppointments,
    getAppointmentById,
};
