import React  from "react";
import {Route, Routes} from 'react-router-dom'
import Home from "./pages/Home";
import Doctor from "./pages/Doctor";
import Login from "./pages/Login";
import About from "./pages/About";
import Contact from "./pages/Contact";
import MyProfile from "./pages/MyProfile";
import MyAppointments from "./pages/MyAppointments";
import Appointment from "./pages/Appointment";
import Nevbar from "./component/Nevbar";
import Footer from "./component/Footer";
import PrivacyPolicy from "./pages/PrivacyPolicy";


const App = () =>{
  return(
    <div className='mx-4 sm:mx-[10%]'>
      <Nevbar />
      <Routes>
        <Route  path='/' element={<Home />} />
        <Route  path='/doctor' element={<Doctor />} />
        <Route  path='/doctor/:speciality' element={<Doctor />} />
        <Route  path='/login' element={<Login />} />
        <Route  path='/about' element={<About />} />
        <Route  path='/contact' element={<Contact />} />
        <Route  path='/my-profile' element={<MyProfile />} />
        <Route  path='/my-appointments' element={<MyAppointments />} />
        <Route  path='/appointment/:docId' element={<Appointment />} />
        <Route  path='/privacy' element={<PrivacyPolicy />} />
        
      </Routes>
      <Footer />
    </div>
  )
}
export default App;