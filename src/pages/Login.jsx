import React, { useState } from 'react';

const Login = () => {
  const [state, setState] = useState('Sign Up');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const onSubmitHandler = async (event) => {
    event.preventDefault();
  };

  return (
    <form className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="bg-white p-6 md:p-8 rounded-lg shadow-md w-full max-w-md">
        <p className="text-2xl font-semibold text-center mb-2">
          {state === 'Sign Up' ? 'Create Account' : 'Login'}
        </p>
        <p className="text-center text-gray-600 mb-6">
          Please {state === 'Sign Up' ? 'Sign Up' : 'Login'} to book an appointment
        </p>
        {
          state === "Sign Up" && <div className="mb-4 w-full">
          <p className="text-gray-700 font-medium">Full Name</p>
          <input
            type="text"
            onChange={(e) => setName(e.target.value)}
            value={name}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>
        }

        

        <div className="mb-4 w-full">
          <p className="text-gray-700 font-medium">Email</p>
          <input
            type="email"
            onChange={(e) => setEmail(e.target.value)}
            value={email}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div className="mb-6 w-full">
          <p className="text-gray-700 font-medium">Password</p>
          <input
            type="password"
            onChange={(e) => setPassword(e.target.value)}
            value={password}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-md font-semibold hover:bg-blue-600 transition"
        >
          {state === 'Sign Up' ? 'Create Account' : 'Login'}
        </button>
        {
          state==="Sign Up" ?
          <p className='mt-2'>Alredy have an account? <span onClick={()=>setState('Login')} className='text-primary underline cursor-pointer'>  Login here</span></p>
          :<p className='mt-2'>Create an new account? <span onClick={()=>setState('Sign Up')} className='text-primary underline cursor-pointer'>  click here</span></p>
        }
      </div>
    </form>
  );
};

export default Login;
