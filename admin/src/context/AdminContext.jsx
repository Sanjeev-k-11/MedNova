import { createContext, useState } from "react";
import axios from 'axios'
import {toast} from 'react-toastify'

export const AdminContext = createContext()

const AdminContextProvider = (props) =>{
    const [token, setToken] = useState(localStorage.getItem('token')?localStorage.getItem('token'):'')
    const [doctors, setDoctors] = useState([])
    const [appointments, setAppointments] = useState([])
    const [dashData, setDashData] = useState(false)
    const [medicines, setMedicines] = useState([]);
    const [purchases, setPurchases] = useState([]);


    const backendUrl= import.meta.env.VITE_BACKEND_URL
    
    const getAllDoctors = async () =>{
        try{
            const { data } = await axios.post(
                backendUrl + '/api/admin/all-doctors',
                {}, 
                {
                  headers: {
                    Authorization: `Bearer ${token}` // Ensure proper token format
                  }
                }
              )
            if(data.success){
                setDoctors(data.doctors) 

            }else{
                toast.error(data.message)
            }
        } catch(error){
            
            toast.error(error.message)

        }
    }

    const changeAvailability = async (docId)=>{
        try{

            const { data } = await axios.post(
                backendUrl + '/api/admin/change-availability',
                { docId }, // Request body
                { headers: { Authorization: `Bearer ${token}` } } // Headers
              );
              
            if(data.success){
                toast.success(data.message)
                getAllDoctors()
            }else{
                toast.error(data.message)
            }

        }catch (error){
            toast.error(error.message) 
        }
    }

    const getAllAppointments = async () => {
        try {
            const { data } = await axios.get(backendUrl + '/api/admin/appointments', {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            if (data.success) {
                setAppointments(data.appointments); 
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Error fetching appointments:", error); // Log the error
            toast.error(error.message);
        }
    };
    

    const cancelAppointment = async (appointmentId) => {
        try {
            const { data } = await axios.post(
                backendUrl + "/api/admin/cancel-appointments",
                { appointmentId },
                {
                    headers: { Authorization: `Bearer ${token}` }, // Fix: headers must be in an object
                }
            );
    
            if (data.success) {
                toast.success(data.message);
                getAllAppointments(); // Refresh the appointment list
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong");
        }
    };
    

    const getDashData = async () => {
        try {
            console.log("Fetching Dashboard Data...");
            const { data } = await axios.get(`${backendUrl}/api/admin/dashboard`, {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            console.log("Dashboard Response:", data);
    
            if (data.success) {
                setDashData(data.dashData);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Error fetching dashboard:", error);
            toast.error(error.response?.data?.message || "Failed to fetch dashboard data.");
        }
    };
    

    const deleteDoctor = async (doctorId) => {
        try { 
    
            const response = await fetch(`${backendUrl}/api/admin/delete-doctor/${doctorId}`, { 
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
    
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Server response:", errorText); // Log the actual error
                throw new Error(errorText || "Failed to delete doctor");
            }
    
            setDoctors((prev) => prev.filter((doc) => doc._id !== doctorId));
            toast.success("Doctor deleted successfully!");
        } catch (error) {
            console.error("Error deleting doctor:", error);
            toast.error(error.message);
        }
    };
    

    const addMedicine = async (medicineData) => {
        try {
            const formData = new FormData();
            formData.append("image", medicineData.image);
            formData.append("name", medicineData.name);
            formData.append("manufacturer", medicineData.manufacturer);
            formData.append("originalPrice", Number(medicineData.originalPrice)); 
            formData.append("discountedPrice", Number(medicineData.discountedPrice));
            formData.append("stock", Number(medicineData.stock));
            formData.append("expiryDate", medicineData.expiryDate);
            formData.append("description", medicineData.description);
    
            // Debugging formData
            for (let [key, value] of formData.entries()) {
                console.log(`${key}:`, value);
            }
    
            const { data } = await axios.post(
                `${backendUrl}/api/admin/add-medicine`,
                formData,
                { headers: { Authorization: `Bearer ${token}` } }
            );
    
            if (data.success) {
                toast.success(data.message);
                setMedicines((prev) => [...prev, data.newMedicine]);
                getAllMedicines(); // Refresh after adding
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Error adding medicine:", error.response?.data);
            toast.error("Failed to add medicine.");
        }
    };
    

    // ======================= Get All Medicines ========================
    const getAllMedicines = async (buyMedicineId = null) => {
        const token = localStorage.getItem("token");
        if (!token) return toast.error("No token found. Please log in.");
    
        try {
            // If a medicine is bought, pass the medicine ID
            const url = buyMedicineId
                ? `${backendUrl}/api/admin/get-all-medicines?buyMedicineId=${buyMedicineId}`
                : `${backendUrl}/api/admin/get-all-medicines`;
    
            const { data } = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            if (data.success) {
                setMedicines(data.medicines);
                if (buyMedicineId) {
                    toast.success("Medicine bought successfully!");
                }
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error(error);
            toast.error("Failed to fetch medicines.");
        }
    };
    

    // =================== Delete Medicine ===================
    const deleteMedicine = async (medicineId) => {
        const token = localStorage.getItem("token");
        if (!token) return toast.error("No token found. Please log in.");
    
        if (window.confirm("Are you sure you want to delete this medicine?")) {
            try {
    
                const response = await fetch(`${backendUrl}/api/admin/delete-medicine/${medicineId}`, { 
                    method: "DELETE",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
    
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("⚠️ Server response:", errorText); // Log the actual error
                    throw new Error(errorText || "Failed to delete medicine.");
                }
    
                // Update state after successful deletion
                setMedicines((prev) => prev.filter((med) => med._id !== medicineId));
                toast.success("Medicine deleted successfully!");
            } catch (error) {
                console.error("❌ Error deleting medicine:", error);
                toast.error(error.message);
            }
        }
    };
    


    const checkStock = async (medicineId) => {
        const token = localStorage.getItem("token");
        if (!token) return toast.error("No token found. Please log in.");
    
        try {
            const response = await fetch(`${backendUrl}/api/admin/check-stock/${medicineId}`, {
                method: "GET",
                headers: { Authorization: `Bearer ${token}` },
            });
    
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(data.message || "Failed to check stock status.");
            }
    
            // Show Stock Status
            if (data.inStock) {
                toast.success(`✅ ${data.message} (Quantity: ${data.quantity})`);
            } else {
                toast.info(` ${data.message}`);
            }
        } catch (error) {
            console.error("Error checking stock:", error);
            toast.error(error.message);
        }
    };
    
    const getAllPurchases = async () => {
        try {
            
            console.log("Fetching purchases...");
            const { data } = await axios.get(`${backendUrl}/api/admin/purchases`, {
                headers: { Authorization: `Bearer ${token}` },
            });
    
            console.log("API Response:", data); // ✅ Debugging API response
    
            if (data.success) {
                setPurchases(data.purchases);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error("Error fetching purchases:", error);
            toast.error(error.response?.data?.message || "Failed to fetch purchases.");
        }
    };
    
    
    

    const value = {
        token, setToken,backendUrl,doctors,getAllDoctors,changeAvailability,appointments,setAppointments,getAllAppointments,cancelAppointment,
        dashData,getDashData , deleteDoctor,getAllMedicines,addMedicine,deleteMedicine,  checkStock ,getAllPurchases,purchases,medicines
    }
    return (
        <AdminContext.Provider value={value}>
            {props.children}
        </AdminContext.Provider>
    )

}

export default AdminContextProvider