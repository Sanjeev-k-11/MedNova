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
git clone https://github.com/Sanjeev-k-11/MedNova.git
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

