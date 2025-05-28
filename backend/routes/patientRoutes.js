import express from 'express'; 
import { 
    getAllPatients,  
    getPatientById   
} from '../controllers/adminController.js';
 

const patientRoute = express.Router();
 
 
patientRoute.get('/', getAllPatients);
 
patientRoute.get('/:patientId', getPatientById); 

export default patientRoute;