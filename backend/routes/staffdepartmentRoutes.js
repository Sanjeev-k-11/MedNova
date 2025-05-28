// routes/departmentLocationRoutes.js (Modified with ES Modules)
import express from 'express';
import authStaff from '../middlewares/authStaff.js';
import {
  createLocation,
  deleteLocation,
  getAllLocations,
  getLocationById,
  updateLocation
} from '../controllers/StaffdepartmentController.js';

const deprouter = express.Router();

// Department Location Routes (Protected by Staff Middleware)
deprouter.get('/list', authStaff, getAllLocations);
deprouter.post('/create', authStaff, createLocation);
deprouter.get('/:id', authStaff, getLocationById);
deprouter.put('/:id', authStaff, updateLocation);
deprouter.delete('/:id', authStaff, deleteLocation);

export default deprouter;
