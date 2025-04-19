import { ImageDisplay } from '@/components/AWS/UploadFile';
import { auth, db } from '@/firebase';
import { collection, deleteDoc, doc, getDocs, orderBy, query, Timestamp } from 'firebase/firestore';
import React, { useEffect, useState, useRef } from 'react';
import { MoreVertical } from 'lucide-react';

export interface BaseItem {
    id?: string;
    createdAt: string;
    description: string;
    duration: string;
    title?: string;
    userId: string;
    visibilityRadius: string;
    images?: string[];
    type: 'resource' | 'promotion' | 'event' | 'update';
}

export interface Resource extends BaseItem {
    category: string;
    urgency: string;
}

export interface Promotion extends BaseItem {
    contactInfo: {
        contact: string;
        email: string;
        name: string;
        description: string;
    };
    responders: {
        title: string;
        useProfileLocation: boolean;
    };
}

export interface Event extends BaseItem {
    eventType: string;
    isRegistrationRequired: boolean;
    organizerDetails: {
        contact: string;
        email: string;
        name: string;
    };
    timingInfo: {
        date: string;
        duration: string;
        time: string;
    };
    responders: {
        title: string;
        useProfileLocation: boolean;
    };
}

export interface Update extends BaseItem {
    date: string;
    responders: {
        title: string;
        useProfileLocation: boolean;
    };
}

export type FeedItem = Resource | Promotion | Event | Update;

const convertDoc = <T extends BaseItem>(doc: any, type: FeedItem['type']): T => {
    const data = doc.data();
    return {
        ...data,
        id: doc.id,
        type,
        createdAt: data.createdAt instanceof Timestamp
            ? data.createdAt.toDate().toISOString()
            : data.createdAt
    } as T;
};

