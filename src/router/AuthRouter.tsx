import { Navigate, Route, Routes } from 'react-router-dom';
import React, { useEffect, useState, Suspense } from 'react';
import { auth } from "../firebase";
import Home from '@/pages/Home';
import LandingPage from '@/components/landingPage/LandingPage';




const LoadingFallback = () => (
  <div className="flex justify-center items-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
  </div>
);

const AuthRouter: React.FC = () => {
  const [user, setUser] = useState<any>();
  
  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      setUser(user);
    });
  });

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route index element={<Home />} />
        <Route path="/home" element={<LandingPage />} />
        <Route path='/register' element={<Navigate to="/"/>}/>
        <Route path='/login' element={<Navigate to="/"/>}/>
       
      </Routes>
    </Suspense>
  );
};

export default AuthRouter;