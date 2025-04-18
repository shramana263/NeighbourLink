import { Navigate, Route, Routes } from 'react-router-dom';
import React, { useEffect, useState, lazy, Suspense } from 'react';
import { auth } from "../firebase";
import Home from '@/pages/Home';
import LandingPage from '@/components/landingPage/LandingPage';

// const Profile = lazy(() => import('@/components/authPage/Profile'));
const ResourceForm = lazy(() => import('@/components/Forms/ResourceForm'));
// const LandingPage = lazy(() => import('@/components/landingpage/LandingPage'));
const PostDetailsPage = lazy(() => import('@/components/post/PostDetailsPage'));

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
        <Route path="/resource/offer" element={<ResourceForm userId={user?.uid}/>} />
        <Route path="/resource/need" element={<ResourceForm userId={user?.uid}/>} />
        <Route path="/post/:id" element={<PostDetailsPage/>} />
        
        
        
        
        <Route path='/register' element={<Navigate to="/"/>}/>
        <Route path='/login' element={<Navigate to="/"/>}/>
        
      </Routes>
    </Suspense>
  );
};

export default AuthRouter;