export const fetchResources = async (): Promise<Resource[]> => {
    const resourcesRef = collection(db, "resources");
    const q = query(resourcesRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    console.log(querySnapshot.docs.map(doc => convertDoc<Resource>(doc, 'resource')))
    return querySnapshot.docs.map(doc => convertDoc<Resource>(doc, 'resource'));
};

export const fetchPromotions = async (): Promise<Promotion[]> => {
    const promotionsRef = collection(db, "promotions");
    const q = query(promotionsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertDoc<Promotion>(doc, 'promotion'));
};

export const fetchEvents = async (): Promise<Event[]> => {
    const eventsRef = collection(db, "events");
    const q = query(eventsRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertDoc<Event>(doc, 'event'));
};

export const fetchUpdates = async (): Promise<Update[]> => {
    const updatesRef = collection(db, "updates");
    const q = query(updatesRef, orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => convertDoc<Update>(doc, 'update'));
};

export const fetchAllFeedItems = async (): Promise<FeedItem[]> => {
    try {
        const [resources, promotions, events, updates] = await Promise.all([
            fetchResources(),
            fetchPromotions(),
            fetchEvents(),
            fetchUpdates()
        ]);

        const allItems: FeedItem[] = [...resources, ...promotions, ...events, ...updates];
        return allItems.sort((a, b) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
    } catch (error) {
        console.error("Error fetching feed items:", error);
        throw error;
    }
};

export const Feed: React.FC = () => {
    // const user = auth.currentUser;
    const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const handleDeleteItem = async (id: string, type: FeedItem['type']) => {
        try {
            let collectionName: string;
            switch (type) {
                case 'resource': collectionName = 'resources'; break;
                case 'promotion': collectionName = 'promotions'; break;
                case 'event': collectionName = 'events'; break;
                case 'update': collectionName = 'updates'; break;
                default: return;
            }
            await deleteDoc(doc(db, collectionName, id));
            setFeedItems(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error('Error deleting item:', error);
        }
    };

    useEffect(() => {
        const loadFeedItems = async () => {
            try {
                setLoading(true);
                const items = await fetchAllFeedItems();
                setFeedItems(items);
                setError(null);
            } catch (err) {
                console.error('Failed to fetch feed items:', err);
                setError('Failed to load feed. Please try again later.');
            } finally {
                setLoading(false);
            }
        };
        loadFeedItems();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-300 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">Error!</strong>
                <span className="block sm:inline"> {error}</span>
            </div>
        );
    }

    return (
        <div className="container w-full sm:w-[550px] mt-16 mx-auto px-4 py-8 bg-transparent">
            <div className="space-y-4">
                {feedItems.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No feed items to display.</p>
                ) : (
                    feedItems.map((item) => {
                        switch (item.type) {
                            case 'resource':
                                return <ResourceCard key={item.id} resource={item as Resource} onDelete={handleDeleteItem} />;
                            case 'promotion':
                                return <PromotionCard key={item.id} promotion={item as Promotion} onDelete={handleDeleteItem} />;
                            case 'event':
                                return <EventCard key={item.id} event={item as Event} onDelete={handleDeleteItem} />;
                            case 'update':
                                return <UpdateCard key={item.id} update={item as Update} onDelete={handleDeleteItem} />;
                            default:
                                return null;
                        }
                    })
                )}
            </div>
        </div>
    );
};

interface CardBaseProps {
    onDelete: (id: string, type: FeedItem['type']) => void;
}

interface ResourceCardProps extends CardBaseProps {
    resource: Resource;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource, onDelete }) => {
    const user = auth.currentUser;
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const totalImages = resource.images?.length || 0;
    const isOwner = user?.uid === resource.userId;

    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setShowMenu(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNext = () => setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    const handlePrev = () => setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);

    const handleDelete = () => {
        onDelete(resource.id!, 'resource');
        setShowMenu(false);
    };

    return (
        <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md border-l-4 ${resource.urgency == "high" ? "border-red-500 " : "border-blue-500 "} overflow-hidden mb-4`}>
            {resource.images && resource.images.length > 0 && (
                <div className="relative w-full h-72 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    {resource.images.map((image, index) => (
                        <div
                            key={image}
                            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <div className="w-full h-full object-cover overflow-hidden">
                                <ImageDisplay objectKey={image} />
                            </div>
                        </div>
                    ))}
                    {totalImages > 1 && (
                        <>
                            <button
                                onClick={handlePrev}
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-1 rounded-full hover:bg-black/50 z-10"
                            >
                                ←
                            </button>
                            <button
                                onClick={handleNext}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-1 rounded-full hover:bg-black/50 z-10"
                            >
                                →
                            </button>
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 z-10">
                                {resource.images.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
            <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                    <div className='flex w-full justify-between'>

                        <span className={`inline-block px-2 py-1 text-xs font-semibold ${resource.urgency == "high" ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200" : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"} rounded-full`}>
                            Resource: {resource.category}

                        </span>
                        {
                            resource.urgency == "high" && (
                                <span className={`inline-block px-2 py-1 text-xs font-semibold ${resource.urgency == "high" ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200" : "bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"} rounded-full`}>
                                    Emergency

                                </span>
                            )
                        }

                    </div>

                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1"
                        >
                            <MoreVertical className="h-5 w-5" />
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-700 overflow-hidden rounded-md shadow-lg py-1 ">
                                <button
                                    className="block w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"

                                >
                                    View Details
                                </button>
                                {
                                    isOwner && (
                                        <>
                                            {/* <button
                                                className="block w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                                                onClick={() => console.log('Edit:', resource.id)}
                                            >
                                                Edit
                                            </button> */}
                                            <button
                                                className="block w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                                                onClick={handleDelete}
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )
                                }
                            </div>
                        )}
                    </div>

                </div>
                <h3 className="text-md font-semibold text-gray-900 dark:text-white">{resource.title || 'Resource'}</h3>
                <p className="text-xs font-light text-gray-600 dark:text-gray-300 mt-1">{resource.description}</p>
                <div className="flex items-center mt-3 text-[10px] text-gray-500 dark:text-gray-400">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span>Duration: {resource.duration}</span>
                </div>
                <div className="flex gap-2 items-center text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                    <span>Posted: {new Date(resource.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
        </div>
    );
};

interface PromotionCardProps extends CardBaseProps {
    promotion: Promotion;
}

