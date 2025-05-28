import React, { useContext, useState } from "react";
import { assets } from "../../assets/assets"; // Ensure this path is correct
import { AdminContext } from "../../context/AdminContext";
import { toast } from "react-toastify";
import axios from "axios";

const AddMedicine = () => {
  const [medImg, setMedImg] = useState(null);
  const [name, setName] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [description, setDescription] = useState("");

  const { backendUrl, token } = useContext(AdminContext);

  if (!backendUrl || !token) {
    console.error("AdminContext is not providing backendUrl or token");
    return <h2 className="text-red-500 text-center">Context not loaded.</h2>;
  }

  const onSubmitHandler = async (event) => {
    event.preventDefault();

    if (!medImg) return toast.error("Medicine image is required!");
    if (!name || !originalPrice || !price || !quantity || !expiryDate || !manufacturer) {
      return toast.error("Please fill in all required fields!");
    }

    const formData = new FormData();
    formData.append("image", medImg);
    formData.append("name", name);
    formData.append("originalPrice", Number(originalPrice));
    formData.append("discountedPrice", Number(price)); // Only send the discounted price
    formData.append("quantity", Number(quantity));
    formData.append("expiryDate", expiryDate);
    formData.append("manufacturer", manufacturer);
    formData.append("description", description);

    try {
      const { data } = await axios.post(
        backendUrl + '/api/admin/add-medicine',
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success(data.message);
        setMedImg(null);
        setName("");
        setOriginalPrice("");
        setPrice("");
        setQuantity("");
        setExpiryDate("");
        setManufacturer("");
        setDescription("");
      } else {
        toast.error(data.message || "Failed to add medicine!");
      }
    } catch (error) {
      console.error("Error adding medicine:", error.response || error);
      toast.error(error.response?.data?.message || "Something went wrong!");
    }
  };

  return (
    <div className="bg-gradient-to-r w-full  min-h-screen flex items-center justify-center">
      <form
        className="max-w-4xl m-6 mx-auto bg-white shadow-lg rounded-lg p-6 md:p-10"
        onSubmit={onSubmitHandler}
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Add Medicine
        </h2>

        <div className="flex flex-col items-center gap-3 mb-6">
          <label htmlFor="med-img" className="cursor-pointer">
            <img
              src={
                medImg
                  ? URL.createObjectURL(medImg)
                  : assets?.upload_area || "https://via.placeholder.com/150"
              }
              alt="Upload"
              className="w-28 h-28 border-2 border-dashed border-gray-400 rounded-full p-2 object-cover"
            />
          </label>
          <input
            onChange={(e) => setMedImg(e.target.files[0])}
            type="file"
            id="med-img"
            accept="image/*"
            hidden
          />
          <p className="text-gray-600 text-sm text-center">
            Upload Medicine Image
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-gray-700 font-medium">Medicine Name</label>
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                type="text"
                placeholder="Enter Medicine Name"
                className="w-full border p-3 rounded-md focus:ring focus:ring-blue-300"
              />
            </div>

            <div>
              <label className="text-gray-700 font-medium">Original Price</label>
              <input
                onChange={(e) => setOriginalPrice(e.target.value)}
                value={originalPrice}
                type="number"
                min="0"
                placeholder="Enter Original Price"
                className="w-full border p-3 rounded-md focus:ring focus:ring-blue-300"
              />
            </div>

            <div>
              <label className="text-gray-700 font-medium">Discounted Price</label>
              <input
                onChange={(e) => setPrice(e.target.value)}
                value={price}
                type="number"
                min="0"
                placeholder="Enter Discounted Price"
                className="w-full border p-3 rounded-md focus:ring focus:ring-blue-300"
              />
            </div>

            <div>
              <label className="text-gray-700 font-medium">Quantity</label>
              <input
                onChange={(e) => setQuantity(e.target.value)}
                value={quantity}
                type="number"
                min="1"
                placeholder="Enter Quantity"
                className="w-full border p-3 rounded-md focus:ring focus:ring-blue-300"
              />
            </div>

            <div>
              <label className="text-gray-700 font-medium">Expiry Date</label>
              <input
                onChange={(e) => setExpiryDate(e.target.value)}
                value={expiryDate}
                type="date"
                className="w-full border p-3 rounded-md focus:ring focus:ring-blue-300"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-gray-700 font-medium">Manufacturer</label>
              <input
                onChange={(e) => setManufacturer(e.target.value)}
                value={manufacturer}
                type="text"
                placeholder="Enter Manufacturer"
                className="w-full border p-3 rounded-md focus:ring focus:ring-blue-300"
              />
            </div>

            <div>
              <label className="text-gray-700 font-medium">Description</label>
              <textarea
                onChange={(e) => setDescription(e.target.value)}
                value={description}
                placeholder="Write a brief description..."
                rows={5}
                className="w-full border p-3 rounded-md focus:ring focus:ring-blue-300"
              ></textarea>
            </div>
          </div>
        </div>

        {/* Display Price with Strikethrough */}
        {originalPrice && price && (
          <p className="text-lg font-semibold mt-4 text-gray-700 text-center">
            <del className="text-red-500 mr-2">${originalPrice}</del>
            <span className="text-green-600">${price}</span>
          </p>
        )}

        <button
          type="submit"
          className="mt-6 w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition duration-300"
        >
          Add Medicine
        </button>
      </form>
    </div>
  );
};

export default AddMedicine;
