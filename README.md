# MEDNOVA Healthcare Platform

---

## 🚀 Project Overview

**MEDNOVA** is a comprehensive healthcare platform designed to streamline medical practice management. It covers patient appointments, doctor profiles, medicine management, user profiles, and administrative workflows. The system is split into three core components:

- **Backend API** — Handles all business logic, database interaction, authentication, and file management.
- **User Frontend** — Intuitive interface for patients to book appointments, browse medicines, and manage profiles.
- **Admin Dashboard** — Powerful tools for admins, doctors, and staff to manage users, departments, medicines, and analytics.

---

## ✨ Features

### User Frontend
- Secure User Authentication ( login)
- Appointment Booking & Management
- Doctor Profiles & Smart Doctor Search
- Medicine Browsing & Search
- Profile Management & History (Appointments & Medicine Purchases)
- Manage Relative’s Appointments
- Contact Form for Support
- AI Chat Assistant for help and queries
- Informative Privacy Policy & About pages

### Admin Dashboard
- User Role Management (Admin, Doctor, Staff)
- Doctor & Staff Profile Management
- Department Management
- Medicine Inventory Management
- Viewing Key Statistics & Analytics
- Admin Messaging System

### Backend API
- RESTful API endpoints powering all frontend & admin features
- JWT-based Authentication & Authorization
- MongoDB (via Mongoose) for database
- File Uploads using Multer
- Cloudinary for Image/File Storage
- Complex Business Logic for appointments, medicines, and users
- Real-time Chat and Messaging support

---

## 🛠 Technologies Used

| Backend                   | Frontend (User & Admin)                    |
|---------------------------|--------------------------------------------|
| Node.js                   | React.js                                   |
| Express.js                | JavaScript (JSX)                           |
| MongoDB (Mongoose)        | HTML5                                      |
| Multer                    | CSS (Tailwind CSS inferred for Admin UI) |
| Cloudinary                | Vite (build tool)                          |
| JSON Web Tokens (JWT)     | Context API for State Management           |
|                           | Firebase (User Authentication & Features) |

---

## 📁 Project Structure

The project is organized into three main directories at the root level:



