import React, { useState, useContext } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Routes, Route, useLocation } from 'react-router-dom';

import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AdminContext } from './context/AdminContext';
import { DoctorContext } from './context/doctorContext';
import { StaffContext } from './context/StaffContext';

// Components
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';

// Pages (⤵ keep your existing imports)
import Login from './pages/Login';
import Dashboard from './pages/Admin/Dashboard';
import AllApointments from './pages/Admin/AllApointments';
import AddDoctor from './pages/Admin/AddDoctor';
import DoctorList from './pages/Admin/DoctorList';
import EditDoctor from './pages/Admin/EditDoctor';
import DoctorDetails from './pages/Admin/DoctorDetails';
import AddMedicine from './pages/Admin/AddMedicine';
import MedicineList from './pages/Admin/MedicineList';
import Purchases from './pages/Admin/PurchasesTable';
import AddStaffPage from './pages/Admin/AddStaffPage';
import StaffListPage from './pages/Admin/StaffListPage';
import AdminPatientList from './pages/Admin/PatientList';
import PatientDetailViews from './pages/Admin/PatientDetailView';
// Doctor pages
import DoctorDashboard from './pages/Doctor/DoctorDashboard';
import DoctorAppointment from './pages/Doctor/DoctorAppointment';
import DoctorProfile from './pages/Doctor/DoctorProfile';
// Staff pages
import StaffDashboard from './pages/staff/StaffDashboard';
import StaffProfile from './pages/staff/StaffProfile';
import EditStaffPage from './pages/staff/EditStaffPage';
import PatientLookup from './pages/staff/PatientLookup';
import NursingWingInfo from './pages/staff/NursingWing';
import StaffScheduleView from './pages/staff/sedulestaf';
import AddPatient from './pages/staff/AddPatient';
import PatientList from './pages/staff/PatientList';
import PatientDetailView from './pages/staff/PatientDetailView';
import EditableContactDisplay from './pages/staff/ContactDisplay';
import ViewStaffIdCardPage from './pages/Admin/ViewStaffIdCardPage';
import StaffHeaderConfig from './pages/staff/StaffHeaderConfig';
import HomePage from './pages/staff/NurseHomePage';
import Calendar from './pages/staff/Calendar';
import DepartmentMap from './pages/staff/DepartmentMap';
import StaffDepartmentLocations from './pages/staff/StaffDepartmentLocations';
import MedicineDetailsPage from './pages/Admin/MedicineDetails';
import AdminUserList from './pages/Admin/AdminUserList';
import CreateStudentForm from './pages/student/CreateStudentForm';
import StudentList from './pages/student/StudentList';
import EditStudentForm from './pages/student/EditStudentForm';

