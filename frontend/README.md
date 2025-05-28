# 🏥 React Medical App

A modern and responsive medical management system built with **React.js**. This application includes features for doctor discovery, appointment scheduling, medicine management, and secure authentication using OTP via Firebase.

---

## 🚀 Features

- 🔐 OTP-based Login with Firebase
- 🏠 Home, About, and Contact Pages
- 👨‍⚕️ View Doctor Profiles and Related Doctors
- 📅 Book and Manage Appointments
- 💊 Manage Medicines (List, Add, and Track)
- 👤 User Profile and Privacy Policy Pages
- 🧠 AI Chat (Medical Q&A/Chatbot)
- 🌙 Theme support (Light/Dark mode)
- 📲 Responsive UI built with modern React practices
- 🔄 Reusable Components like Navbar, Footer, Header, etc.

---

## 📁 Project Structure

```frontend/
├── public/
├── src/
│   ├── assets/                        # Images, icons, etc.
│   ├── component/                    # Reusable components
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
│   ├── context/                      # App-wide contexts
│   │   ├── AppContext.jsx
│   │   ├── firebase.jsx              # Firebase config
│   │   └── ThemeContext.jsx
│   ├── pages/                        # Route-based pages
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
│   └── main.jsx                      # Entry point
├── .env                              # Environment variables
├── .gitignore
├── index.html                        # Root HTML template
├── package.json
├── package-lock.json
└── eslint.config.js
```



---

## ⚙️ Getting Started

## 1. Clone the Repository

```bash
git clone https://github.com/your-username/react-medical-app.git
cd react-medical-app/frontend

```
## 2. Install Dependencies
```
npm install


```
## 3. Configure Firebase

```

VITE_API_KEY=your_api_key
VITE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_PROJECT_ID=your_project_id
VITE_STORAGE_BUCKET=your_project.appspot.com
VITE_MESSAGING_SENDER_ID=your_sender_id
VITE_APP_ID=your_app_id

```
## 4. Run the Application

```

npm run dev
```

Visit http://localhost:5173 in your browser.


## 🔧 Built With
- [React.js](https://reactjs.org/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Axios](https://axios-http.com/)
- [Lucide Icons](https://lucide.dev/)
- [Vite](https://vitejs.dev/)
- [React Router](https://reactrouter.com/)


## 📌 Upcoming Features
- ✅ Admin Dashboard
- ✅ Payment Integration (e.g., Razorpay)
- ✅ Notifications and Email Alerts
- ✅ Advanced AI Chat Assistant


## 🧾 **Contributing**

Want to contribute? Great!

1. Fork the repo  
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)  
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)  
4. Push to the branch (`git push origin feature/AmazingFeature`)  
5. Open a Pull Request


## 🌐 Live Demo
Coming Soon... 

## 🙌 Acknowledgements
- [React](https://reactjs.org/)
- [Firebase](https://firebase.google.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Lucide Icons](https://lucide.dev/)

```

Let me know if you also want a `backend` section or a sample `.env` file template with more security instructions.
```

