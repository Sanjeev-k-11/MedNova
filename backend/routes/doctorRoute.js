import express from 'express'
import { appointmentCancel, appointmentComplete, appointmentsDoctor, changePassword, doctorDashboard, doctorList, doctorProfile, loginDoctor, updatedoctorProfile  } from '../controllers/doctorController.js'
import authDoctor from '../middlewares/authDoctor.js'


const doctorRouter = express.Router()

doctorRouter.get('/list',doctorList)
doctorRouter.post('/login',loginDoctor)
doctorRouter.get('/appointments',authDoctor,appointmentsDoctor)
doctorRouter.post('/complete-appointment',authDoctor,appointmentComplete)
doctorRouter.post('/cancel-appointment',authDoctor,appointmentCancel)
doctorRouter.get('/doctor-dashbord',authDoctor, doctorDashboard)
doctorRouter.get('/profile',authDoctor,doctorProfile)
doctorRouter.post('/update-profile',authDoctor,updatedoctorProfile)
doctorRouter.post('/change-password',authDoctor,changePassword)

export default doctorRouter