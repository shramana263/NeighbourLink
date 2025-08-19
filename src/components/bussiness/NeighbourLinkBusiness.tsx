import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "@/firebase";
import { GiHamburgerMenu } from "react-icons/gi";
import { FaStore } from "react-icons/fa";
import {
  Star,
  Phone,
  CreditCard,
  QrCode,
  Eye,
  Image,
  FileText,
  Crown,
  Edit,
  X,
  BarChart3,
  TrendingUp,
  Users,
  ShoppingBag,
  AlertTriangle,
  MapPin,
  Camera,
  Briefcase,
  Save,
  Plus,
  Trash2,
} from "lucide-react";
import Sidebar from "../authPage/structures/Sidebar";
import Bottombar from "@/components/authPage/structures/Bottombar";
import { useMobileContext } from "@/contexts/MobileContext";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageDisplay } from "@/utils/cloudinary/CloudinaryDisplay";
import { uploadFileToCloudinary, createUniqueFileName, deleteFromCloudinary } from "@/utils/cloudinary/cloudinary";

interface Review {
  id: string;
  title: string;
  body: string;
  reviewerName: string;
  date: string;
  rating: number;
  reviewerAvatar?: string;
}

interface BusinessCollection {
  id: string;
  businessName: string;
  businessBio: string;
  ownerId: string;
  isActive: boolean;
  isVerified: boolean;
  verificationDocUrl?: string;
  businessType: string;
  createdAt?: Date;

  contact: {
    phone: string;
    verified: boolean;
  };
  gallery: string[];
  businessProfileImage: string;
  coverImage: string;
  deliverySupport: boolean;
  paymentSupport?: {
    accountDetails?: string;
    qrCodeUrl?: string;
  };
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  services: {
    id: string;
    name: string;
    description?: string;
    price?: number;
    duration?: string;
    imageUrl?: string[];
  }[];

  products: {
    id: string;
    name: string;
    description?: string;
    price?: number;
    stock?: number;
    imageUrl?: string[];
  }[];

  faq?: {
    question: string;
    answer: string;
  }[];
}

