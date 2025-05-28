import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js' 
import connectCloudinary from './config/cloudinary.js'
import adminRouter from './routes/adminRoute.js';
import doctorRouter from './routes/doctorRoute.js'
import userRoutes from './routes/userRoutes.js';
import router from './routes/medicineRoutes.js'
import staffRouter from './routes/stafRoute.js'
import medicineRoutes from './routes/medicineRoutes.js'
import patientRoute from './routes/patientRoutes.js'
import deprouter from './routes/staffdepartmentRoutes.js'
import Studentrouter from './routes/studentRoute.js'

//app config
const app= express()
const port=process.env.PORT || 4000
connectDB()
connectCloudinary()


//middleware 
app.use(express.json())
app.use(cors())



//api endpoints

app.use('/api/admin', adminRouter);
app.use('/api/doctor',doctorRouter);
app.use('/api/user', userRoutes);
app.use('/api/medicine', adminRouter);
app.use('/api/student', Studentrouter);

app.use('/api/medicine',medicineRoutes)
app.use('/api/staff', staffRouter);

app.use('/api/staff', staffRouter);
app.use('/api/staff/departmentlocations', deprouter);
app.use('/api/patients', patientRoute);

app.get('/',(req,res)=>{
    res.send('api working')

})

app.listen(port, ()=> console.log("server started",port))