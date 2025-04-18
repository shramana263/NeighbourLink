// import { useEffect, useState } from "react";
// import {
//   BrowserRouter as Router,
//   Route,
//   Routes,
//   Navigate,
// } from "react-router-dom";
// // import {
// //   requestNotificationPermission,
// //   onMessageListener,
// //   displayNotification,
// //   NotificationType,
// // } from "./notification";
// import "./App.css";
// import LandingPage from "./components/landingpage/LandingPage";
// import Register from "./components/authPage/Register";
// import { ToastContainer } from "react-toastify";
// import Login from "./components/authPage/Login";
// import Profile from "./components/authPage/Profile";
// import { auth } from "./firebase";
// import ResourceForm from "./components/Forms/ResourceForm";
// import ProfileCard from "./components/ProfileCard/ProfileCard";
// import ResourceSharingForm from "./components/Forms/ResourceSharingForm";
// import UploadFiletoAWS from "./components/AWS/UploadFile";
// import Home from "./pages/Home";
// // import { initNotificationHandlers } from "./services/notificationHandler";

// function App() {
//   // const [notificationsSupported, setNotificationsSupported] = useState(true);
//   const [user, setUser] = useState<any>();
//   // const [, setNotification] = useState({ title: "", body: "" });

//   useEffect(() => {
//     // initNotificationHandlers();
//     auth.onAuthStateChanged((user) => {
//       setUser(user);
//     });
//   });



//   return (
//     <>
//       <Router>
//         <div className="app-container border border-gray-300">
//           <Routes>
//             <Route
//               path="/"
//               element={user ? <Navigate to="/profile" /> : <Home />}
//             />
//             <Route path="/upload" element={<UploadFiletoAWS />} />
//             <Route path="/register" element={<Register />} />
//             <Route path="/login" element={<Login />} />
//             <Route path="/profile" element={<Profile />} />
//             <Route path="/profileCard" element={<ProfileCard />} />
//             <Route path="/home" element={<LandingPage />} />
//             <Route
//               path="/profile/rqform"
//               element={<ResourceForm userId={user?.uid} />}
//             />
//             <Route
//               path="/profile/shareform"
//               element={<ResourceSharingForm userId={user?.uid} />}
//             />
            
//           </Routes>
//           {/* {!notificationsSupported && (
//             <p className="text-orange-500">
//               Note: Push notifications are not supported in this browser.
//             </p>
//           )} */}
//         </div>
//       </Router>
//       <ToastContainer />
//     </>
//   );
// }

// export default App;
