import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

const GuestRouter: React.FC = () => {
    return (
        <Routes>
            {/* <Route index element={<LandingPage />} /> */}
            
            {/* Redirect unauthorized users to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};

export default GuestRouter;