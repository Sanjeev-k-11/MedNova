# 🧑‍⚕️ Admin Panel - Medical Management System

A powerful and intuitive **Admin Dashboard** built with **React.js** for managing users, doctors, appointments, staff, and medicines in a healthcare system. This admin interface works in coordination with the main user app.

---

## 🎯 Features

- 🔐 Admin, Doctor, and Staff Authentication
- 📊 Dashboard with Statistics & Cards
- 🩺 Manage Doctors, Staff, and Medicines
- 🧑‍💻 Separate Context APIs for Role-Based Data
- 🔎 Debounce Utility for Search Optimization
- 📈 Stats Sections and Responsive Charts
- 📦 Modular Component Structure
- 🌙 Theme Support with Context
- 🧠 Vite + Tailwind + React Router Setup

---

## 📁 Project Structure

```
admin/
├── public/
├── src/
│ ├── assets/ # Images, icons, or static files
│ ├── components/ # Reusable UI components
│ │ ├── CardSection.jsx
│ │ ├── DNNavbar.jsx # Dashboard Navbar
│ │ ├── HeroSection.jsx
│ │ ├── Navbar.jsx
│ │ ├── Sidebar.jsx
│ │ ├── StatsSection.jsx
│ │ └── useDebounce.jsx # Custom debounce hook
│ ├── context/ # Global state and context
│ │ ├── AdminContext.jsx
│ │ ├── AppContext.jsx
│ │ ├── doctorContext.jsx
│ │ ├── MedicineContext.jsx
│ │ ├── StaffContext.jsx
│ │ └── ThemeContext.jsx
│ ├── pages/ # Route-based pages
│ │ ├── Admin/
│ │ ├── Doctor/
│ │ └── staff/
│ ├── App.jsx # Main App structure
│ ├── Login.jsx # Login page for all roles
│ ├── hh.jsx # (Temporary/Test Page)
│ ├── index.css
│ └── main.jsx # Vite entry point
├── .env
├── .gitignore
├── index.html
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── README.md
```


---

## ⚙️ Getting Started

### 1. Clone the Repository

```bash
git clone [https://github.com/your-username/admin-panel-medical.git](https://github.com/Sanjeev-k-11/MedNova.git)
cd admin
```
## 2. Install Dependencies
```
npm install
```
## 3. Setup Environment Variables

```
VITE_API_BASE_URL=http://localhost:4000/api

###🔐 Make sure the backend supports role-based authentication.
```
## 4. Run the Development Server
```
npm run dev
```

## 🛠 Tech Stack

- [React.js](https://reactjs.org/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Axios](https://axios-http.com/)
- [Lucide Icons](https://lucide.dev/)
- [Vite](https://vitejs.dev/)
- [React Router](https://reactrouter.com/)
  

## 🧩 **Role-based Context APIs**

- 🧑‍⚕️ `doctorContext.jsx` – For handling doctor-related data  
- 👨‍🏫 `StaffContext.jsx` – Staff-specific data and functions  
- 🧑‍💼 `AdminContext.jsx` – Admin controls and stats  
- 💊 `MedicineContext.jsx` – Medicines CRUD  
- 🌐 `AppContext.jsx` – Global/shared data  
- 🌗 `ThemeContext.jsx` – Light/Dark mode support  


## 🔒 Authentication Flow

Each role (Admin, Doctor, Staff) has their own login, and data is protected using role-based context. You can customize routes and token storage using localStorage or Firebase/Backend tokens.


## 📌 To-Do / Improvements

- [ ] Role-based routing guards
- [ ] Detailed CRUD interfaces for Admin
- [ ] Integration with backend APIs
- [ ] Toast notifications for actions
- [ ] Activity logs and audit trails


## 🧡 Contributing

1.  Fork the repo
2.  Create your feature branch (`git checkout -b feature/admin-feature`)
3.  Commit your changes (`git commit -m 'Add admin dashboard feature'`)
4.  Push to the branch (`git push origin feature/admin-feature`)
5.  Open a Pull Request

## 🌐 Live Demo

Coming Soon...

## 👏 Acknowledgements

- [ ] React + Vite + Tailwind = 💖
- [ ] Inspiration from modern medical dashboards

```

Let me know if you'd like to combine both **user** and **admin** panel `README.md` into one or need a `backend` version too.

```

# Login admin, staff, Doctor
![Screenshot 2025-05-21 230218](https://github.com/user-attachments/assets/fd512dd0-3a92-4483-941e-d097aa15cbfe)

# staff info page

![Screenshot 2025-05-21 231010](https://github.com/user-attachments/assets/3578fa64-1d8e-4094-b399-9148614bd687)
![Screenshot 2025-05-21 231031](https://github.com/user-attachments/assets/71e6aad9-f79c-49d3-a563-40fd4688a4a3)
![Screenshot 2025-05-21 231053](https://github.com/user-attachments/assets/0b9e3ed5-6e26-4c3e-8cdc-47c7321be6f8)
![Screenshot 2025-05-21 231159](https://github.com/user-attachments/assets/31b13ccb-37ab-42e3-a26a-d3aee0b8c1e1)
![Screenshot 2025-05-21 231159](https://github.com/user-attachments/assets/b21a3c41-66ff-47e8-ba02-be70b0a22b6b)
![Screenshot 2025-05-21 231242](https://github.com/user-attachments/assets/d172e28f-4913-4a12-b9dc-e6890eac9651)
![Screenshot 2025-05-21 231305](https://github.com/user-attachments/assets/01475bd5-bea1-4204-a0b9-ad690dcc7c7a)
![Screenshot 2025-05-21 231333](https://github.com/user-attachments/assets/5947d169-da50-4848-a812-ad0df7311872)
