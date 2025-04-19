import { Navigate, Route, Routes } from "react-router-dom";
import React, { useEffect, useState, lazy, Suspense } from "react";
import { auth } from "../firebase";

import Home from "@/pages/Home";
import MessagesList from "@/components/messaging/MessagesList";
import ChatDetail from "@/components/messaging/ChatDetail";
import LandingPage from "@/components/landingPage/LandingPage";
import EmergencyPosts from "@/pages/EmergencyPosts";
import SavedPosts from "@/components/post/SavedPosts";
import SkillList from "@/components/communities/skillSharing/SkillList";
import SkillSharingForm from "@/components/communities/skillSharing/SkillSharingForm";
import SkillHome from "@/pages/skillSharing";
import VolunteerShow from "@/pages/VolunteerShow";
import { useNotification } from "@/utils/notification/NotificationHook";
import AuthPosts from "@/pages/AuthPosts";
import NotFoundPage from "@/pages/NotFoundPage";
import EventsPage from "@/pages/EventsPage";
import EventDetailsPage from "@/components/event/EventDetailsPage";
import UpdatePage from "@/components/update/SpecificUpdatePage";
import NewUpdateForm from "@/components/update/UpdateFormSingleComponent";
import UpdatesPage from "@/components/update/UpdatesFeedPage";

// const Profile = lazy(() => import('@/components/authPage/Profile'));
const ProfileCard = lazy(() => import("@/components/ProfileCard/ProfileCard"));
const ResourceForm = lazy(() => import("@/components/Forms/ResourceForm"));

// const LandingPage = lazy(() => import('@/components/landingpage/LandingPage'));
const UserRequests = lazy(() => import("@/components/PostCard/UserRequests"));
const UserSharedResources = lazy(
  () => import("@/components/PostCard/UserSharedResources")
);
const SearchPage = lazy(() => import("@/components/search/SearchPage"));
const PostDetailsPage = lazy(() => import("@/components/post/PostDetailsPage"));
const ResourceDetailsPage = lazy(() => import("@/components/resource/ResourceDetailsPage"));

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

  useNotification();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route index element={<Home />} />
        <Route path="/profileCard" element={<ProfileCard />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/home" element={<LandingPage />} />
        // we will cahnge it later
        <Route path="/skill-share" element={<SkillList />} />
        <Route
          path="/skills-sharing-register"
          element={<SkillSharingForm isOpen={true} />}
        />
        // Example of how to add the route in your router file
        <Route path="/event/:id" element={<EventDetailsPage />} />
        <Route
          path="/resource/offer"
          element={<ResourceForm userId={user?.uid} />}
        />
        <Route
          path="/resource/need"
          element={<ResourceForm userId={user?.uid} />}
        />
        <Route path="/post/:id" element={<PostDetailsPage />} />
        <Route path="/resource/:id" element={<ResourceDetailsPage />} />
        <Route path="/profile/auth/requests" element={<UserRequests />} />
        <Route path="/auth/posts" element={<AuthPosts />} />
        <Route
          path="/profile/auth/shared-resources"
          element={<UserSharedResources />}
        />
        <Route path="/skillHome" element={<SkillHome />} />
        <Route path="/volunteer" element={<VolunteerShow />} />
        <Route path="/messages" element={<MessagesList />} />
        <Route path="/messages/:conversationId" element={<ChatDetail />} />
        <Route path="/emergency/posts" element={<EmergencyPosts />} />
        <Route path="/saved/posts" element={<SavedPosts />} />
        <Route path="/events" element={<EventsPage />} />
        
        {/* New Update Routes */}
        <Route path="/updates" element={<UpdatesPage />} />
        <Route path="/update/:id" element={<UpdatePage />} />
        <Route path="/update/new" element={<NewUpdateForm />} />
        
        <Route path="/register" element={<Navigate to="/" />} />
        <Route path="/login" element={<Navigate to="/" />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default AuthRouter;
