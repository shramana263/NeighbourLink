import { Routes } from 'react-router-dom';
import React, { useEffect, useState, Suspense } from 'react';
import { auth } from '../firebase';

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
                {/* <Route index element={<Landing />} /> */}
            </Routes>
        </Suspense>
    );
};

export default AuthRouter;