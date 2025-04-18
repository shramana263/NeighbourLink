export interface S3UploadParams {
    Bucket: string;
    Key: string;
    Body: File;
    ContentType: string;
}

export interface S3UploadResponse {
    Location: string;
    [key: string]: any;
}


export interface User {
  id?: string;
  displayName: string;
  email: string;
  photoURL?: string;
  phoneNumber?: string;
  address?: string;
  location?: {
    lat: number;
    lng: number;
  };
  bio?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  trustScore?: number;
  isVerified?: boolean;
  trustedNeighbor?: boolean;
  savedPosts?: string[];
  notificationSettings?: {
    email: boolean;
    push: boolean;
    sms: boolean;
    emergencyAlerts: boolean;
    proximityRadius: number;
  };
  fcmToken?: string;
}


export interface Post {
  id?: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  isEmergency: boolean;
  location: {
    lat: number;
    lng: number;
  };
  address?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  photoUrls?: string[];
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  visibilityRadius: number;
  responders?: string[];
  selectedResponder?: string;
  userData?: User;
}


export interface SharedResource {
  id?: string;
  userId: string;
  resourceName: string;
  category: string;
  description: string;
  condition: string;
  photoUrl?: string;
  location: {
    lat: number;
    lng: number;
  };
  address?: string;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
  availability: boolean;
  currentBorrowerId?: string;
  borrowHistory?: {
    userId: string;
    borrowedAt: Timestamp;
    returnedAt?: Timestamp;
    rating?: number;
    feedback?: string;
  }[];
  userData?: User;
}


export interface PostResponse {
  id?: string;
  postId: string;
  responderId: string;
  message: string;
  createdAt: Timestamp;
  status: 'pending' | 'accepted' | 'rejected';
  isRead: boolean;
  userData?: User; 
}


export interface Message {
  id?: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Timestamp;
  isRead: boolean;
  attachmentUrl?: string;
}


export interface Conversation {
  id?: string;
  participants: string[];
  lastMessage: string;
  lastMessageTimestamp: Timestamp;
  unreadCount: {
    [userId: string]: number;
  };
}


export interface Notification {
  id?: string;
  userId: string;
  title: string;
  content: string;
  type: 'post' | 'message' | 'response' | 'emergency' | 'system';
  referenceId?: string;
  createdAt: Timestamp;
  isRead: boolean;
}


export interface UserRating {
  id?: string;
  fromUserId: string;
  toUserId: string;
  rating: number;
  comment?: string;
  createdAt: Timestamp;
}


import { Timestamp } from 'firebase/firestore';