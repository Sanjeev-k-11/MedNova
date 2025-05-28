import React, { useContext, useState } from "react";
import { assets } from "../../assets/assets";
import { AdminContext } from "../../context/AdminContext";
import { toast } from "react-toastify"
import axios from 'axios'

const AddDoctor = () => {

  const [docImg, setDocImg] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [experience, setExperience] = useState('1 Year')
  const [fees, setFees] = useState('')
  const [salary, setSalary] = useState('') // Added state for salary
  const [phone, setPhone ] = useState('')
  const [about, setAbout] = useState('')
  const [speciality, setSpeciality] = useState('General Physician')
  const [degree, setDegree] = useState('')
  const [address1, setAddress1] = useState('')
  const [address2, setAddress2] = useState('')

  const { backendUrl, token } = useContext(AdminContext)

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (!docImg) {
      return toast.error("Doctor image is required!");
    }

    if (!salary) {
      return toast.error("Salary is required!");
    }

    const formData = new FormData();
    formData.append('image', docImg);
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    formData.append("experience", experience);
    formData.append("fees", Number(fees));
    formData.append("phone", Number(phone));
    formData.append("salary", Number(salary)); // Appending salary to formData
    formData.append("about", about);
    formData.append("speciality", speciality);
    formData.append("degree", degree);
    formData.append("address", JSON.stringify({ line1: address1, line2: address2 }));

    console.log("FormData:", formData); // Log the FormData object

    try {
      const { data } = await axios.post(
        backendUrl + '/api/admin/add-doctor',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        setDocImg(false);
        setName('');
        setPassword('');
        setEmail('');
        setAddress1('');
        setAddress2('');
        setDegree('');
        setFees('');
        setPhone('');
        setSalary('');  // Reset salary state
        setAbout('');
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Something went wrong!");
      console.error("Error:", error);
    }
  };

  return (
    <div className="bg-gradient-to-r w-full   min-h-screen flex items-center justify-center">
      <form className="max-w-4xl m-6 mx-auto bg-white shadow-lg rounded-lg p-6 md:p-10" onSubmit={onSubmitHandler}>
        {/* Heading */}
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Add Doctor</h2>

        {/* Upload Section */}
        <div className="flex flex-col items-center gap-3 mb-6">
          <label htmlFor="doc-img" className="cursor-pointer">
            <img
              src={docImg ? URL.createObjectURL(docImg) : assets.upload_area}
              alt="Upload"
              className="w-28 h-28 border-2 border-dashed border-gray-400 rounded-full p-2"
            />
          </label>
          <input onChange={(e) => setDocImg(e.target.files[0])} type="file" id="doc-img" hidden />
          <p className="text-gray-600 text-sm text-center">Upload Doctor Picture</p>
        </div>

        {/* Form Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Section */}
          <div className="space-y-4">
            <div>
              <label className="text-gray-700 font-medium">Doctor Name</label>
              <input onChange={(e) => setName(e.target.value)} value={name} name="" id=""
                type="text"
                placeholder="Enter Name"
                required
                className="w-full border p-3 rounded-md focus:ring focus:ring-blue-300"
              />
            </div>

            <div>
              <label className="text-gray-700 font-medium">Doctor Email</label>
              <input onChange={(e) => setEmail(e.target.value)} value={email} name="" id=""
                type="email"
                placeholder="Enter Email"
                required
                className="w-full border p-3 rounded-md focus:ring focus:ring-blue-300"
              />
            </div>

            <div>
              <label className="text-gray-700 font-medium">Doctor Password</label>
              <input onChange={(e) => setPassword(e.target.value)} value={password} name="" id=""
                type="password"
                placeholder="Enter Password"
                required
                className="w-full border p-3 rounded-md focus:ring focus:ring-blue-300"
                autoComplete="current-password"
              />
            </div>

            <div>
              <label className="text-gray-700 font-medium">Experience</label>
              <select onChange={(e) => setExperience(e.target.value)} value={experience} className="w-full border p-3 rounded-md focus:ring focus:ring-blue-300" name="" id="">
                <option value="1 Year">1 Year</option>
                <option value="2 Year">2 Year</option>
                <option value="3 Year">3 Year</option>
                <option value="4 Year">4 Year</option>
                <option value="5 Year">5 Year</option>
                <option value="6 Year">6 Year</option>
                <option value="7 Year" >7 Year</option>
                <option value="8 Year">8 Year</option>
                <option value="9 Year">9 Year</option>
                <option value="10 Year">10 Year</option>
                <option value="11 Year">11 Year</option>
                <option value="12 Year">12 Year</option>
              </select>
            </div>

            <div>
              <label className="text-gray-700 font-medium">Fees</label>
              <input onChange={(e) => setFees(e.target.value)} value={fees} name="" id=""
                type="number"
                placeholder="Enter Fees"
                required
                className="w-full border p-3 rounded-md focus:ring focus:ring-blue-300"
              />
            </div>

            

            <div>
              <label className="text-gray-700 font-medium">Salary</label> {/* New salary input */}
              <input
                onChange={(e) => setSalary(e.target.value)}
                value={salary}
                type="number"
                placeholder="Enter Salary"
                required
                className="w-full border p-3 rounded-md focus:ring focus:ring-blue-300"
              />
            </div>
          </div>

          {/* Right Section */}
          <div className="space-y-4">
            <div>
              <label className="text-gray-700 font-medium" name="" id="">Speciality</label>
              <select onChange={(e) => setSpeciality(e.target.value)} value={speciality} className="w-full border p-3 rounded-md focus:ring focus:ring-blue-300" id="speciality">
                <option value="General Physician">General Physician</option>
                <option value="Gynecologist">Gynecologist</option>
                <option value="Dermatologist">Dermatologist</option>
                <option value="Pediatrician">Pediatrician</option>
                <option value="Neurologist">Neurologist</option>
                <option value="Gastroenterologist">Gastroenterologist</option>

              </select>
            </div>

            <div>
              <label className="text-gray-700 font-medium">Education</label>
              <input onChange={(e) => setDegree(e.target.value)} value={degree} name="" id=""
                type="text"
                placeholder="Enter Education"
                required
                className="w-full border p-3 rounded-md focus:ring focus:ring-blue-300"
              />
            </div>

            <div>
              <label className="text-gray-700 font-medium">Address</label>
              <input onChange={(e) => setAddress1(e.target.value)} value={address1} name="" id=""
                type="text"
                placeholder="Address Line 1"
                required
                className="w-full border p-3 rounded-md mb-3 focus:ring focus:ring-blue-300"
              />
              <input onChange={(e) => setAddress2(e.target.value)} value={address2} name="" id=""
                type="text"
                placeholder="Address Line 2"
                required
                className="w-full border p-3 rounded-md focus:ring focus:ring-blue-300"
              />
            </div>
            <div>
              <label className="text-gray-700 font-medium">Phone</label>
              <input onChange={(e) => setPhone(e.target.value)} value={phone} name="" id=""
                type="number"
                placeholder="Phone"
                required
                className="w-full border p-3 rounded-md focus:ring focus:ring-blue-300"
              />
            </div>

            <div>
              <label className="text-gray-700 font-medium">About Doctor</label>
              <textarea onChange={(e) => setAbout(e.target.value)} value={about} name="" id=""
                placeholder="Write about the doctor..."
                rows={4}
                required
                className="w-full border p-3 rounded-md focus:ring focus:ring-blue-300"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button type="submit" className="mt-6 w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition duration-300">
          Add Doctor
        </button>
      </form>
    </div>
  );

};

export default AddDoctor;