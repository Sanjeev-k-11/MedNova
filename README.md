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
    git clone <repository_url>
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

![image](https://github.com/user-attachments/assets/bcfc7d24-7e8e-4ddf-8b37-57e157e5575b)
# user Dasboard and some pages 
![image](https://github.com/user-attachments/assets/497863a6-db7f-482d-8521-c454e358f19b)
![image](https://github.com/user-attachments/assets/f0f529fd-4c41-4104-8cdd-ce8b53fcde76)
![image](https://github.com/user-attachments/assets/542bae1f-525c-4fe8-ba11-03b01320cc2c)
![image](https://github.com/user-attachments/assets/4c858c22-9da1-4107-9b09-7c7ec691dddc)
![image](https://github.com/user-attachments/assets/834e6426-d5b7-458b-ac1b-e9c49f56609c)
![image](https://github.com/user-attachments/assets/98e94110-b705-4cf3-8237-fb6a807f513a)
![image](https://github.com/user-attachments/assets/c0065f7f-9a8a-49cd-b216-e6f11a7087fd)
![image](https://github.com/user-attachments/assets/ae06f843-ad37-4299-989d-77c9846d8c92)

# staff and doctor and admin 
![image](https://github.com/user-attachments/assets/1b34aa23-eb70-4656-9a20-8b590fd70ee8)
![image](https://github.com/user-attachments/assets/0dc495e6-96ac-4b25-89d4-9e8ccc8fad1b)
![image](https://github.com/user-attachments/assets/407a7eb6-b37f-41ff-9ea4-b9d06952df55)
![image](https://github.com/user-attachments/assets/ccd1d510-c32f-4fe5-ae2c-50a17e81b15a)
![image](https://github.com/user-attachments/assets/c22bba80-dfe4-4a60-8deb-6d5aa3508d85)
![image](https://github.com/user-attachments/assets/7e16a0ef-63f5-4092-a0be-f04c95db5d99)
![image](https://github.com/user-attachments/assets/a66685b9-789b-4381-9ffa-2e95f57344fe)
![image](https://github.com/user-attachments/assets/a2f60163-9e18-4ee5-85bd-b0afdd99adc4)