export const PromotionCard: React.FC<PromotionCardProps> = ({ promotion, onDelete }) => {
    const user = auth.currentUser;
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const totalImages = promotion.images?.length || 0;
    const isOwner = user?.uid === promotion.userId;

    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setShowMenu(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNext = () => setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    const handlePrev = () => setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);

    const handleDelete = () => {
        onDelete(promotion.id!, 'promotion');
        setShowMenu(false);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-l-4 border-purple-500 overflow-hidden mb-4">
            {promotion.images && promotion.images.length > 0 && (
                <div className="relative w-full h-72 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    {promotion.images.map((image, index) => (
                        <div
                            key={image}
                            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <div className="w-full h-full flex justify-center items-center object-cover overflow-hidden">
                                <ImageDisplay objectKey={image} />
                            </div>
                        </div>
                    ))}
                    {totalImages > 1 && (
                        <>
                            <button
                                onClick={handlePrev}
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-1 rounded-full hover:bg-black/50 z-10"
                            >
                                ←
                            </button>
                            <button
                                onClick={handleNext}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-1 rounded-full hover:bg-black/50 z-10"
                            >
                                →
                            </button>
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 z-10">
                                {promotion.images.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
            <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="inline-block px-2 py-1 text-xs font-semibold bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full">
                        Promotion
                    </span>

                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1"
                        >
                            <MoreVertical className="h-5 w-5" />
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-700 overflow-hidden rounded-md shadow-lg py-1 z-20">
                                <button
                                    className="block w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                                >
                                    View Details
                                </button>
                                {
                                    isOwner && (
                                        <>
                                            {/* <button
                                                className="block w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                                                onClick={() => console.log('Edit:', promotion.id)}
                                            >
                                                Edit
                                            </button> */}
                                            <button
                                                className="block w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                                                onClick={handleDelete}
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )
                                }
                            </div>
                        )}
                    </div>

                </div>
                <h3 className="text-md font-semibold text-gray-900 dark:text-white">
                    {promotion.responders?.title || 'Promotion'}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                    {promotion.description}
                </p>
                <div className="mt-3 text-[10px]">
                    <p className="text-gray-700 dark:text-gray-300">
                        Contact: {promotion.contactInfo?.name}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                        Email: {promotion.contactInfo?.email}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                        Phone: {promotion.contactInfo?.contact}
                    </p>
                    <div className="flex items-center mt-2 text-gray-500 dark:text-gray-400">
                        <span>Posted: {new Date(promotion.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

interface EventCardProps extends CardBaseProps {
    event: Event;
}

export const EventCard: React.FC<EventCardProps> = ({ event, onDelete }) => {
    const user = auth.currentUser;
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const totalImages = event.images?.length || 0;
    const isOwner = user?.uid === event.userId;

    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setShowMenu(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNext = () => setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    const handlePrev = () => setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);

    const handleDelete = () => {
        onDelete(event.id!, 'event');
        setShowMenu(false);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-l-4 border-green-500 overflow-hidden mb-4">
            {event.images && event.images.length > 0 && (
                <div className="relative w-full h-72 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    {event.images.map((image, index) => (
                        <div
                            key={image}
                            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <div className="w-full h-full flex justify-center items-center object-cover overflow-hidden">
                                <ImageDisplay objectKey={image} />
                            </div>
                        </div>
                    ))}
                    {totalImages > 1 && (
                        <>
                            <button
                                onClick={handlePrev}
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-1 rounded-full hover:bg-black/50 z-10"
                            >
                                ←
                            </button>
                            <button
                                onClick={handleNext}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-1 rounded-full hover:bg-black/50 z-10"
                            >
                                →
                            </button>
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 z-10">
                                {event.images.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
            <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                        Event: {event.eventType}
                    </span>

                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1"
                        >
                            <MoreVertical className="h-5 w-5" />
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-700 overflow-hidden rounded-md shadow-lg py-1 z-20">
                                <button
                                    className="block w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"

                                >
                                    View Details
                                </button>
                                {
                                    isOwner && (
                                        <>
                                            {/* <button
                                                className="block w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                                                onClick={() => console.log('Edit:', event.id)}
                                            >
                                                Edit
                                            </button> */}
                                            <button
                                                className="block w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                                                onClick={handleDelete}
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )
                                }

                            </div>
                        )}
                    </div>

                </div>
                <h3 className="text-md font-semibold text-gray-900 dark:text-white">{event.title || 'Event'}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{event.description}</p>
                <div className="mt-3 text-[10px]">
                    <div className="flex items-center text-gray-700 dark:text-gray-300">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                        </svg>
                        <span>Date: {event.timingInfo?.date} - Time: {event.timingInfo?.time}</span>
                    </div>
                    <div className="flex items-center text-gray-700 dark:text-gray-300 mt-1">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>Duration: {event.timingInfo?.duration}</span>
                    </div>
                    <div className="flex items-center text-gray-700 dark:text-gray-300 mt-1">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        <span>Organizer: {event.organizerDetails?.name}</span>
                    </div>
                    <div className="text-gray-500 dark:text-gray-400 mt-2">Posted: {new Date(event.createdAt).toLocaleDateString()}</div>
                </div>
            </div>
        </div>
    );
};

interface UpdateCardProps extends CardBaseProps {
    update: Update;
}

export const UpdateCard: React.FC<UpdateCardProps> = ({ update, onDelete }) => {
    const user = auth.currentUser;
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const totalImages = update.images?.length || 0;
    const isOwner = user?.uid === update.userId;

    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setShowMenu(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNext = () => setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    const handlePrev = () => setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);

    const handleDelete = () => {
        onDelete(update.id!, 'update');
        setShowMenu(false);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border-l-4 border-amber-500 overflow-hidden mb-4">
            {update.images && update.images.length > 0 && (
                <div className="relative w-full h-72 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    {update.images.map((image, index) => (
                        <div
                            key={image}
                            className={`absolute inset-0 transition-opacity duration-500 ease-in-out ${index === currentImageIndex ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <div className="w-full h-full flex justify-center items-center object-cover overflow-hidden">
                                <ImageDisplay objectKey={image} />
                            </div>
                        </div>
                    ))}
                    {totalImages > 1 && (
                        <>
                            <button
                                onClick={handlePrev}
                                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-1 rounded-full hover:bg-black/50 z-10"
                            >
                                ←
                            </button>
                            <button
                                onClick={handleNext}
                                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 text-white p-1 rounded-full hover:bg-black/50 z-10"
                            >
                                →
                            </button>
                            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 z-10">
                                {update.images.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`w-2 h-2 rounded-full transition-colors duration-300 ${index === currentImageIndex ? 'bg-white' : 'bg-white/50'}`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}
            <div className="p-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="inline-block px-2 py-1 text-xs font-semibold bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 rounded-full">
                        Update
                    </span>

                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1"
                        >
                            <MoreVertical className="h-5 w-5" />
                        </button>
                        {showMenu && (
                            <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-700 overflow-hidden rounded-md shadow-lg py-1 z-20">
                                <button
                                    className="block w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                                >
                                    View Details
                                </button>
                                {
                                    isOwner && (
                                        <>
                                            {/* <button
                                                className="block w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600"
                                                onClick={() => console.log('Edit:', update.id)}
                                            >
                                                Edit
                                            </button> */}
                                            <button
                                                className="block w-full px-4 py-2 text-sm text-left text-red-600 hover:bg-gray-100 dark:hover:bg-gray-600"
                                                onClick={handleDelete}
                                            >
                                                Delete
                                            </button>
                                        </>
                                    )
                                }

                            </div>
                        )}
                    </div>

                </div>
                <h3 className="text-md font-semibold text-gray-900 dark:text-white">{update.responders?.title || 'Update'}</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{update.description}</p>
                <div className="mt-3 text-[10px] text-gray-500 dark:text-gray-400">
                    {update.date && <span>Update Date: {new Date(update.date).toLocaleDateString()}</span>}
                    <div className="mt-1">Posted: {new Date(update.createdAt).toLocaleDateString()}</div>
                </div>
            </div>
        </div>
    );
};

export default Feed;