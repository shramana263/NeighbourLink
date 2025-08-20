import React from 'react';
import { MapPin, Eye, MessageCircle, MoreVertical } from 'lucide-react';
import { Pandal } from './data/pandalData';

interface PandalCardProps {
  pandal: Pandal;
  onContactClick?: (pandal: Pandal) => void;
}

const PandalCard: React.FC<PandalCardProps> = ({ pandal, onContactClick }) => {
  return (
    <div className="group">
      {/* Glassmorphism Card */}
      <div className="backdrop-blur-md bg-white/15 border border-white/20 rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:bg-white/20 hover:border-white/30">
        {/* Card Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            {/* Avatar */}
            <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-semibold text-sm">
                {pandal.avatar}
              </span>
            </div>
            {/* Name */}
            <div>
              <h3 className="text-white font-semibold text-lg leading-tight">
                {pandal.name}
              </h3>
            </div>
          </div>
          {/* Menu Button */}
          <button className="text-white/70 hover:text-white transition-colors">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>

        {/* Pandal Image Placeholder */}
        <div className="w-full h-32 bg-gradient-to-br from-gray-400/30 to-gray-600/30 rounded-xl mb-4 flex items-center justify-center backdrop-blur-sm border border-white/10">
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-2 opacity-40">
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-white">
                <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mb-4">
          <p className="text-white/90 text-sm leading-relaxed line-clamp-3 overflow-hidden">
            {pandal.description}
          </p>
        </div>

        {/* Location */}
        <div className="flex items-center text-white/80 mb-6">
          <MapPin className="h-4 w-4 mr-2" />
          <span className="text-sm">{pandal.location}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <button className="flex-1 backdrop-blur-sm bg-white/20 hover:bg-white/30 border border-white/30 hover:border-white/40 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>View Map</span>
          </button>
          
          <button 
            className="flex-1 backdrop-blur-sm bg-purple-500/30 hover:bg-purple-500/40 border border-purple-400/30 hover:border-purple-400/40 text-white text-sm font-medium py-2.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center space-x-2"
            onClick={() => onContactClick?.(pandal)}
          >
            <MessageCircle className="h-4 w-4" />
            <span>Contact</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default PandalCard;
