import React, { useContext } from 'react'
import Login from './pages/Login'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'
import { AdminContext } from './context/AdminContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar'
import { Routes ,Route} from 'react-router-dom';
import Dashboard from './pages/Admin/Dashboard';
import AllApointments from './pages/Admin/AllApointments';
import AddDoctor from './pages/Admin/AddDoctor';
import DoctorList from './pages/Admin/DoctorList';
import EditDoctor from './pages/Admin/EditDoctor';
import DoctorDetails from './pages/Admin/DoctorDetails';
import DoctorAppointment from './pages/Doctor/DoctorAppointment';
import DoctorDashboard from './pages/Doctor/DoctorDashboard';
import DoctorProfile from './pages/Doctor/DoctorProfile';
import AddMedicine from './pages/Admin/AddMedicine';
import MedicineList from './pages/Admin/MedicineList';
import AddStaffPage from './pages/Admin/AddStaffPage';
import StaffDashboard from './pages/staff/StaffDashboard';



const App = () => {
  const {token} = useContext(AdminContext)
  const { dtoken } = useContext(DoctorContext);

  return token ?(
    <div className='bg-[#F8F9FD]'>
      <ToastContainer />
      <Navbar />
      <div className='flex items-start'>
        <Sidebar />
          <Routes>
            <Route path='/' element={<></>} />
            <Route path='/admin-dashbord' element={ < Dashboard />} />
            <Route path='/all-appointments' element={ < AllApointments />} />
            <Route path='/add-doctor' element={ < AddDoctor />} />
            <Route path='/doctor-list' element={ < DoctorList />} />
           <Route path="/edit-doctor/:id" element={<EditDoctor />} />
           <Route path="/doctor-details/:id" element={<DoctorDetails />} />
           <Route path="/medicine-add" element={<AddMedicine />} />
           <Route path="/medicine-list" element={<MedicineList />} />
           
           <Route path="/staf-add" element={<AddStaffPage />} />
            <Route path="/staff-dashboard" element={<StaffDashboard />} />
          </Routes>
      </div>
    </div>
  ) : (
    <>
      <Login />
      <ToastContainer />
    </>
  )
}

export default App
