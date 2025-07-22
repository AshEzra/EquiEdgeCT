import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import equiLogo from "@/assets/equi-logo.png";
import { MessageCircle, User, LogOut, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ExpertSearch from "@/components/ExpertSearch";
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserProfile } from "@/contexts/UserProfileContext";

interface TopBarProps {
  showSearchBar?: boolean;
  onMessageClick?: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ showSearchBar = true, onMessageClick }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();

  return (
    <header className="bg-white border-b border-border">
      <div className="max-w-8xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Left - Logo */}
          <button 
            onClick={() => navigate('/experts')}
            className="flex items-center space-x-1.5 focus:outline-none"
          >
            <img src={equiLogo} alt="EquiEdge Logo" className="w-7 h-7 object-contain" />
            <span className="text-[1.01rem] font-normal tracking-tight text-gray-900 select-none">
              <span className="font-semibold">Equi</span><span className="font-extrabold" style={{ marginLeft: '1px' }}>Edge</span>
            </span>
          </button>
          {/* Center - Search (hidden on mobile) */}
          {showSearchBar && (
            <div className="hidden sm:flex flex-1 justify-center max-w-md mx-8">
              <ExpertSearch 
                placeholder="Search experts"
                className="w-full"
              />
            </div>
          )}
          {/* Right - Messages and User Menu */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            {/* Message Icon with Badge */}
            <button
              onClick={onMessageClick || (() => navigate('/messages'))}
              className="relative flex items-center justify-center p-0 bg-transparent border-0 focus:outline-none"
              style={{ minWidth: 30 }}
            >
              <span className="flex items-center justify-center">
                {/* New envelope/message icon */}
                <svg width="20" height="20" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2.5" y="5.5" width="17" height="11" rx="1.5" fill="white" stroke="#1877F6" strokeWidth="1.7"/>
                  <path d="M4 7l7 5 7-5" stroke="#1877F6" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </span>
            </button>
            {/* Divider */}
            <div className="h-8 w-px bg-gray-200 mx-1.5" />
            {/* User Avatar and Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="flex items-center space-x-0.5 cursor-pointer select-none">
                  <span className="w-7 h-7 flex items-center justify-center rounded-full bg-black">
                    <span className="text-xs font-semibold text-white">
                      {user?.email?.charAt(0).toUpperCase() || <User className="h-4 w-4 text-white" />}
                    </span>
                  </span>
                  <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {profile?.is_expert && (
                  <DropdownMenuItem onClick={() => navigate('/manage-profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Manage Profile
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar; 