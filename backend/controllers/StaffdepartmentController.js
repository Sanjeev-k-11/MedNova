import DepartmentLocationModel from "../models/DepartmentModel.js";
import validator from 'validator'
const getAllLocations = async (req, res) => {
  try {
    const locations = await DepartmentLocationModel.find().sort('order name');
    res.status(200).json({
      success: true,
      count: locations.length,
      data: locations
    });
  } catch (err) {
    console.error("Error fetching locations:", err);
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: err.message
    });
  }
};

const getLocationById = async (req, res) => {
  try {
    const location = await DepartmentLocationModel.findById(req.params.id);
    if (!location) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Location with id ${req.params.id} not found`
      });
    }
    res.status(200).json({
      success: true,
      data: location
    });
  } catch (err) {
    console.error("Error fetching location by ID:", err);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
        message: 'Invalid location ID format'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: err.message
    });
  }
};

const createLocation = async (req, res) => {
  try {
    const newLocation = await DepartmentLocationModel.create(req.body);
    res.status(201).json({
      success: true,
      data: newLocation
    });
  } catch (err) {
    console.error("Error creating location:", err);
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: messages.join(', ')
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: err.message
    });
  }
};


const updateLocation = async (req, res) => {
  try {
    const updatedLocation = await DepartmentLocationModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!updatedLocation) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Location with id ${req.params.id} not found`
      });
    }
    res.status(200).json({
      success: true,
      data: updatedLocation
    });
  } catch (err) {
    console.error("Error updating location:", err);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
        message: 'Invalid location ID format'
      });
    }
    if (err.name === 'ValidationError') {
      const messages = Object.values(err.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        message: messages.join(', ')
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: err.message
    });
  }
};

const deleteLocation = async (req, res) => {
  try {
    const deletedLocation = await DepartmentLocationModel.findByIdAndDelete(req.params.id);
    if (!deletedLocation) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: `Location with id ${req.params.id} not found`
      });
    }
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error("Error deleting location:", err);
    if (err.kind === 'ObjectId') {
      return res.status(400).json({
        success: false,
        error: 'Invalid ID',
        message: 'Invalid location ID format'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Server Error',
      message: err.message
    });
  }
};

export {getAllLocations,getLocationById,createLocation,updateLocation,deleteLocation}