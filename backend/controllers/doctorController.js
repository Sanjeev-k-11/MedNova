import doctorModel from "../models/doctorModel.js";
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import appointmentModel from "../models/appointmentModel.js";

const changeAvailability = async (req, res) => {
    try {
        const { docId } = req.body;

        // Fetch doctor data
        const docData = await doctorModel.findById(docId);
        if (!docData) {
            return res.json({ success: false, message: "Doctor not found" });
        }

        // Toggle availability
        await doctorModel.findByIdAndUpdate(docId, { available: !docData.available });

        res.json({ success: true, message: "Doctor availability updated successfully!" });

    } catch (error) {
        console.error(error); // Logs the error in the backend console
        res.status(500).json({ success: false, message: error.message }); // Proper error response
    }
}

const doctorList = async (req,res) =>{
    try{

        const doctors = await doctorModel.find({}).select(['-password','-email'])

        res.json({success:true,doctors})

    }catch(error){
        console.error(error); // Logs the error in the backend console
        res.status(500).json({ success: false, message: error.message }); 

    }
}

// api for login doctor

const loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if doctor exists
        const doctor = await doctorModel.findOne({ email });
        if (!doctor) {
            return res.json({ success: false, message: "Doctor not found" });
        }

        // Compare hashed password
        const isMatch = await bcrypt.compare(password, doctor.password);
        if (!isMatch) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        // Generate JWT Token
        const token = jwt.sign({ id: doctor._id}, process.env.JWT_SECRET, { expiresIn: "7d" });

        // Send response with token and doctor details
        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            doctor: {
                id: doctor._id,
                name: doctor.name,
                email: doctor.email,
                speciality: doctor.speciality,
                available: doctor.available
            }
        });

    } catch (error) {
        console.error("Error in loginDoctor:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

//api to get doctor appointments for doctor panel

const appointmentsDoctor = async(req, res) =>{

    try{

        const { docId } =req.body
        if (!docId) {
            return res.status(400).json({ success: false, message: "Doctor ID is required" });
        }

        // Fetch appointments for the given doctor ID
        const appointments = await appointmentModel.find({docId })
        res.status(200).json({ success: true, appointments });

    }catch(error){
        console.error(error);
        res.json({ success: false, message:error.message });
   

    }
}


//api to mark the appointment completed
const appointmentComplete = async(req,res) =>{

    try{

        const {docId, appointmentId} = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)

        if(appointmentData && appointmentData.docId === docId){

            await appointmentModel.findByIdAndUpdate(appointmentId,{isCompleted: true})
            return res.json({success:true,message:'Appointment Completed'})

        }else{
            return res.json({success:false,message:'Mark Failed'})
        }


    }catch(errror){
        console.error(error.message);
        res.json({ success: false, message:error.message });
   


    }
}


// api appoointmentcanceled for doctor pannel
const appointmentCancel= async(req,res) =>{

    try{

        const {docId, appointmentId} = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)

        if(appointmentData && appointmentData.docId === docId){

            await appointmentModel.findByIdAndUpdate(appointmentId,{cancelled: true})
            return res.json({success:true,message:'Appointment Completed'})

        }else{
            return res.json({success:false,message:'cancellation Failed'})
        }


    }catch(errror){
        console.error(error.message);
        res.json({ success: false, message:error.message });
   


    }
}


//api to get dashboard data for doctor panel

const doctorDashboard = async (req, res) =>{

    try{
        const {docId} = req.body

        const doctor = await doctorModel.findById(docId);
        if (!doctor) {
            return res.status(404).json({ success: false, message: "Doctor not found." });
        }

        const appointments = await appointmentModel.find({docId})

        let earnings = 0

        appointments.map((item)=>{
            if(item.isCompleted || item.payment){
                earnings += item.amount

            }
        })

        let patients =[]

        appointments.map((item)=>{
            if(!patients.includes(item.userId)){
                patients.push(item.userId)
            }
        })

        const dashData = {
            salary: doctor.salary,
            earnings, appointments:appointments.length,
            patients:patients.length,
            latestAppointmnets: appointments.reverse().slice(0,5)
        }
        res.status(200).json({ success: true, dashData });

    }catch(error){
        console.error(error.message);
        res.json({ success: false, message:error.message });
   
    }
}


//api to get doctor profile for doctor panel

const doctorProfile = async (req,res) =>{
    try{
        const { docId } =req.body

        const profileData = await doctorModel.findById(docId).select('-password')
        res.json({success:true,profileData})


    }catch(error){
        console.error(error.message);
        res.json({ success: false, message:error.message });
   
    

    }
}



//api to get doctor profile for doctor panel

const updatedoctorProfile = async (req,res) =>{
    try{
        
        const {docId , fees,address,available}= req.body

        await doctorModel.findByIdAndUpdate(docId,{fees, address, available})

        res.json({success:true,message:"Profile Update"})


    }catch{
        console.error(error.message);
        res.json({ success: false, message:error.message });
   
    

    }
}


const changePassword = async (req, res) => {
    const { docId } =req.body

    if (!docId) {
        return res.status(401).json({ success: false, message: 'Authentication required. Unable to identify user.' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: 'Please provide both your current password and a new password.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ success: false, message: 'New password must be at least 6 characters long.' });
    }

    if (currentPassword === newPassword) {
        return res.status(400).json({ success: false, message: 'New password cannot be the same as the current password.' });
    }

    try {
        const doctorMember = await doctorModel.findById(docId).select('+password');

        if (!doctorMember) {
            return res.status(404).json({ success: false, message: 'doctor member account not found.' });
        }

        const isMatch = await doctorMember.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Incorrect current password.' });
        }

        doctorMember.password = newPassword;
        await doctorMember.save();

        res.status(200).json({ success: true, message: 'Password changed successfully.' });

    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, message: `Validation Error: ${messages.join('. ')}` });
        }

        res.status(500).json({
            success: false,
            message: process.env.NODE_ENV === 'production' ? 'Server error changing password.' : `Server Error: ${error.message}`
        });
    }
};



export { changeAvailability,doctorList,
     loginDoctor ,appointmentsDoctor,
     appointmentCancel, appointmentComplete ,
     doctorDashboard , doctorProfile ,
      updatedoctorProfile , changePassword};
