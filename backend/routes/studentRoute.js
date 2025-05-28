// studentRoute.js
import express from 'express'
import { blockStudent, createStudent, deleteStudent, getAllStudents, getStudent, updateStudent } from '../controllers/studentController.js';
import upload from '../middlewares/multer.js';

const Studentrouter = express.Router();

Studentrouter.post('/createstudent',  upload.single('image'), createStudent);
Studentrouter.get('/studentdata', getAllStudents)
Studentrouter.get('/studentBy/:id', getStudent)
Studentrouter.patch('/Update/:id', upload.single('image'), updateStudent)
Studentrouter.delete('/studentdelete/:id', deleteStudent);
Studentrouter.patch('/student/:id/block', blockStudent);
export default Studentrouter;