```
MEDNOVA/
├── admin/                      # Admin Dashboard Frontend
│   ├── public/                 # Public assets
│   ├── src/
│   │   ├── assets/             # Images, icons, or static files
│   │   ├── components/         # Reusable UI components
│   │   │   ├── CardSection.jsx
│   │   │   ├── DNNavbar.jsx    # Dashboard Navbar
│   │   │   ├── HeroSection.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── StatsSection.jsx
│   │   │   └── useDebounce.jsx # Custom debounce hook
│   │   ├── context/            # Global state and context
│   │   │   ├── AdminContext.jsx
│   │   │   ├── AppContext.jsx
│   │   │   ├── doctorContext.jsx
│   │   │   ├── MedicineContext.jsx
│   │   │   ├── StaffContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── pages/              # Route-based pages
│   │   │   ├── Admin/
│   │   │   ├── Doctor/
│   │   │   └── staff/
│   │   ├── App.jsx             # Main App structure
│   │   ├── Login.jsx           # Login page for all roles
│   │   ├── hh.jsx              # (Temporary/Test Page)
│   │   ├── index.css
│   │   └── main.jsx            # Vite entry point
│   ├── .env                    # Admin specific environment variables
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── README.md
├── backend/                    # Backend API (Node.js/Express)
│   ├── config/
│   │   ├── cloudinary.js
│   │   └── mongodb.js
│   ├── controllers/            # Request handlers
│   │   ├── adminController.js
│   │   ├── chatController.js
│   │   ├── doctorController.js
│   │   ├── medicineController.js
│   │   ├── nursecontroller.js
│   │   ├── patientcontroller.js
│   │   ├── staffController.js
│   │   ├── StaffdepartmentController.js
│   │   └── userController.js
│   ├── middlewares/            # Express middlewares (authentication, etc.)
│   │   ├── authAdmin.js
│   │   ├── authchat.js
│   │   ├── authDoctor.js
│   │   ├── authMedicine.js
│   │   ├── authP.js
│   │   ├── authStaff.js
│   │   ├── authUser.js
│   │   ├── multer.js           # File upload middleware
│   │   └── verifyStaff.js
│   ├── models/                 # Database models (Mongoose schemas)
│   │   ├── appointmentModel.js
│   │   ├── chatModel.js
│   │   ├── contactmodel.js
│   │   ├── DepartmentModel.js
│   │   ├── doctorModel.js
│   │   ├── HeaderModel.js
│   │   ├── medicineModel.js
│   │   ├── patientModel.js
│   │   ├── purchaseModel.js
│   │   ├── RelativeAppointment.js
│   │   ├── staffModel.js
│   │   └── userModel.js
│   ├── node_modules/           # Backend dependencies (generated)
│   ├── routes/                 # API routes
│   │   ├── adminMessageRoutes.js
│   │   ├── adminRoute.js
│   │   ├── doctorRoute.js
│   │   ├── medicineRoutes.js
│   │   ├── patientRoutes.js
│   │   ├── staffdepartmentRoutes.js
│   │   ├── staffRoute.js
│   │   └── userRoutes.js
│   ├── .env                    # Backend environment variables
│   ├── package-lock.json
│   ├── package.json            # Backend dependencies and scripts
│   └── server.js               # Backend entry point
└── frontend/                   # Main User-Facing Frontend
    ├── public/                 # Public assets
    ├── src/
    │   ├── assets/             # Images, icons, etc.
    │   ├── component/          # Reusable components
    │   │   ├── AIChat.jsx
    │   │   ├── Banner.jsx
    │   │   ├── Footer.jsx
    │   │   ├── Header.jsx
    │   │   ├── MedicineForm.jsx
    │   │   ├── Navbar.jsx
    │   │   ├── OtpLogin.jsx
    │   │   ├── RelatedDoctors.jsx
    │   │   ├── SpecialityMenu.jsx
    │   │   └── TopDoctors.jsx
    │   ├── context/            # App-wide contexts
    │   │   ├── AppContext.jsx
    │   │   ├── firebase.jsx    # Firebase config
    │   │   └── ThemeContext.jsx
    │   ├── pages/              # Route-based pages
    │   │   ├── About.jsx
    │   │   ├── Appointment.jsx
    │   │   ├── Contact.jsx
    │   │   ├── Doctor.jsx
    │   │   ├── Home.jsx
    │   │   ├── Login.jsx
    │   │   ├── MedicineList.jsx
    │   │   ├── MyAppointments.jsx
    │   │   ├── MyMedicines.jsx
    │   │   ├── MyProfile.jsx
    │   │   ├── PrivacyPolicy.jsx
    │   │   └── RelativeAppointmentsList.jsx
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx            # Entry point
    ├── .env                    # Frontend environment variables
    ├── .gitignore
    ├── index.html              # Root HTML template
    ├── package.json            # Frontend dependencies and scripts
    ├── package-lock.json
    └── eslint.config.js
```


---

## 📌 Additional Notes

- The platform leverages **modern authentication techniques** using JWT for secure access.
- **Cloudinary** is integrated for efficient image and file handling.
- **AI Chat Assistance** enhances user experience by providing quick support.
- **Real-time messaging** supports communication between admins, doctors, and staff.

---

Feel free to explore the project directories to dive deeper into the individual components!

---

*MEDNOVA — Empowering healthcare management with technology.*



## Getting Started

Follow these steps to set up and run the project locally.

### Prerequisites

