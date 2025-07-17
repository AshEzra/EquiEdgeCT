import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";

interface Expert {
  id: string;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  location: string | null;
  profile_image_url: string | null;
}

interface ExpertSearchProps {
  placeholder?: string;
  className?: string;
  onExpertSelect?: (expert: Expert) => void;
}

const ExpertSearch = ({ 
  placeholder = "Search experts", 
  className = "",
  onExpertSelect 
}: ExpertSearchProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Expert[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search experts when query changes
  useEffect(() => {
    const searchExperts = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, bio, location, profile_image_url')
          .eq('is_expert', true)
          .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%`)
          .limit(8);

        if (error) {
          console.error('Error searching experts:', error);
          setSearchResults([]);
        } else {
          setSearchResults(data || []);
          setShowResults(true);
        }
      } catch (err) {
        console.error('Error searching experts:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(searchExperts, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setSelectedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && searchResults[selectedIndex]) {
        handleExpertSelect(searchResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowResults(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
    }
  };

  const handleExpertSelect = (expert: Expert) => {
    if (onExpertSelect) {
      onExpertSelect(expert);
    } else {
      navigate(`/expert/${expert.id}`);
    }
    setSearchQuery("");
    setShowResults(false);
    setSelectedIndex(-1);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setShowResults(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const getExpertName = (expert: Expert) => {
    const firstName = expert.first_name || '';
    const lastName = expert.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown Expert';
  };

  const getExpertImage = (expert: Expert) => {
    if (!expert.profile_image_url) {
      return '/api/placeholder/40/40';
    }
    
    if (expert.profile_image_url.startsWith('http')) {
      return expert.profile_image_url;
    }
    
    return expert.profile_image_url;
  };

  return (
    <div ref={searchRef} className={`relative hidden sm:block ${className}`}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => searchQuery.trim() && setShowResults(true)}
          className="w-full pl-10 pr-10 py-1.5 bg-background border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary text-sm placeholder:text-xs"
          style={{ fontSize: '0.92rem' }}
        />
        {searchQuery && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (searchResults.length > 0 || isSearching) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center text-sm text-gray-500">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mx-auto mb-2"></div>
              Searching...
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-1">
              {searchResults.map((expert, index) => (
                <button
                  key={expert.id}
                  onClick={() => handleExpertSelect(expert)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors ${
                    index === selectedIndex ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center overflow-hidden flex-shrink-0">
                    {expert.profile_image_url ? (
                      <img
                        src={getExpertImage(expert)}
                        alt={getExpertName(expert)}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/api/placeholder/40/40';
                        }}
                      />
                    ) : (
                      <span className="text-xs font-medium">
                        {getExpertName(expert).split(' ').map(n => n[0]).join('')}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900 truncate">
                      {getExpertName(expert)}
                    </div>
                    {expert.location && (
                      <div className="text-xs text-gray-500 truncate">
                        {expert.location}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-sm text-gray-500">
              No experts found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpertSearch; 