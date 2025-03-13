import React from 'react'
import { assets } from '../assets/assets'
import { useNavigate } from "react-router-dom"


const Footer = () => {
  const navigate = useNavigate(); 
  return (
    <div className='md:mx-10' >
      <div className='flex flex-col sm:grid grid-cols-[3fr_1fr_1fr] gap-14 my-10 mt-40 text-sm'>
        {/*........Left section */}
        <div>
          <img className='mb-5 w-40' src={assets.logo} alt='' />
          <p className="w-full md:w-2/3 text-gray-600 leading-6">
          Your Health, Our Priority! Find trusted doctors, book appointments seamlessly,
           and take charge of your well-being with ease. Secure, hassle-free, and tailored to your
            needs—healthcare at your fingertips. Because you deserve the best care, anytime, anywhere. 
            Book now and stay healthy with [  MEDNOVA  ] !"
          </p>
        </div>
        {/*..........center section................. */}
        <div>
            <p className='text-xl font-medium mb-5'>Company</p>
            <ul className='flex flex-col gap-2 text-gray-600'>
              <li><a onClick={() => { navigate("/"); window.scrollTo(0, 0);  }} className="hover:underline cursor-pointer">Home</a></li>
              <li><a onClick={() => { navigate("/about"); window.scrollTo(0, 0);  }}className="hover:underline cursor-pointer">About us</a></li>
              <li><a onClick={() => { navigate("/contact"); window.scrollTo(0, 0);}} className="hover:underline cursor-pointer">Contact us</a></li>
              <li><a onClick={() => { navigate("/privacy"); window.scrollTo(0, 0);}} className="hover:underline cursor-pointer">Privacy policy</a></li>
          </ul>
        </div>
        {/*..........right section................. */}
        <div>
        <p className="text-lg font-semibold">Get in Touch</p>
        <ul className='flex flex-col gap-2 text-gray-600'>
          <li>+111111111111</li>
          <li>sy781405@gmail.com</li>
        </ul>
        </div>
      </div>
      <div>
        {/*.....................copy right Text */}
        <hr />
        <p className='py-5 text-sm text-center'>© 2024 Prescripto - All Rights Reserved.</p>
      </div>
    </div>
  )
}

export default Footer
