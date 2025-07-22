import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import equiLogo from "@/assets/equi-logo.png";
import { MessageCircle, User, LogOut, ChevronDown, Send } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import ExpertSearch from "@/components/ExpertSearch";
import { useQuery } from '@tanstack/react-query';
import { useUserProfile } from "@/contexts/UserProfileContext";

// Type for expert data from Supabase
interface Expert {
  id: string;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  starting_price: number | null;
  location: string | null;
  profile_image_url: string | null;
  preview_image_url: string | null;
  is_expert: boolean;
  expert_rank: number | null;
}

// Type for category data from Supabase
interface Category {
  id: string;
  name: string;
  description: string | null;
  sort_order?: number; // Make optional since it might not be in all queries
}

// Type for expert-category associations
interface ExpertCategoryAssociation {
  id: string;
  expert_id: string;
  category_id: string;
  created_at: string;
}

// Add this type near the top of the file, after the other interfaces
type ExpertSuggestionInsert = {
  name: string;
  reason: string;
  submitted_by: string | null;
  category: string | null;
};

const ExpertMarketplace = () => {
  const [selectedCategory, setSelectedCategory] = useState('All Experts');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestedExpertName, setSuggestedExpertName] = useState('');
  const [suggestedExpertReason, setSuggestedExpertReason] = useState('');
  const [isSubmittingSuggestion, setIsSubmittingSuggestion] = useState(false);
  const navigate = useNavigate();
  const { user, session, signOut } = useAuth();
  const { profile, isLoading: isProfileLoading, isError: isProfileError } = useUserProfile();

  // Fetch experts from Supabase
  const {
    data: experts = [],
    isLoading: isExpertsLoading,
    isError: isExpertsError,
    error: expertsErrorObj,
  } = useQuery({
    queryKey: ['experts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_expert', true)
        .order('expert_rank', { ascending: true });
      if (error) throw new Error(error.message);
      return data as Expert[];
    },
  });

  // Fetch categories from Supabase
  const {
    data: categories = [],
    isLoading: isCategoriesLoading,
    isError: isCategoriesError,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expert_categories')
        .select('*')
        .order('sort_order');
      if (error) throw new Error(error.message);
      return data as Category[];
    },
  });

  // Fetch expert-category associations
  const {
    data: expertCategories = [],
    isLoading: isAssociationsLoading,
    isError: isAssociationsError,
  } = useQuery({
    queryKey: ['expertCategories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expert_category_associations')
        .select('*');
      if (error) throw new Error(error.message);
      return data as ExpertCategoryAssociation[];
    },
  });

  // Loading and error states
  const loading = isExpertsLoading || isCategoriesLoading || isAssociationsLoading;
  const error =
    isExpertsError || isCategoriesError || isAssociationsError
      ? (expertsErrorObj?.message || 'Failed to load experts. Please try again.')
      : null;

  // Immediate connection test
  useEffect(() => {
    const testConnection = async () => {
      // console.log('=== SUPABASE CONNECTION TEST ===');
      // console.log('Testing basic connection...');
      
      try {
        const { data, error } = await supabase.from('profiles').select('count').limit(1);
        // console.log('Basic connection test:', { data, error });
      } catch (err) {
        // console.error('Connection test failed:', err);
      }
    };
    
    testConnection();
  }, []);

  const filteredExperts = experts.filter(expert => {
    const fullName = `${expert.first_name || ''} ${expert.last_name || ''}`.trim();
    
    // Category filtering using expert_category_associations table
    let matchesCategory = false;
    
    if (selectedCategory === 'All Experts') {
      matchesCategory = true;
    } else {
      // Find the category ID for the selected category
      const selectedCategoryData = categories.find(cat => cat.name === selectedCategory);
      
      if (selectedCategoryData) {
        // Check if this expert has an association with the selected category
        const hasAssociation = expertCategories.some(association => 
          association.expert_id === expert.id && 
          association.category_id === selectedCategoryData.id
        );
        
        matchesCategory = hasAssociation;
        
        // console.log(`Expert: ${fullName}, Category: ${selectedCategory}, Has Association: ${hasAssociation}`);
      } else {
        // console.log(`Category "${selectedCategory}" not found in database`);
      }
    }
    
    const matchesSearch = fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (expert.bio && expert.bio.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // console.log(`Expert: ${fullName}, Category: ${selectedCategory}, Matches: ${matchesCategory}, Search: ${matchesSearch}`);
    
    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    // Sort by expert_rank in ascending order (1 comes first)
    const rankA = a.expert_rank || Number.MAX_SAFE_INTEGER;
    const rankB = b.expert_rank || Number.MAX_SAFE_INTEGER;
    return rankA - rankB;
  });

  const handleExpertClick = (expertId: string) => {
    navigate(`/expert/${expertId}`);
  };

  const handleMessagesClick = () => {
    navigate('/messages');
  };

  const handleExpertSuggestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!suggestedExpertName.trim() || !suggestedExpertReason.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in both the expert name and reason.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmittingSuggestion(true);
    
    try {
      // Insert suggestion into Supabase
      type InsertResult = { error: unknown };
      const { error } = await (supabase as typeof supabase & { from: (table: string) => { insert: (values: ExpertSuggestionInsert[]) => Promise<InsertResult> } }).from('expert_suggestions').insert([
        {
          name: suggestedExpertName.trim(),
          reason: suggestedExpertReason.trim(),
          submitted_by: user?.id || null,
          category: selectedCategory !== 'All Experts' ? selectedCategory : null,
        }
      ]);
      if (error) throw error;

      toast({
        title: "Suggestion Submitted!",
        description: "Thank you for your suggestion. We'll review it and get back to you.",
      });
      
      // Clear the form
      setSuggestedExpertName('');
      setSuggestedExpertReason('');
      
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your suggestion. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingSuggestion(false);
    }
  };

  // Helper function to get expert's full name
  const getExpertName = (expert: Expert) => {
    const firstName = expert.first_name || '';
    const lastName = expert.last_name || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown Expert';
  };

  // Helper function to get expert's display image
  const getExpertImage = (expert: Expert) => {
    // Use preview_image_url for marketplace display (with type assertion since types are outdated)
    const previewImageUrl = expert.preview_image_url;
    
    if (!previewImageUrl) {
      return '/api/placeholder/200/200';
    }
    
    // If it's already a full URL, use it
    if (previewImageUrl.startsWith('http')) {
      return previewImageUrl;
    }
    
    // If it's a relative path, assume it's from Supabase storage
    if (previewImageUrl.startsWith('/')) {
      return previewImageUrl;
    }
    
    // Default fallback
    return '/api/placeholder/200/200';
  };

  return (
    <div className="min-h-screen bg-background scrollbar-hide">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="max-w-8xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Left - Logo */}
            <button 
              onClick={() => navigate('/experts')}
              className="flex items-center space-x-1.5 focus:outline-none"
            >
              <img src={equiLogo} alt="EquiEdge Logo" className="w-7 h-7 object-contain" loading="lazy" />
              <span className="text-[1.01rem] font-normal tracking-tight text-gray-900 select-none">
              <span className="font-semibold">Equi</span><span className="font-extrabold" style={{ marginLeft: '1px' }}>Edge</span>
              </span>
            </button>
            
            {/* Center - Search (hidden on mobile) */}
            <div className="hidden sm:flex flex-1 justify-center max-w-md mx-8">
              <ExpertSearch 
                placeholder="Search experts"
                className="w-full"
              />
            </div>

            {/* Right - Messages and User Menu */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              {/* Message Icon with Badge */}
              <button
                onClick={handleMessagesClick}
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

      {/* Category Filters */}
      <div className="bg-background">
        <div className="max-w-8xl mx-auto px-2 sm:px-4 lg:px-6 py-4">
          <div className="overflow-x-auto scrollbar-hide py-1">
            <div className="flex gap-2 min-w-max">
              <Button
                key="All Experts"
                variant={selectedCategory === 'All Experts' ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedCategory('All Experts')}
                className={`rounded-full whitespace-nowrap px-2 py-1 text-xs h-7 ${
                  selectedCategory === 'All Experts' 
                    ? "bg-black text-white hover:bg-gray-800 shadow-none" 
                    : "bg-white-100 text-gray-500 hover:bg-gray-200 border border-gray-300"
                }`}
              >
                All Experts
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.name ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedCategory(category.name)}
                  className={`rounded-full whitespace-nowrap px-2 py-1 text-xs h-7 ${
                    selectedCategory === category.name 
                      ? "bg-black text-white hover:bg-gray-800 shadow-none" 
                      : "bg-white-100 text-gray-500 hover:bg-gray-200 border border-gray-300"
                  }`}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Hero Section - Only show when there are experts */}
        {!loading && !error && filteredExperts.length > 0 && (
          <div className="text-left mb-8">
            <h1 className="text-xl md:text-2xl font-semibold text-foreground mb-4 text-left break-words max-w-full">
              Choose an expert.  Book a session.  Accelerate your success.
            </h1>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading experts...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              size="sm"
            >
              Try Again
            </Button>
          </div>
        )}

        {/* Expert Grid */}
        {!loading && !error && filteredExperts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-5 gap-4">
          {filteredExperts.map((expert) => (
            <Card 
              key={expert.id}
              className="cursor-pointer hover:shadow-lg transition-all duration-300 group overflow-hidden"
              onClick={() => handleExpertClick(expert.id)}
            >
              <CardContent className="p-0">
                <div className="aspect-[3/4] bg-muted relative overflow-hidden">
                    <img 
                      src={getExpertImage(expert)} 
                      alt={getExpertName(expert)}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        // console.log('Image failed to load for:', getExpertName(expert), 'URL:', target.src);
                        target.src = '/api/placeholder/200/200';
                      }}
                      onLoad={() => {
                        // console.log('Image loaded successfully for:', getExpertName(expert));
                      }}
                    />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                </div>
                <div className="p-1.5">
                    <h3 className="text-sm font-bold leading-tight text-foreground mb-0">
                      {getExpertName(expert)}
                    </h3>
                  <div className="mb-.5">
                    <span className="text-muted-foreground text-xs font-regular">
                        Starting at ${expert.starting_price || 0}/session
                    </span>
                  </div>
                  <p className="text-muted-foreground text-xs mb-1 line-clamp-2">
                      {expert.bio || 'No bio available'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        )}

        {!loading && !error && filteredExperts.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-m font-medium mb-10">
              Top experts are coming soon to this category. Have someone in mind? Let us know below!
            </p>
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
                <div className="text-center mb-6">
                  <div className="w-14 h-14 flex items-center justify-center mx-auto mb-1">
                    <img src={equiLogo} alt="EquiEdge Logo" className="w-12 h-12 object-contain" loading="lazy" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">Suggest an Expert</h3>
                  <p className="text-gray-600 text-xs">Help us bring the best experts to our platform</p>
                </div>
                
                <form onSubmit={handleExpertSuggestion} className="space-y-4">
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder=""
                      value={suggestedExpertName}
                      onChange={e => setSuggestedExpertName(e.target.value)}
                      disabled={isSubmittingSuggestion}
                      required
                      className="w-full h-10 bg-white border-2 border-gray-200 rounded-lg px-3 text-gray-900 placeholder-transparent focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-sm"
                    />
                    <label className="absolute left-3 top-1 text-xs font-medium text-gray-500 transition-all duration-300 pointer-events-none">
                      Expert's Name
                    </label>
                  </div>
                  
                  <div className="relative">
                    <Textarea
                      placeholder=""
                      value={suggestedExpertReason}
                      onChange={e => setSuggestedExpertReason(e.target.value)}
                      disabled={isSubmittingSuggestion}
                      required
                      className="w-full min-h-[80px] bg-white border-2 border-gray-200 rounded-lg px-3 py-2 text-gray-900 placeholder-transparent focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 text-sm resize-none"
                    />
                    <label className="absolute left-3 top-2 text-xs font-medium text-gray-500 transition-all duration-300 pointer-events-none">
                      Why do you want to see this expert on the platform?
                    </label>
                  </div>
                  
                  <Button
                    type="submit"
                    disabled={isSubmittingSuggestion}
                    className="w-full h-10 bg-gradient-to-r from-blue-900 to-blue-950 hover:from-blue-950 hover:to-slate-900 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {isSubmittingSuggestion ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-3 h-3" />
                        Submit
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ExpertMarketplace;