*   Node.js (v14 or higher recommended)
*   npm or yarn package manager
*   MongoDB instance (local or hosted)
*   Cloudinary account (for file uploads)
*   Firebase project (for user frontend features like OTP)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Sanjeev-k-11/MedNova.git
    cd MEDNOVA
    ```

2.  **Install Backend Dependencies:**
    ```bash
    cd backend
    npm install 
    cd ..
    ```

3.  **Install Frontend Dependencies:**
    ```bash
    cd frontend
    npm install 
    cd ..
    ```

4.  **Install Admin Dependencies:**
    ```bash
    cd admin
    npm install 
    cd ..
    ```

### Configuration

Each part of the application (`backend`, `frontend`, `admin`) requires a `.env` file for environment-specific variables. Create a `.env` file in each of these directories.

#### `backend/.env`

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
JWT_SECRET=your_jwt_secret_key
# Add other backend specific variables

```

## frontend/.env

```
REACT_APP_BACKEND_API_URL=http://localhost:5000 # Or your backend URL
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
# Add other frontend specific variables
```
## admin/.env

```
VITE_BACKEND_API_URL=http://localhost:5000
```

# Running the Application

Open three separate terminal windows, one for each part of the application.

## 1.Start the Backend:
```
cd MEDNOVA/backend
npm run start
```

## 2. Start the admin:

```
cd MEDNOVA/admin
npm run dev
```

## 3. Start the User Frontend:
```
cd MEDNOVA/frontend
npm run dev
```

# 👤 Author

 Sanjeev Kumar


# Login admin, staff, Doctor
![Screenshot 2025-05-21 230218](https://github.com/user-attachments/assets/fd512dd0-3a92-4483-941e-d097aa15cbfe)

# User Login
![Screenshot 2025-05-21 230412](https://github.com/user-attachments/assets/3fa761e3-876f-4a16-9440-30adfda05eda)
# user Dasboard and some pages 
![Screenshot 2025-05-21 230452](https://github.com/user-attachments/assets/648c6b82-efcc-431f-bf38-fd9e8d10e253)
![Screenshot 2025-05-21 230537](https://github.com/user-attachments/assets/d2825c86-2a72-48d1-9b36-1696a146e4ab)
![Screenshot 2025-05-21 230558](https://github.com/user-attachments/assets/f7a40d4f-7f28-4961-bcc1-ea73cb464f91)
![Screenshot 2025-05-21 230614](https://github.com/user-attachments/assets/4297b3d7-8312-46aa-8dcd-4cf3790f84bd)
![Screenshot 2025-05-21 230648](https://github.com/user-attachments/assets/fc45f42c-7c2d-4bff-9a46-dbb6c8dff016)
![Screenshot 2025-05-21 230723](https://github.com/user-attachments/assets/effa9a3a-bc59-4bc3-a554-a302d2fdd528)
![Screenshot 2025-05-21 230756](https://github.com/user-attachments/assets/1a3eb84a-89fd-40e9-9412-3586e37aa267)
![Screenshot 2025-05-21 230813](https://github.com/user-attachments/assets/0f2c8432-c45b-4837-b270-b58d07f78c16)



# staff and doctor and admin 
![Screenshot 2025-05-21 231010](https://github.com/user-attachments/assets/3578fa64-1d8e-4094-b399-9148614bd687)
![Screenshot 2025-05-21 231031](https://github.com/user-attachments/assets/71e6aad9-f79c-49d3-a563-40fd4688a4a3)
![Screenshot 2025-05-21 231053](https://github.com/user-attachments/assets/0b9e3ed5-6e26-4c3e-8cdc-47c7321be6f8)
![Screenshot 2025-05-21 231159](https://github.com/user-attachments/assets/31b13ccb-37ab-42e3-a26a-d3aee0b8c1e1)
![Screenshot 2025-05-21 231159](https://github.com/user-attachments/assets/b21a3c41-66ff-47e8-ba02-be70b0a22b6b)
![Screenshot 2025-05-21 231242](https://github.com/user-attachments/assets/d172e28f-4913-4a12-b9dc-e6890eac9651)
![Screenshot 2025-05-21 231305](https://github.com/user-attachments/assets/01475bd5-bea1-4204-a0b9-ad690dcc7c7a)
![Screenshot 2025-05-21 231333](https://github.com/user-attachments/assets/5947d169-da50-4848-a812-ad0df7311872)
