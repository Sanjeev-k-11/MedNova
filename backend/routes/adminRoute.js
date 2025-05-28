import express from 'express'
import  {addDoctor, allDoctors, appointmentCancelByAdmin, appointmentsAdmin, loginAdmin , adminDashboard, deleteDoctor, deleteMedicine, addMedicine, getAllMedicines, checkStockStatus, getMedicineById, updateMedicine, getAllUsers, handleBlockUser, handleDeleteUser,  } from '../controllers/adminController.js'
import  upload from '../middlewares/multer.js'
import authAdmin from '../middlewares/authAdmin.js'
import { changeAvailability } from '../controllers/doctorController.js'
import { adminCancelEntirePurchase,   confirmOrder, deletePurchase, getAllPurchases } from '../controllers/medicineController.js'
import authUser from '../middlewares/authUser.js'
import authMedicine from '../middlewares/authMedicine.js'
import authStaff from '../middlewares/authStaff.js'




const adminRouter =express.Router()

// adminRouter.post('/add-doctor',upload.single('image'),addDoctor)
adminRouter.post('/add-doctor', authAdmin, upload.single('image'), addDoctor);
adminRouter.post('/login',loginAdmin)
adminRouter.post('/all-doctors',allDoctors)
adminRouter.post('/change-availability',authAdmin,changeAvailability)
adminRouter.get('/appointments',authAdmin,appointmentsAdmin)
adminRouter.post('/cancel-appointments',authAdmin,appointmentCancelByAdmin)
adminRouter.get('/dashboard',authAdmin,adminDashboard)
adminRouter.delete('/delete-doctor/:id', authAdmin, deleteDoctor);

adminRouter.post('/add-medicine', upload.single('image'), addMedicine);
adminRouter.get('/get-all-medicines', authAdmin, getAllMedicines); 
adminRouter.delete('/delete-medicine/:id',authAdmin, deleteMedicine);
adminRouter.get('/check-stock/:id',authAdmin, checkStockStatus);
adminRouter.get('/list',getAllMedicines)
adminRouter.get('/get-medicine/:id',getMedicineById);
adminRouter.patch('/update-medicine/:id',upload.single('image'),updateMedicine)
adminRouter.get('/purchases',authAdmin,getAllPurchases)
adminRouter.patch('/purchases/:purchaseId/confirm',  authAdmin, confirmOrder);
adminRouter.delete('/purchases/:purchaseId',authUser, authAdmin, deletePurchase);
adminRouter.post('/cancel-order/:purchaseId',authAdmin,adminCancelEntirePurchase)

adminRouter.get('/users', getAllUsers);
adminRouter.patch('/users/:id/block',authAdmin, handleBlockUser);
adminRouter.delete('/users/:id/delete', authAdmin,handleDeleteUser);

// adminRouter.get('/delete-medicine/:id',authAdmin, deleteMedicine);
export default adminRouter