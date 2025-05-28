import { useState } from "react";
import { createContext } from "react";
import axios from 'axios'
import { toast } from 'react-toastify';

export const DoctorContext = createContext()

const DoctorContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL

    const [dtoken, setDtoken] = useState(localStorage.getItem('dtoken') ? localStorage.getItem('dtoken') : '')
    const [appointments, setAppointments] = useState([])

    const [dashData, setDashData] = useState(false)
    const [profileData, setProfileData] = useState(false)

    const getAppointments = async () => {

        try {

            const { data } = await axios.get(backendUrl + '/api/doctor/appointments', { headers: { Authorization: `Bearer ${dtoken}` } })

            if (data.success) {
                setAppointments(data.appointments.reverse())
                console.log(data.appointments.reverse())
            } else {
                toast.error(data.message)
            }


        } catch (error) {
            console.log(error)
            toast.error(error.message)

        }
    }



    const completeAppointment = async (appointmentId) => {

        try {
            const { data } = await axios.post(
                backendUrl + "/api/doctor/complete-appointment",
                { appointmentId },
                { headers: { Authorization: `Bearer ${dtoken}` } }
            );

            if (data?.success) {
                toast.success("Appointment has been success"); // ✅ Show success only if truly successful
                getAppointments();
            } else {
                toast.error(data?.message || "Could not complete the appointment.");
            }
        } catch (error) {
            console.error("complete Appointment Error:", error);
            if (error.response?.data?.message) {
                toast.error(error.response.data.message); // ✅ Show specific backend error
            } else {
                toast.error("Failed to complete the appointment."); // ❌ Generic error only if no response
            }
        }
    };






    const cancelAppointment = async (appointmentId) => {
        try {
            const { data } = await axios.post(
                backendUrl + "/api/doctor/cancel-appointment",
                { appointmentId },
                { headers: { Authorization: `Bearer ${dtoken}` } }
            );

            if (data?.success) {
                toast.success("Appointment has been canceled!"); // ✅ Show success only if truly successful
                getAppointments();
            } else {
                toast.error(data?.message || "Could not cancel the appointment.");
            }
        } catch (error) {
            console.error("Cancel Appointment Error:", error);
            if (error.response?.data?.message) {
                toast.error(error.response.data.message); // ✅ Show specific backend error
            } else {
                toast.error("Failed to cancel the appointment."); // ❌ Generic error only if no response
            }
        }
    };


    const getDashData = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/doctor/doctor-dashbord', {
                headers: {
                    Authorization: `Bearer ${dtoken}`, // Correct header format
                }
            });
    
            if (data.success) {
                setDashData(data.dashData);
                console.log(data.dashData);
            } else {
                toast.error(data.message);
            }
    
        } catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    };



    const getProfileData = async()=>{
        try{
            const { data } = await axios.get(backendUrl + '/api/doctor/profile',{headers: {
                Authorization: `Bearer ${dtoken}`,}})


            if(data.success){
                setProfileData(data.profileData)
                console.log(data.profileData)
            }


        }catch (error) {
            console.log(error);
            toast.error(error.message);
        }
    }


    const value = {
        dtoken, setDtoken, backendUrl, appointments, setAppointments, getAppointments, completeAppointment, cancelAppointment,
        dashData,setDashData,getDashData, profileData , getProfileData, setProfileData

    }
    return (
        <DoctorContext.Provider value={value}>
            {props.children}
        </DoctorContext.Provider>
    )

}

export default DoctorContextProvider