const StarRating: React.FC<{ rating: number; className?: string }> = ({
  rating,
  className = "",
}) => {
  return (
    <div className={`flex ${className}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
};

// Warning Card Component for inline warnings
const WarningCard: React.FC<{
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}> = ({ title, message, actionText, onAction, icon }) => {
  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {icon || (
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1">
            {title}
          </h4>
          <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
            {message}
          </p>
          {actionText && onAction && (
            <button
              onClick={onAction}
              className="inline-flex items-center gap-2 text-sm bg-amber-600 text-white px-3 py-1 rounded hover:bg-amber-700 transition-colors"
            >
              <Edit className="w-3 h-3" />
              {actionText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const NeighbourLinkBusiness: React.FC = () => {
  const [businessData, setBusinessData] = useState<BusinessCollection | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showStatisticsModal, setShowStatisticsModal] = useState(false);
  const [showGalleryDrawer, setShowGalleryDrawer] = useState(false);
  const [incompleteFields, setIncompleteFields] = useState<string[]>([]);
  const navigate = useNavigate();
  const { isMobile } = useMobileContext();

  const fileInputProfile = useRef<HTMLInputElement>(null);
  const fileInputCover = useRef<HTMLInputElement>(null);
  const fileInputGallery = useRef<HTMLInputElement>(null);

  const [editingBasic, setEditingBasic] = useState(false);
  const [tempBasic, setTempBasic] = useState({
    businessName: '',
    businessBio: '',
    address: '',
    latitude: 0,
    longitude: 0,
    deliverySupport: false
  });

  const [editingContact, setEditingContact] = useState(false);
  const [tempContact, setTempContact] = useState({ phone: '', accountDetails: '' });

  const [editingService, setEditingService] = useState<string | null>(null);
  const [tempService, setTempService] = useState<BusinessCollection['services'][0] | null>(null);

  const [editingProduct, setEditingProduct] = useState<string | null>(null);
  const [tempProduct, setTempProduct] = useState<BusinessCollection['products'][0] | null>(null);

  // Sample reviews data - replace with actual reviews from Firebase
  const reviews: Review[] = [
    {
      id: "1",
      title: "Great Service",
      body: "Excellent quality and fast delivery",
      reviewerName: "John Doe",
      date: "2024-01-15",
      rating: 5,
      reviewerAvatar: "/api/placeholder/24/24",
    },
    {
      id: "2",
      title: "Satisfied Customer",
      body: "Good value for money",
      reviewerName: "Jane Smith",
      date: "2024-01-10",
      rating: 4,
      reviewerAvatar: "/api/placeholder/24/24",
    },
    {
      id: "3",
      title: "Recommended",
      body: "Will definitely come back",
      reviewerName: "Mike Johnson",
      date: "2024-01-05",
      rating: 5,
      reviewerAvatar: "/api/placeholder/24/24",
    },
  ];

  useEffect(() => {
    const fetchUserAndBusinessData = async () => {
      try {
        auth.onAuthStateChanged(async (user) => {
          if (user) {
            const userDocRef = doc(db, "Users", user.uid);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              // Fetch business data
              const businessQuery = query(
                collection(db, "business"),
                where("ownerId", "==", user.uid)
              );
              const businessSnapshot = await getDocs(businessQuery);

              if (!businessSnapshot.empty) {
                const businessDoc = businessSnapshot.docs[0];
                const business = {
                  id: businessDoc.id,
                  ...businessDoc.data(),
                } as BusinessCollection;
                setBusinessData(business);
              } else {
                // No business found, redirect to create business
                navigate("/profileCard?activetab=business");
              }

              setLoading(false);
            } else {
              navigate("/login");
            }
          } else {
            navigate("/login");
          }
        });
      } catch (err) {
        setError("Failed to load business data. Please try again.");
        setLoading(false);
        console.error("Error fetching business data:", err);
      }
    };

    fetchUserAndBusinessData();
  }, [navigate]);

  useEffect(() => {
    if (businessData) {
      setTempBasic({
        businessName: businessData.businessName,
        businessBio: businessData.businessBio,
        address: businessData.location.address,
        latitude: businessData.location.latitude,
        longitude: businessData.location.longitude,
        deliverySupport: businessData.deliverySupport,
      });
      setTempContact({
        phone: businessData.contact.phone,
        accountDetails: businessData.paymentSupport?.accountDetails || '',
      });
      setIncompleteFields(checkIncompleteFields(businessData));
    }
  }, [businessData]);

  const checkIncompleteFields = (business: BusinessCollection): string[] => {
    const incomplete: string[] = [];

    if (!business.contact?.phone) incomplete.push("Phone number");
    if (!business.location?.address) incomplete.push("Business address");
    if (!business.location?.latitude || !business.location?.longitude)
      incomplete.push("Location coordinates");
    if (!business.services?.length && !business.products?.length)
      incomplete.push("At least one service or product");
    if (!business.businessProfileImage)
      incomplete.push("Business profile image");
    if (!business.coverImage) incomplete.push("Cover image");
    if (!business.businessBio) incomplete.push("Business description");

    return incomplete;
  };

  const isProfileComplete = () => {
    return incompleteFields.length === 0;
  };

  const handleNewAnnouncement = () => {
    if (!isProfileComplete()) {
      // For now, alert, but can improve to highlight incomplete sections
      alert("Please complete your profile first");
      return;
    }
    console.log("New announcement clicked");
    // Navigate to announcement creation page
  };

  async function handleLogout() {
    try {
      await auth.signOut();
      window.location.href = "/login";
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error logging out:", error.message);
      }
    }
  }

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleViewQRCode = () => {
    console.log("View QR Code clicked");
  };

  const handleViewInsights = () => {
    setShowStatisticsModal(true);
  };

  const handleViewGallery = () => {
    setShowGalleryDrawer(true);
  };

  const handleViewVerificationDocument = () => {
    console.log("View Verification Document clicked");
  };

  const handleUpgradeToPremium = () => {
    console.log("Upgrade to Premium clicked");
  };

  const handlePromoteItem = (itemId: string, type: "product" | "service") => {
    if (!isProfileComplete()) {
      alert("Please complete your profile first");
      return;
    }
    console.log(`Promote ${type} ${itemId} clicked`);
  };

  // Helper functions to check specific incomplete fields
  const isContactIncomplete = () => !businessData?.contact?.phone;
  const isLocationIncomplete = () =>
    !businessData?.location?.address ||
    !businessData?.location?.latitude ||
    !businessData?.location?.longitude;
  const isImagesIncomplete = () =>
    !businessData?.businessProfileImage || !businessData?.coverImage;
  const isDescriptionIncomplete = () => !businessData?.businessBio;
  const isServicesProductsIncomplete = () =>
    !businessData?.services?.length && !businessData?.products?.length;

  const handleChangeProfile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !businessData) return;
    const file = e.target.files[0];
    setLoading(true);
    try {
      const publicId = await uploadFileToCloudinary(file, createUniqueFileName(file.name));
      if (businessData.businessProfileImage) {
        await deleteFromCloudinary(businessData.businessProfileImage);
      }
      await updateDoc(doc(db, "business", businessData.id), { businessProfileImage: publicId });
      const newData = { ...businessData, businessProfileImage: publicId };
      setBusinessData(newData);
      setIncompleteFields(checkIncompleteFields(newData));
    } catch (error) {
      console.error("Error uploading profile image:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeCover = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0] || !businessData) return;
    const file = e.target.files[0];
    setLoading(true);
    try {
      const publicId = await uploadFileToCloudinary(file, createUniqueFileName(file.name));
      if (businessData.coverImage) {
        await deleteFromCloudinary(businessData.coverImage);
      }
      await updateDoc(doc(db, "business", businessData.id), { coverImage: publicId });
      const newData = { ...businessData, coverImage: publicId };
      setBusinessData(newData);
      setIncompleteFields(checkIncompleteFields(newData));
    } catch (error) {
      console.error("Error uploading cover image:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGallery = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !businessData) return;
    setLoading(true);
    try {
      const files = Array.from(e.target.files);
      const publicIds = await Promise.all(files.map((file) => uploadFileToCloudinary(file, createUniqueFileName(file.name))));
      const newGallery = [...businessData.gallery, ...publicIds];
      await updateDoc(doc(db, "business", businessData.id), { gallery: newGallery });
      setBusinessData({ ...businessData, gallery: newGallery });
    } catch (error) {
      console.error("Error adding gallery images:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveGallery = async (publicId: string) => {
    if (!businessData) return;
    setLoading(true);
    try {
      await deleteFromCloudinary(publicId);
      const newGallery = businessData.gallery.filter((g) => g !== publicId);
      await updateDoc(doc(db, "business", businessData.id), { gallery: newGallery });
      setBusinessData({ ...businessData, gallery: newGallery });
    } catch (error) {
      console.error("Error removing gallery image:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBasic = async () => {
    if (!businessData) return;
    setLoading(true);
    try {
      const updatedData: Partial<BusinessCollection> = {
        businessName: tempBasic.businessName,
        businessBio: tempBasic.businessBio,
        location: {
          address: tempBasic.address,
          latitude: tempBasic.latitude,
          longitude: tempBasic.longitude,
        },
        deliverySupport: tempBasic.deliverySupport,
      };
      await updateDoc(doc(db, "business", businessData.id), updatedData);
      const newData = { ...businessData, ...updatedData };
      setBusinessData(newData);
      setIncompleteFields(checkIncompleteFields(newData));
      setEditingBasic(false);
    } catch (error) {
      console.error("Error saving basic info:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBasic = () => {
    if (businessData) {
      setTempBasic({
        businessName: businessData.businessName,
        businessBio: businessData.businessBio,
        address: businessData.location.address,
        latitude: businessData.location.latitude,
        longitude: businessData.location.longitude,
        deliverySupport: businessData.deliverySupport,
      });
    }
    setEditingBasic(false);
  };

  const handleSaveContact = async () => {
    if (!businessData) return;
    setLoading(true);
    try {
      const updatedData: Partial<BusinessCollection> = {
        contact: {
          ...businessData.contact,
          phone: tempContact.phone,
        },
        paymentSupport: {
          ...businessData.paymentSupport,
          accountDetails: tempContact.accountDetails,
        },
      };
      await updateDoc(doc(db, "business", businessData.id), updatedData);
      const newData = { ...businessData, ...updatedData };
      setBusinessData(newData);
      setIncompleteFields(checkIncompleteFields(newData));
      setEditingContact(false);
    } catch (error) {
      console.error("Error saving contact info:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelContact = () => {
    if (businessData) {
      setTempContact({
        phone: businessData.contact.phone,
        accountDetails: businessData.paymentSupport?.accountDetails || '',
      });
    }
    setEditingContact(false);
  };

  const handleAddService = () => {
    const newId = Date.now().toString();
    setTempService({
      id: newId,
      name: '',
      description: '',
      price: 0,
      duration: '',
      imageUrl: [],
    });
    setEditingService(newId);
  };

  const handleSaveService = async () => {
    if (!businessData || !tempService) return;
    setLoading(true);
    try {
      let newServices = businessData.services;
      const isNew = !businessData.services.some((s) => s.id === tempService.id);
      if (isNew) {
        newServices = [...newServices, tempService];
      } else {
        newServices = newServices.map((s) => s.id === tempService.id ? tempService : s);
      }
      await updateDoc(doc(db, "business", businessData.id), { services: newServices });
      const newData = { ...businessData, services: newServices };
      setBusinessData(newData);
      setIncompleteFields(checkIncompleteFields(newData));
      setEditingService(null);
      setTempService(null);
    } catch (error) {
      console.error("Error saving service:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelService = () => {
    setEditingService(null);
    setTempService(null);
  };

  const handleRemoveService = async (id: string) => {
    if (!businessData || !confirm("Are you sure you want to remove this service?")) return;
    setLoading(true);
    try {
      const serviceToRemove = businessData.services.find((s) => s.id === id);
      if (serviceToRemove?.imageUrl) {
        await Promise.all(serviceToRemove.imageUrl.map(deleteFromCloudinary));
      }
      const newServices = businessData.services.filter((s) => s.id !== id);
      await updateDoc(doc(db, "business", businessData.id), { services: newServices });
      const newData = { ...businessData, services: newServices };
      setBusinessData(newData);
      setIncompleteFields(checkIncompleteFields(newData));
      if (editingService === id) {
        setEditingService(null);
        setTempService(null);
      }
    } catch (error) {
      console.error("Error removing service:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = () => {
    const newId = Date.now().toString();
    setTempProduct({
      id: newId,
      name: '',
      description: '',
      price: 0,
      stock: 0,
      imageUrl: [],
    });
    setEditingProduct(newId);
  };

  const handleSaveProduct = async () => {
    if (!businessData || !tempProduct) return;
    setLoading(true);
    try {
      let newProducts = businessData.products;
      const isNew = !businessData.products.some((p) => p.id === tempProduct.id);
      if (isNew) {
        newProducts = [...newProducts, tempProduct];
      } else {
        newProducts = newProducts.map((p) => p.id === tempProduct.id ? tempProduct : p);
      }
      await updateDoc(doc(db, "business", businessData.id), { products: newProducts });
      const newData = { ...businessData, products: newProducts };
      setBusinessData(newData);
      setIncompleteFields(checkIncompleteFields(newData));
      setEditingProduct(null);
      setTempProduct(null);
    } catch (error) {
      console.error("Error saving product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelProduct = () => {
    setEditingProduct(null);
    setTempProduct(null);
  };

  const handleRemoveProduct = async (id: string) => {
    if (!businessData || !confirm("Are you sure you want to remove this product?")) return;
    setLoading(true);
    try {
      const productToRemove = businessData.products.find((p) => p.id === id);
      if (productToRemove?.imageUrl) {
        await Promise.all(productToRemove.imageUrl.map(deleteFromCloudinary));
      }
      const newProducts = businessData.products.filter((p) => p.id !== id);
      await updateDoc(doc(db, "business", businessData.id), { products: newProducts });
      const newData = { ...businessData, products: newProducts };
      setBusinessData(newData);
      setIncompleteFields(checkIncompleteFields(newData));
      if (editingProduct === id) {
        setEditingProduct(null);
        setTempProduct(null);
      }
    } catch (error) {
      console.error("Error removing product:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Skeleton loading */}
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  if (!businessData) {
    return null;
  }

  const isNewService = editingService && !businessData.services.some((s) => s.id === editingService);
  const isNewProduct = editingProduct && !businessData.products.some((p) => p.id === editingProduct);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <div
        className={`fixed inset-y-0 left-0 w-64 transform ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 z-100`}
      >
        <Sidebar handleLogout={handleLogout} isSidebarOpen={isSidebarOpen} />
      </div>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-transparent z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <div className="md:ml-64">
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-md">
          {/* Header with hamburger */}
          <div className="flex items-center justify-between p-4 md:hidden">
            <button onClick={toggleSidebar}>
              <GiHamburgerMenu className="text-2xl" />
            </button>
          </div>
        </div>

        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                  <FaStore className="text-orange-700 dark:text-yellow-300 text-xl" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200">
                  Business Overview
                </h2>
              </div>
              <button onClick={() => setEditingBasic(true)} className="text-blue-600">
                <Edit className="w-5 h-5" />
              </button>
              {!isProfileComplete() && (
                <div className="bg-amber-100 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-600 rounded-md px-3 py-1">
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-300">
                    Profile Incomplete
                  </span>
                </div>
              )}
            </div>

            {/* Cover Image */}
            <div className="relative mb-6 group">
              {businessData.coverImage ? (
                <ImageDisplay
                  publicId={businessData.coverImage}
                  className="w-full h-48 object-cover rounded-lg border border-slate-200 dark:border-slate-600"
                />
              ) : (
                <div className="w-full h-48 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                  <span className="text-slate-500 text-sm">No Cover Image</span>
                </div>
              )}
              <button
                onClick={() => fileInputCover.current?.click()}
                className="absolute top-2 right-2 bg-white/80 dark:bg-gray-800/80 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-blue-600"
              >
                <Edit className="w-4 h-4" />
              </button>
              <input
                type="file"
                hidden
                ref={fileInputCover}
                onChange={handleChangeCover}
              />
            </div>

            <div className="flex items-center mb-6">
              <div className="relative group mr-4">
                {businessData.businessProfileImage ? (
                  <ImageDisplay
                    publicId={businessData.businessProfileImage}
                    className="w-20 h-20 rounded-lg border border-slate-200 dark:border-slate-600 object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-lg border border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                    <span className="text-slate-500 text-xs">No Image</span>
                  </div>
                )}
                <button
                  onClick={() => fileInputProfile.current?.click()}
                  className="absolute top-0 right-0 bg-white/80 dark:bg-gray-800/80 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-blue-600"
                >
                  <Edit className="w-3 h-3" />
                </button>
                <input
                  type="file"
                  hidden
                  ref={fileInputProfile}
                  onChange={handleChangeProfile}
                />
              </div>
              <div className="flex-1">
                {editingBasic ? (
                  <input
                    type="text"
                    value={tempBasic.businessName}
                    onChange={(e) => setTempBasic({ ...tempBasic, businessName: e.target.value })}
                    className="text-xl font-semibold text-slate-800 dark:text-slate-200 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none"
                  />
                ) : (
                  <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
                    {businessData.businessName}
                  </h3>
                )}
                {editingBasic ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={tempBasic.address}
                      onChange={(e) => setTempBasic({ ...tempBasic, address: e.target.value })}
                      className="text-slate-600 dark:text-slate-400 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none w-full"
                    />
                    <div className="flex gap-4">
                      <input
                        type="number"
                        placeholder="Latitude"
                        value={tempBasic.latitude}
                        onChange={(e) => setTempBasic({ ...tempBasic, latitude: parseFloat(e.target.value) || 0 })}
                        className="text-slate-600 dark:text-slate-400 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none w-full"
                      />
                      <input
                        type="number"
                        placeholder="Longitude"
                        value={tempBasic.longitude}
                        onChange={(e) => setTempBasic({ ...tempBasic, longitude: parseFloat(e.target.value) || 0 })}
                        className="text-slate-600 dark:text-slate-400 bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none w-full"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-600 dark:text-slate-400">
                    {businessData.location?.address || "Location not set"}
                  </p>
                )}
              </div>
            </div>

            {editingBasic ? (
              <textarea
                value={tempBasic.businessBio}
                onChange={(e) => setTempBasic({ ...tempBasic, businessBio: e.target.value })}
                rows={4}
                className="w-full text-slate-700 dark:text-slate-300 mb-6 leading-relaxed bg-transparent border border-gray-300 dark:border-gray-600 rounded-md p-2 focus:outline-none"
              />
            ) : (
              <p className="text-slate-700 dark:text-slate-300 mb-6 leading-relaxed">
                {businessData.businessBio ||
                  "Manage your business presence, connect with customers, and grow your local network."}
              </p>
            )}

            {editingBasic && (
              <div className="flex items-center mb-6">
                <input
                  type="checkbox"
                  checked={tempBasic.deliverySupport}
                  onChange={(e) => setTempBasic({ ...tempBasic, deliverySupport: e.target.checked })}
                  className="h-4 w-4 text-blue-600"
                />
                <label className="ml-2 text-slate-700 dark:text-slate-300">
                  Offer delivery services
                </label>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-center">
                <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  {reviews.length}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Reviews
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-center">
                <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  {(businessData.products?.length || 0) +
                    (businessData.services?.length || 0)}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Items
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-center">
                <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  {businessData.deliverySupport ? "Yes" : "No"}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Delivery
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 text-center">
                <div className="text-lg font-semibold text-slate-800 dark:text-slate-200">
                  {businessData.isVerified ? "✓" : "—"}
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Verified
                </div>
              </div>
            </div>

            {editingBasic && (
              <div className="flex gap-3">
                <button
                  onClick={handleSaveBasic}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Save className="w-4 h-4" />
                  {loading ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleCancelBasic}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border rounded"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Business Details Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 dark:text-white">
                Business Information
              </h3>
              <button onClick={() => setEditingContact(true)} className="text-blue-600">
                <Edit className="w-5 h-5" />
              </button>
            </div>

            {/* Contact Information Warning */}
            {isContactIncomplete() && (
              <WarningCard
                title="Contact Information Missing"
                message="Add your phone number so customers can reach you directly."
                actionText="Add Phone Number"
                onAction={() => setEditingContact(true)}
                icon={<Phone className="w-5 h-5 text-amber-600" />}
              />
            )}

            {/* Location Information Warning */}
            {isLocationIncomplete() && (
              <WarningCard
                title="Business Location Missing"
                message="Set your business address and location coordinates for better discoverability."
                actionText="Set Location"
                onAction={() => setEditingBasic(true)}
                icon={<MapPin className="w-5 h-5 text-amber-600" />}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <Phone className="w-4 h-4" />
                  {editingContact ? (
                    <input
                      type="tel"
                      value={tempContact.phone}
                      onChange={(e) => setTempContact({ ...tempContact, phone: e.target.value })}
                      className="bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none"
                    />
                  ) : (
                    <span>
                      Contact: {businessData.contact?.phone || "Not set"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      businessData.deliverySupport ? "bg-green-500" : "bg-red-500"
                    }`}
                  ></span>
                  <span>
                    Delivery available: {businessData.deliverySupport ? "YES" : "NO"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <CreditCard className="w-4 h-4" />
                  {editingContact ? (
                    <input
                      type="text"
                      value={tempContact.accountDetails}
                      onChange={(e) => setTempContact({ ...tempContact, accountDetails: e.target.value })}
                      className="bg-transparent border-b border-gray-300 dark:border-gray-600 focus:outline-none"
                      placeholder="UPI ID, Bank details, etc."
                    />
                  ) : (
                    <span>
                      Payment:{" "}
                      {businessData.paymentSupport?.accountDetails
                        ? "Digital + Cash"
                        : "Cash only"}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleViewQRCode}
                  className="flex items-center justify-center gap-2 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  <QrCode className="w-4 h-4" />
                  View QR Code
                </button>
                <button
                  onClick={handleUpgradeToPremium}
                  className="flex items-center justify-center gap-2 py-2 bg-black text-white text-sm rounded hover:bg-gray-800 transition-colors"
                >
                  <Crown className="w-4 h-4" />
                  Upgrade To Premium
                </button>
              </div>
            </div>

            {editingContact && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleSaveContact}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  <Save className="w-4 h-4" />
                  {loading ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleCancelContact}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 border rounded"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Business Images Section */}
          {isImagesIncomplete() && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
                Business Images
              </h3>
              <WarningCard
                title="Business Images Missing"
                message="Add a profile image and cover photo to make your business more attractive to customers."
                actionText="Upload Images"
                onAction={() => fileInputProfile.current?.click()}
                icon={<Camera className="w-5 h-5 text-amber-600" />}
              />
            </div>
          )}

          {/* Business Description Section */}
          {isDescriptionIncomplete() && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
                Business Description
              </h3>
              <WarningCard
                title="Business Description Missing"
                message="Add a compelling description of your business to help customers understand what you offer."
                actionText="Add Description"
                onAction={() => setEditingBasic(true)}
                icon={<FileText className="w-5 h-5 text-amber-600" />}
              />
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-8">
            <h3 className="font-semibold text-gray-800 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={handleViewInsights}
                className="flex items-center gap-3 p-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors border border-gray-200 dark:border-gray-600"
              >
                <Eye className="w-5 h-5 text-blue-600" />
                <span>View Insights</span>
              </button>
              <button
                onClick={handleViewGallery}
                className="flex items-center gap-3 p-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors border border-gray-200 dark:border-gray-600"
              >
                <Image className="w-5 h-5 text-green-600" />
                <span>
                  Your Gallery ({businessData?.gallery?.length || 0})
                </span>
              </button>
              <button
                onClick={handleViewVerificationDocument}
                className="flex items-center gap-3 p-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors border border-gray-200 dark:border-gray-600"
              >
                <FileText className="w-5 h-5 text-purple-600" />
                <span>Verification Document</span>
              </button>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="mt-8 mb-8">
            <div className="flex items-center mb-6">
              <div className="h-8 w-1 bg-blue-600 rounded-full mr-3"></div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                Statistics
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
                >
                  <StarRating rating={review.rating} className="mb-2" />
                  <h4 className="font-medium text-gray-800 dark:text-white mb-1">
                    {review.title}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                    {review.body}
                  </p>
                  <div className="flex items-center gap-2">
                    <img
                      src={review.reviewerAvatar || "/api/placeholder/32/32"}
                      alt={review.reviewerName}
                      className="w-6 h-6 rounded-full"
                    />
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      <div className="font-medium">{review.reviewerName}</div>
                      <div>{review.date}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Services Section */}
          <div className="mt-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="h-8 w-1 bg-green-600 rounded-full mr-3"></div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Services
                </h3>
              </div>
              <button
                onClick={handleAddService}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add Service
              </button>
            </div>

            {businessData.services.length === 0 && isServicesProductsIncomplete() && (
              <WarningCard
                title="No Services or Products Added"
                message="Add at least one service or product to complete your profile."
                actionText="Add Service"
                onAction={handleAddService}
                icon={<Briefcase className="w-5 h-5 text-amber-600" />}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {businessData.services.map((service) => {
                const isEditing = editingService === service.id;
                const displayService = isEditing && tempService ? tempService : service;
                return (
                  <div
                    key={service.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Service name"
                          value={displayService.name}
                          onChange={(e) => setTempService({ ...displayService, name: e.target.value })}
                          className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                        />
                        <input
                          type="number"
                          placeholder="Price"
                          value={displayService.price || ''}
                          onChange={(e) => setTempService({ ...displayService, price: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                        />
                        <input
                          type="text"
                          placeholder="Duration"
                          value={displayService.duration || ''}
                          onChange={(e) => setTempService({ ...displayService, duration: e.target.value })}
                          className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                        />
                        <textarea
                          placeholder="Service description"
                          value={displayService.description || ''}
                          onChange={(e) => setTempService({ ...displayService, description: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                        />
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Images</h5>
                          <div className="grid grid-cols-2 gap-2">
                            {displayService.imageUrl?.map((img) => (
                              <div key={img} className="relative">
                                <ImageDisplay publicId={img} className="h-24 w-full object-cover rounded" />
                                <button
                                  onClick={async () => {
                                    await deleteFromCloudinary(img);
                                    setTempService({
                                      ...displayService,
                                      imageUrl: displayService.imageUrl?.filter((i) => i !== img) || [],
                                    });
                                  }}
                                  className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <input
                            type="file"
                            multiple
                            onChange={async (e) => {
                              if (!e.target.files) return;
                              setLoading(true);
                              try {
                                const files = Array.from(e.target.files);
                                const ids = await Promise.all(
                                  files.map((f) => uploadFileToCloudinary(f, createUniqueFileName(f.name)))
                                );
                                setTempService({
                                  ...displayService,
                                  imageUrl: [...(displayService.imageUrl || []), ...ids],
                                });
                              } finally {
                                setLoading(false);
                              }
                            }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleSaveService} className="bg-blue-600 text-white px-4 py-2 rounded">
                            Save
                          </button>
                          <button onClick={handleCancelService} className="border px-4 py-2 rounded">
                            Cancel
                          </button>
                          <button onClick={() => handleRemoveService(service.id)} className="text-red-500">
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-800 dark:text-white">
                            {service.name}
                          </h4>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingService(service.id);
                                setTempService({ ...service, imageUrl: service.imageUrl || [] });
                              }}
                              className="text-blue-600"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleRemoveService(service.id)} className="text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handlePromoteItem(service.id, "service")}
                              className={`text-xs px-2 py-1 rounded transition-colors ${
                                !isProfileComplete()
                                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                  : "bg-green-200 dark:bg-green-600 text-green-700 dark:text-green-200 hover:bg-green-300 dark:hover:bg-green-500"
                              }`}
                              disabled={!isProfileComplete()}
                            >
                              Promote
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {service.description}
                        </p>
                        {service.imageUrl?.length ? (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {service.imageUrl.map((img) => (
                              <ImageDisplay key={img} publicId={img} className="h-20 w-full object-cover rounded" />
                            ))}
                          </div>
                        ) : null}
                        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                          {service.price && <span>₹{service.price}</span>}
                          {service.duration && <span>{service.duration}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {isNewService && tempService && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                  {/* Edit form for new service */}
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Service name"
                      value={tempService.name}
                      onChange={(e) => setTempService({ ...tempService, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={tempService.price || ''}
                      onChange={(e) => setTempService({ ...tempService, price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Duration"
                      value={tempService.duration || ''}
                      onChange={(e) => setTempService({ ...tempService, duration: e.target.value })}
                      className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                    />
                    <textarea
                      placeholder="Service description"
                      value={tempService.description || ''}
                      onChange={(e) => setTempService({ ...tempService, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                    />
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Images</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {tempService.imageUrl?.map((img) => (
                          <div key={img} className="relative">
                            <ImageDisplay publicId={img} className="h-24 w-full object-cover rounded" />
                            <button
                              onClick={async () => {
                                await deleteFromCloudinary(img);
                                setTempService({
                                  ...tempService,
                                  imageUrl: (tempService.imageUrl || []).filter((i) => i !== img),
                                });
                              }}
                              className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <input
                        type="file"
                        multiple
                        onChange={async (e) => {
                          if (!e.target.files) return;
                          setLoading(true);
                          try {
                            const files = Array.from(e.target.files);
                            const ids = await Promise.all(
                              files.map((f) => uploadFileToCloudinary(f, createUniqueFileName(f.name)))
                            );
                            setTempService({
                              ...tempService,
                              imageUrl: [...(tempService.imageUrl || []), ...ids],
                            });
                          } finally {
                            setLoading(false);
                          }
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleSaveService} className="bg-blue-600 text-white px-4 py-2 rounded">
                        Save
                      </button>
                      <button onClick={handleCancelService} className="border px-4 py-2 rounded">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Products Section */}
          <div className="mt-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="h-8 w-1 bg-orange-600 rounded-full mr-3"></div>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                  Products
                </h3>
              </div>
              <button
                onClick={handleAddProduct}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add Product
              </button>
            </div>

            {businessData.products.length === 0 && isServicesProductsIncomplete() && (
              <WarningCard
                title="No Products Added"
                message="Add your products to showcase what you sell."
                actionText="Add Product"
                onAction={handleAddProduct}
                icon={<ShoppingBag className="w-5 h-5 text-amber-600" />}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {businessData.products.map((product) => {
                const isEditing = editingProduct === product.id;
                const displayProduct = isEditing && tempProduct ? tempProduct : product;
                return (
                  <div
                    key={product.id}
                    className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm"
                  >
                    {isEditing ? (
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Product name"
                          value={displayProduct.name}
                          onChange={(e) => setTempProduct({ ...displayProduct, name: e.target.value })}
                          className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                        />
                        <input
                          type="number"
                          placeholder="Price"
                          value={displayProduct.price || ''}
                          onChange={(e) => setTempProduct({ ...displayProduct, price: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                        />
                        <input
                          type="number"
                          placeholder="Stock"
                          value={displayProduct.stock || ''}
                          onChange={(e) => setTempProduct({ ...displayProduct, stock: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                        />
                        <textarea
                          placeholder="Product description"
                          value={displayProduct.description || ''}
                          onChange={(e) => setTempProduct({ ...displayProduct, description: e.target.value })}
                          rows={2}
                          className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                        />
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Images</h5>
                          <div className="grid grid-cols-2 gap-2">
                            {displayProduct.imageUrl?.map((img) => (
                              <div key={img} className="relative">
                                <ImageDisplay publicId={img} className="h-24 w-full object-cover rounded" />
                                <button
                                  onClick={async () => {
                                    await deleteFromCloudinary(img);
                                    setTempProduct({
                                      ...displayProduct,
                                      imageUrl: displayProduct.imageUrl?.filter((i) => i !== img) || [],
                                    });
                                  }}
                                  className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                          <input
                            type="file"
                            multiple
                            onChange={async (e) => {
                              if (!e.target.files) return;
                              setLoading(true);
                              try {
                                const files = Array.from(e.target.files);
                                const ids = await Promise.all(
                                  files.map((f) => uploadFileToCloudinary(f, createUniqueFileName(f.name)))
                                );
                                setTempProduct({
                                  ...displayProduct,
                                  imageUrl: [...(displayProduct.imageUrl || []), ...ids],
                                });
                              } finally {
                                setLoading(false);
                              }
                            }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button onClick={handleSaveProduct} className="bg-blue-600 text-white px-4 py-2 rounded">
                            Save
                          </button>
                          <button onClick={handleCancelProduct} className="border px-4 py-2 rounded">
                            Cancel
                          </button>
                          <button onClick={() => handleRemoveProduct(product.id)} className="text-red-500">
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-800 dark:text-white">
                            {product.name}
                          </h4>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingProduct(product.id);
                                setTempProduct({ ...product, imageUrl: product.imageUrl || [] });
                              }}
                              className="text-blue-600"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleRemoveProduct(product.id)} className="text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handlePromoteItem(product.id, "product")}
                              className={`text-xs px-2 py-1 rounded transition-colors ${
                                !isProfileComplete()
                                  ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                                  : "bg-orange-200 dark:bg-orange-600 text-orange-700 dark:text-orange-200 hover:bg-orange-300 dark:hover:bg-orange-500"
                              }`}
                              disabled={!isProfileComplete()}
                            >
                              Promote
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                          {product.description}
                        </p>
                        {product.imageUrl?.length ? (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {product.imageUrl.map((img) => (
                              <ImageDisplay key={img} publicId={img} className="h-20 w-full object-cover rounded" />
                            ))}
                          </div>
                        ) : null}
                        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                          {product.price && <span>₹{product.price}</span>}
                          {product.stock && <span>Stock: {product.stock}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {isNewProduct && tempProduct && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
                  {/* Edit form for new product */}
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Product name"
                      value={tempProduct.name}
                      onChange={(e) => setTempProduct({ ...tempProduct, name: e.target.value })}
                      className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={tempProduct.price || ''}
                      onChange={(e) => setTempProduct({ ...tempProduct, price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                    />
                    <input
                      type="number"
                      placeholder="Stock"
                      value={tempProduct.stock || ''}
                      onChange={(e) => setTempProduct({ ...tempProduct, stock: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                    />
                    <textarea
                      placeholder="Product description"
                      value={tempProduct.description || ''}
                      onChange={(e) => setTempProduct({ ...tempProduct, description: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:text-white"
                    />
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Images</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {tempProduct.imageUrl?.map((img) => (
                          <div key={img} className="relative">
                            <ImageDisplay publicId={img} className="h-24 w-full object-cover rounded" />
                            <button
                              onClick={async () => {
                                await deleteFromCloudinary(img);
                                setTempProduct({
                                  ...tempProduct,
                                  imageUrl: (tempProduct.imageUrl || []).filter((i) => i !== img),
                                });
                              }}
                              className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <input
                        type="file"
                        multiple
                        onChange={async (e) => {
                          if (!e.target.files) return;
                          setLoading(true);
                          try {
                            const files = Array.from(e.target.files);
                            const ids = await Promise.all(
                              files.map((f) => uploadFileToCloudinary(f, createUniqueFileName(f.name)))
                            );
                            setTempProduct({
                              ...tempProduct,
                              imageUrl: [...(tempProduct.imageUrl || []), ...ids],
                            });
                          } finally {
                            setLoading(false);
                          }
                        }}
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleSaveProduct} className="bg-blue-600 text-white px-4 py-2 rounded">
                        Save
                      </button>
                      <button onClick={handleCancelProduct} className="border px-4 py-2 rounded">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Overall completion warning if both services and products are missing */}
          {isServicesProductsIncomplete() && (
            <div className="mt-8 mb-16">
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
                <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
                  Profile Incomplete
                </h3>
                <p className="text-red-700 dark:text-red-300 mb-4">
                  Add at least one product or service to complete your
                  business profile and unlock announcements.
                </p>
                <button
                  onClick={handleAddService}
                  className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition-colors"
                >
                  Add Service/Product Now
                </button>
              </div>
            </div>
          )}
        </div>

        {isMobile && <Bottombar />}
      </div>

      {/* Statistics Modal */}
      {showStatisticsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full mx-4 h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-semibold text-gray-800 dark:text-white">
                Business Insights
              </h3>
              <button
                onClick={() => setShowStatisticsModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Placeholder for statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                  <span className="text-2xl font-bold text-blue-600">0</span>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-white">
                  Total Views
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  This month
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                  <span className="text-2xl font-bold text-green-600">0</span>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-white">
                  Engagement
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  This month
                </p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 p-6 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-8 h-8 text-purple-600" />
                  <span className="text-2xl font-bold text-purple-600">
                    {reviews.length}
                  </span>
                </div>
                <h4 className="font-semibold text-gray-800 dark:text-white">
                  Reviews
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Total received
                </p>
              </div>
            </div>

            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
                Detailed Analytics Coming Soon
              </h4>
              <p className="text-gray-500 dark:text-gray-400">
                We're working on comprehensive business insights for you.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Drawer */}
      {showGalleryDrawer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-end z-50">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md h-full overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                  Gallery
                </h3>
                <button
                  onClick={() => setShowGalleryDrawer(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-4">
              {businessData.gallery.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {businessData.gallery.map((imageId, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-lg overflow-hidden relative group"
                    >
                      <ImageDisplay
                        publicId={imageId}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => handleRemoveGallery(imageId)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Image className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-600 dark:text-gray-300 mb-2">
                    No Images Yet
                  </h4>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Add images to showcase your business.
                  </p>
                </div>
              )}
              <div className="mt-4">
                <button
                  onClick={() => fileInputGallery.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 w-full justify-center"
                >
                  <Plus className="w-4 h-4" />
                  Add Images
                </button>
                <input
                  type="file"
                  multiple
                  hidden
                  ref={fileInputGallery}
                  onChange={handleAddGallery}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NeighbourLinkBusiness;