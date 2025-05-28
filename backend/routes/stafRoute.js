import express from 'express'


const staffRouter =express.Router()
import  upload from '../middlewares/multer.js'
import {  addAvailabilityOverride, addAvailabilityOverrides, addRecurringAvailabilityRule, addScheduledShift, changePassword, createOrUpdateContact, deleteAvailabilityOverride, deleteRecurringAvailabilityRule, deleteScheduledShift, deleteStaffByAdmin, getAllStaff, getContacts, getHeaderConfig, getOwnSchedule, getStaffById, getStaffProfiles, loginStaff, registerStaff, toggleActiveStatus, updateAvailabilityOverride, updateHeaderConfig, updateStaffProfile, updateStaffProfiles, updateStaffStatusByAdmin, uploadHeaderImage } from '../controllers/staffController.js';
import authAdmin from '../middlewares/authAdmin.js';
import authStaff from '../middlewares/authStaff.js';
import { createAppointment, getAllAppointmentsAdmin, getMyAppointments } from '../controllers/nursecontroller.js';
import { addPatient,  getAllStaffPatients, getPatientByIdForStaff, updatePatientStatus } from '../controllers/patientcontroller.js';
;


staffRouter.post('/login', loginStaff);
staffRouter.post('/register',  upload.single('image'), registerStaff);
staffRouter.get('/list', authAdmin, getAllStaff);

staffRouter.get('/configheader', authStaff, getHeaderConfig);
staffRouter.put('/updateheader',authStaff, updateHeaderConfig);
staffRouter.post('/upload-image', upload.single('image'),authStaff, uploadHeaderImage);

staffRouter.get('/profile', authStaff, getStaffProfiles);


staffRouter.put('/update-profile', authStaff, updateStaffProfile);
staffRouter.put('/me/password', authStaff,changePassword);
staffRouter.post('/toggle-active' ,authStaff,toggleActiveStatus);

staffRouter.patch('/:id/status', authAdmin, updateStaffStatusByAdmin);
staffRouter.delete('/:id', authAdmin, deleteStaffByAdmin);

staffRouter.put('/:id',upload.single('image'),updateStaffProfiles)

staffRouter.post('/', createAppointment);
staffRouter.get('/admin',  getAllAppointmentsAdmin);
staffRouter.get('/my',  getMyAppointments);


staffRouter.post('/:staffId/recurring-availability',authAdmin, addRecurringAvailabilityRule);
staffRouter.delete('/:staffId/recurring-availability/:ruleId',authAdmin, deleteRecurringAvailabilityRule);
staffRouter.post('/:staffId/shifts',authAdmin, addScheduledShift);
staffRouter.delete('/:staffId/shifts/:shiftId', authAdmin, deleteScheduledShift);
staffRouter.post('/:staffId/overrides', authAdmin,addAvailabilityOverride);
staffRouter.delete('/:staffId/overrides/:overrideId',authAdmin, deleteAvailabilityOverride);
staffRouter.get('/schedule/me', authStaff, getOwnSchedule); 

staffRouter.post('/schedule/availability-override', authStaff, addAvailabilityOverrides);
staffRouter.put('/schedule/availability-override/:overrideId', authStaff, updateAvailabilityOverride);

staffRouter.get('/contect-data', getContacts);
staffRouter.post('/contact',upload.single('image'),  createOrUpdateContact);


staffRouter.post('/patient',authStaff, addPatient);
staffRouter.patch('/:id/status',authStaff, updatePatientStatus);
staffRouter.get('/patients', getAllStaffPatients);
staffRouter.get('/patients/:patientId',  getPatientByIdForStaff);
staffRouter.get('/:id', getStaffById);



export default staffRouter