const ThemedAppLayout = () => {
  const { token } = useContext(AdminContext);
  const { dtoken } = useContext(DoctorContext);
  const { staffToken } = useContext(StaffContext);
  const { currentTheme } = useTheme();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);   // 🔑 mobile drawer state

  const isLoggedIn = token || dtoken || staffToken;

  /* ----- show login page if unauthenticated ----- */
  if (!isLoggedIn && location.pathname === '/login') {
    return (
      <>
        <Login />
        <ToastContainer position="top-right" autoClose={3000} />
      </>
    );
  }

  /* ---------- Authenticated layout ---------- */
  if (isLoggedIn) {
    return (
      <div
        className="min-h-screen flex"
        style={{
          backgroundColor: currentTheme.bgColor,
          color: currentTheme.textColor,
          transition: 'background-color 0.3s ease, color 0.3s ease',
        }}
      >
        <ToastContainer position="top-right" autoClose={3000} />

        {/* ---------- DESKTOP SIDEBAR ---------- */}
        <div className="hidden md:block">
          <Sidebar />
        </div>

        {/* ---------- MOBILE SLIDING SIDEBAR ---------- */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 transform bg-white dark:bg-gray-900 border-r shadow-lg transition-transform duration-300 ease-in-out md:hidden ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <Sidebar onLinkClick={() => setSidebarOpen(false)} /> {/* close when link clicked */}
        </div>

        {/* backdrop for mobile drawer */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ---------- MAIN AREA ---------- */}
        <div className="flex flex-col flex-1 min-h-screen pt-20 transition-all duration-300 md:ml-60">
          <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

          <main className="p-4 md:p-6 lg:p-8 overflow-auto">
            {/* ---------- YOUR ROUTES ---------- */}
            <Routes>
              {/* Admin routes */}
              <Route path="/" element={token ? <Dashboard /> : <DoctorDashboard />} />
              <Route path="/admin-dashboard" element={token ? <Dashboard /> : <Login />} />
              <Route path="/all-appointments" element={token ? <AllApointments /> : <Login />} />
              <Route path="/add-doctor" element={token ? <AddDoctor /> : <Login />} />
              <Route path="/doctor-list" element={token ? <DoctorList /> : <Login />} />
              <Route path="/edit-doctor/:id" element={token ? <EditDoctor /> : <Login />} />
              <Route path="/doctor-details/:id" element={token ? <DoctorDetails /> : <Login />} />
              <Route path="/medicine-add" element={token ? <AddMedicine /> : <Login />} />
              <Route path="/medicine-list" element={token ? <MedicineList /> : <Login />} />
              <Route path="/purchases" element={token ? <Purchases /> : <Login />} />

              {/* Doctor routes */}
              <Route path="/doctor-dashboard" element={dtoken ? <DoctorDashboard /> : <Login />} />
              <Route path="/doctor-appointments" element={dtoken ? <DoctorAppointment /> : <Login />} />
              <Route path="/doctor-profile" element={dtoken ? <DoctorProfile /> : <Login />} />

              {/* Staff routes */}
              
               <Route path="/staf-add" element={<AddStaffPage />} />
              <Route path="/staff-list" element={<StaffListPage />} />
              <Route path="/staff-dashboard" element={<StaffDashboard />} />

              <Route path="/profile" element={<StaffProfile />} />
              <Route path="/admin/staff/edit/:id" element={<EditStaffPage />} />
              
              <Route path='/PatientLookup' element={<PatientLookup/>} />
              <Route path='/NursingWing' element={<NursingWingInfo/>} />
              <Route path='/Schedule' element={<StaffScheduleView/>} />
              <Route path='/patient' element={<AddPatient/>} />
              <Route path='/patientList' element={<PatientList/>} />
              <Route path="patient/:patientId" element={<PatientDetailView/>} />
              <Route path='/allPatient' element={<AdminPatientList/>}/>
              <Route path='/patients/:patientId' element={<PatientDetailViews/>}/>
              <Route path='/contact' element={<EditableContactDisplay/>}/>
              <Route path="/admin/staff/:id/id-card" element={<ViewStaffIdCardPage />} />
              <Route path="/edit/header" element={<StaffHeaderConfig/>} />
              <Route path="/Nurse/Home" element={<HomePage/>} />
              <Route path="/Calendar" element={<Calendar/>} />
              <Route path="/DepartmentMap" element={<DepartmentMap/>} />
              <Route path="/Department/Location" element={<StaffDepartmentLocations/>} />
              <Route path="/medicine-details/:id" element={<MedicineDetailsPage />} /> 
              <Route path="/AllUser" element={<AdminUserList />} /> 
              <Route path="/student-add" element={<CreateStudentForm />} /> 
              <Route path="/students" element={<StudentList />} />
              <Route path="/students/edit/:id" element={<EditStudentForm />} />
              {/* Fallback */}
              <Route path="*" element={<div>Page Not Found</div>} />
            </Routes>
          </main>
        </div>
      </div>
    );
  }

  /* ---------- default (not logged in) ---------- */
  return (
    <>
      <Login />
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
};

const App = () => (
  <ThemeProvider>
    <ThemedAppLayout />
  </ThemeProvider>
);

export default App;
