import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const doctorSchema = new mongoose.Schema({
    name: {type:String , required:true},
    email: {type:String , required:true, unique:true},
    password: {type:String , required:true},
    image: {type:String , required:true},
    speciality: {type:String , required:true},
    degree: {type:String , required:true},
    experience: {type:String , required:true},
    about: {type:String , required:true},
    available: {type:Boolean , default:true},
    availability: {
        type: Map, // Key: Date, Value: Boolean (true = available, false = unavailable)
        of: Boolean, 
        default: {} // Empty initially, updated over time
    },
    fees: {type:Number , required:true},
    salary: { type: Number, required: true },
    phone:{ type: String, required:true },
    address: { 
        type: Object, 
        required: true,
        default: { line1: "", line2: "" }
    },
    date: {type:Number , required:true},
    slots_booked: {type:Object , required:true, default:{}}
},{minimize:false})



doctorSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

doctorSchema.methods.comparePassword = async function (enteredPassword) {
    if (!this.password) throw new Error('Password field not selected on document.');
    return await bcrypt.compare(enteredPassword, this.password);
};


const doctorModel = mongoose.models.doctor || mongoose.model('doctor',doctorSchema)

export default doctorModel
