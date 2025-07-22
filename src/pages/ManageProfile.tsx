import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import equiLogo from "@/assets/equi-logo.png";
import { ArrowLeft, Save, User, LogOut, ChevronDown, Plus, Trash2, Edit } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import ExpertSearch from "@/components/ExpertSearch";
import ReactSelect from 'react-select';
import emojiFlags from 'emoji-flags';
import { useUserProfile } from "@/contexts/UserProfileContext";

interface ProfileData {
  id: string;
  user_id: string | null;
  first_name: string | null;
  last_name: string | null;
  bio: string | null;
  location: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  profile_bio: string | null;
  is_expert: boolean;
  expert_id?: string | null;
  home_country?: string | null;
}

interface ExpertService {
  id: string;
  title: string;
  service_type: string;
  description: string | null;
  price: number;
  availability_slots: number;
  is_active: boolean;
  expert_id: string;
  created_at: string;
  updated_at: string;
}

interface ExpertVideo {
  id: string;
  expert_id: string;
  url: string;
  created_at: string | null;
}

const ManageProfile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const isMobile = useIsMobile();
  const { profile, isLoading, isError } = useUserProfile();
  const [services, setServices] = useState<ExpertService[]>([]);
  const [videos, setVideos] = useState<ExpertVideo[]>([]);
  const [editingService, setEditingService] = useState<ExpertService | null>(null);
  const [editingVideo, setEditingVideo] = useState<ExpertVideo | null>(null);
  const [showAddService, setShowAddService] = useState(false);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [editingVideoUrl, setEditingVideoUrl] = useState("");

  // Form state
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    bio: "",
    location: "",
    instagram_url: "",
    facebook_url: "",
    linkedin_url: "",
    profile_bio: "",
    home_country: "",
  });

  // Service form state
  const [serviceFormData, setServiceFormData] = useState({
    service_type: "",
    title: "",
    description: "",
    price: "",
    availability_slots: "",
  });

  // Initialize formData when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        bio: profile.bio || "",
        location: profile.location || "",
        instagram_url: profile.instagram_url || "",
        facebook_url: profile.facebook_url || "",
        linkedin_url: profile.linkedin_url || "",
        profile_bio: profile.profile_bio || "",
        home_country: profile.home_country || "",
      });
    }
  }, [profile]);

  // Fetch expert services and videos when profile is loaded and is_expert
  useEffect(() => {
    if (profile && profile.is_expert) {
      // Fetch expert services
      supabase
        .from('expert_services')
        .select('*')
        .eq('expert_id', profile.id)
        .order('created_at', { ascending: false })
        .then(({ data: servicesData, error: servicesError }) => {
          if (!servicesError) setServices(servicesData || []);
        });
      // Fetch expert videos
      supabase
        .from('expert_videos')
        .select('*')
        .eq('expert_id', profile.id)
        .order('created_at', { ascending: false })
        .then(({ data: videosData, error: videosError }) => {
          if (!videosError) setVideos(videosData || []);
        });
    }
  }, [profile]);

  // Loading and error guards
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }
  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Error loading profile</h1>
          <p className="text-muted-foreground mb-4">There was an error loading your profile. Please try again later.</p>
        </div>
      </div>
    );
  }
  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">No profile found</h1>
          <p className="text-muted-foreground mb-4">We could not find your profile. Please contact support.</p>
        </div>
      </div>
    );
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleServiceInputChange = (field: string, value: string) => {
    setServiceFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: formData.first_name,
          last_name: formData.last_name,
          bio: formData.bio,
          location: formData.location,
          instagram_url: formData.instagram_url,
          facebook_url: formData.facebook_url,
          linkedin_url: formData.linkedin_url,
          profile_bio: formData.profile_bio,
          home_country: formData.home_country,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (error) {
        console.error('Error updating profile:', error);
        toast({
          title: "Error",
          description: "Failed to save profile changes",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: "Error",
        description: "Failed to save profile changes",
        variant: "destructive",
      });
    }
  };

  const handleServiceTypeChange = (value: string) => {
    const selectedOption = serviceTypeOptions.find(option => option.value === value);
    setServiceFormData(prev => ({
      ...prev,
      service_type: value,
      title: selectedOption?.title || "",
    }));
  };

  const handleAddService = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('expert_services')
        .insert({
          expert_id: profile.id,
          title: serviceFormData.title,
          service_type: serviceFormData.service_type,
          description: serviceFormData.description || null,
          price: parseFloat(serviceFormData.price),
          availability_slots: parseInt(serviceFormData.availability_slots),
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding service:', error);
        toast({
          title: "Error",
          description: "Failed to add service",
          variant: "destructive",
        });
        return;
      }

      setServices(prev => [data, ...prev]);
      setShowAddService(false);
      setServiceFormData({
        service_type: "",
        title: "",
        description: "",
        price: "",
        availability_slots: "",
      });

      toast({
        title: "Success",
        description: "Service added successfully",
      });
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: "Error",
        description: "Failed to add service",
        variant: "destructive",
      });
    }
  };

  const handleUpdateService = async () => {
    if (!editingService) return;

    try {
      const { error } = await supabase
        .from('expert_services')
        .update({
          title: serviceFormData.title,
          service_type: serviceFormData.service_type,
          description: serviceFormData.description || null,
          price: parseFloat(serviceFormData.price),
          availability_slots: parseInt(serviceFormData.availability_slots),
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingService.id);

      if (error) {
        console.error('Error updating service:', error);
        toast({
          title: "Error",
          description: "Failed to update service",
          variant: "destructive",
        });
        return;
      }

      setServices(prev => prev.map(service => 
        service.id === editingService.id 
          ? { ...service, ...serviceFormData, price: parseFloat(serviceFormData.price), availability_slots: parseInt(serviceFormData.availability_slots) }
          : service
      ));
      setEditingService(null);
      setServiceFormData({
        service_type: "",
        title: "",
        description: "",
        price: "",
        availability_slots: "",
      });

      toast({
        title: "Success",
        description: "Service updated successfully",
      });
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: "Error",
        description: "Failed to update service",
        variant: "destructive",
      });
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      const { error } = await supabase
        .from('expert_services')
        .delete()
        .eq('id', serviceId);

      if (error) {
        console.error('Error deleting service:', error);
        toast({
          title: "Error",
          description: "Failed to delete service",
          variant: "destructive",
        });
        return;
      }

      setServices(prev => prev.filter(service => service.id !== serviceId));
      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: "Error",
        description: "Failed to delete service",
        variant: "destructive",
      });
    }
  };

  const handleEditService = (service: ExpertService) => {
    setEditingService(service);
    setServiceFormData({
      service_type: service.service_type,
      title: service.title,
      description: service.description || "",
      price: service.price.toString(),
      availability_slots: service.availability_slots.toString(),
    });
  };

  const handleCancelEdit = () => {
    setEditingService(null);
    setShowAddService(false);
    setServiceFormData({
      service_type: "",
      title: "",
      description: "",
      price: "",
      availability_slots: "",
    });
  };

  const handleAddVideo = async () => {
    if (!profile || !newVideoUrl.trim()) return;

    try {
      const { data, error } = await supabase
        .from('expert_videos')
        .insert({
          expert_id: profile.id,
          url: newVideoUrl.trim(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding video:', error);
        toast({
          title: "Error",
          description: "Failed to add video",
          variant: "destructive",
        });
        return;
      }

      setVideos(prev => [data, ...prev]);
      setNewVideoUrl("");

      toast({
        title: "Success",
        description: "Video added successfully",
      });
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: "Error",
        description: "Failed to add video",
        variant: "destructive",
      });
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    try {
      const { error } = await supabase
        .from('expert_videos')
        .delete()
        .eq('id', videoId);

      if (error) {
        console.error('Error deleting video:', error);
        toast({
          title: "Error",
          description: "Failed to delete video",
          variant: "destructive",
        });
        return;
      }

      setVideos(prev => prev.filter(video => video.id !== videoId));
      toast({
        title: "Success",
        description: "Video deleted successfully",
      });
    } catch (err) {
      console.error('Error:', err);
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive",
      });
    }
  };

  // Service type options
  const serviceTypeOptions = [
    { value: "30_min", label: "1:1 Coaching (30 Minutes)", title: "1:1 Coaching (30 Minutes)" },
    { value: "1_hour", label: "1:1 Coaching (1 Hour)", title: "1:1 Coaching (1 Hour)" },
    { value: "1_week", label: "1:1 Coaching (1 Week)", title: "1:1 Coaching (1 Week)" },
    { value: "1_month", label: "1:1 Coaching (1 Month)", title: "1:1 Coaching (1 Month)" },
  ];

  // Prepare country options for react-select
  const countryOptions = emojiFlags.data.map((country) => ({
    value: country.code,
    label: `${country.emoji} ${country.name}`,
  }));

  if (!profile?.is_expert) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground mb-4">This page is only available for expert users.</p>
          <Button onClick={() => navigate('/')}>
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

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
              <button
                onClick={() => navigate('/messages')}
                className="relative flex items-center justify-center p-0 bg-transparent border-0 focus:outline-none"
                style={{ minWidth: 30 }}
              >
                <span className="flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2.5" y="5.5" width="17" height="11" rx="1.5" fill="white" stroke="#1877F6" strokeWidth="1.7"/>
                    <path d="M4 7l7 5 7-5" stroke="#1877F6" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                  </svg>
                </span>
              </button>
              <div className="h-8 w-px bg-gray-200 mx-1.5" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center space-x-0.5 cursor-pointer select-none">
                    <span className="w-7 h-7 flex items-center justify-center rounded-full bg-black">
                      <span className="text-xs font-semibold text-white">
                        {user?.email?.charAt(0).toUpperCase()}
                      </span>
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
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

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-primary-hover rounded-full mb-6 shadow-lg">
            <User className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-3">
            Manage Your Profile
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Update your expert profile information, bio, social links, videos, and manage your service offerings
          </p>
          {profile?.is_expert && profile?.id && (
            <Button
              className="mt-6"
              variant="outline"
              onClick={() => navigate(`/expert/${profile.id}`)}
            >
              View My Profile
            </Button>
          )}
        </div>

        <div className="space-y-8">
          {/* Basic Information */}
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-primary to-primary-hover rounded-lg flex items-center justify-center">
                  <User className="h-5 w-5 text-white" />
                </div>
                <CardTitle className="text-xl font-semibold text-card-foreground">Basic Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="first_name" className="text-sm font-medium text-card-foreground">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="Enter your first name"
                    className="h-12 border-input focus:border-ring focus:ring-ring transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name" className="text-sm font-medium text-card-foreground">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Enter your last name"
                    className="h-12 border-input focus:border-ring focus:ring-ring transition-colors"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location" className="text-sm font-medium text-card-foreground">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  placeholder="Enter your location"
                  className="h-12 border-input focus:border-ring focus:ring-ring transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="home_country" className="text-sm font-medium text-card-foreground">Home Country</Label>
                <ReactSelect
                  inputId="home_country"
                  options={countryOptions}
                  value={countryOptions.find(option => option.value === formData.home_country) || null}
                  onChange={option => handleInputChange('home_country', option ? option.value : '')}
                  placeholder="Select your country"
                  isClearable
                  classNamePrefix="react-select"
                  menuPortalTarget={typeof window !== 'undefined' ? document.body : null}
                  styles={{
                    menuPortal: base => ({ ...base, zIndex: 9999 }),
                  }}
                />
              </div>
            </CardContent>
          </Card>

          {/* About Me */}
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-success to-green-600 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <CardTitle className="text-xl font-semibold text-card-foreground">About Me</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="bio" className="text-sm font-medium text-card-foreground">Short Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  placeholder="Enter a short bio (appears in expert listings)"
                  rows={3}
                  className="border-input focus:border-ring focus:ring-ring transition-colors resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile_bio" className="text-sm font-medium text-card-foreground">Detailed Profile Bio</Label>
                <Textarea
                  id="profile_bio"
                  value={formData.profile_bio}
                  onChange={(e) => handleInputChange('profile_bio', e.target.value)}
                  placeholder="Enter a detailed bio for your profile page"
                  rows={6}
                  className="border-input focus:border-ring focus:ring-ring transition-colors resize-none"
                />
              </div>
            </CardContent>
          </Card>

          {/* Video URLs */}
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-warning to-orange-500 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2z" />
                  </svg>
                </div>
                <CardTitle className="text-xl font-semibold text-card-foreground">Video URLs</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Video Form */}
              <div className="space-y-2">
                <Label htmlFor="new_video_url" className="text-sm font-medium text-card-foreground">Add New Video URL</Label>
                <Input
                  id="new_video_url"
                  value={newVideoUrl}
                  onChange={(e) => setNewVideoUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="h-12 border-input focus:border-ring focus:ring-ring transition-colors"
                />
                <Button
                  onClick={handleAddVideo}
                  className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Video
                </Button>
              </div>

              {/* Existing Videos List */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-card-foreground">Your Videos</h4>
                {videos.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg className="h-6 w-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-muted-foreground text-sm">No videos added yet</p>
                  </div>
                ) : (
                  videos.map((video) => (
                    <Card key={video.id} className="border border-border hover:border-ring hover:shadow-lg transition-all duration-200 bg-card">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <svg className="h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 002 2z" />
                              </svg>
                              <span className="text-sm text-muted-foreground">Video URL</span>
                            </div>
                            <a 
                              href={video.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:text-primary-hover break-all"
                            >
                              {video.url}
                            </a>
                            {video.created_at && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Added {new Date(video.created_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteVideo(video.id)}
                              className="border-input hover:bg-destructive/10 hover:border-destructive text-destructive hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Social Media Links */}
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2M9 12l2 2 4-4" />
                  </svg>
                </div>
                <CardTitle className="text-xl font-semibold text-card-foreground">Social Media Links</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="instagram_url" className="text-sm font-medium text-card-foreground">Instagram URL</Label>
                <Input
                  id="instagram_url"
                  value={formData.instagram_url}
                  onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                  placeholder="https://instagram.com/yourusername"
                  className="h-12 border-input focus:border-ring focus:ring-ring transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebook_url" className="text-sm font-medium text-card-foreground">Facebook URL</Label>
                <Input
                  id="facebook_url"
                  value={formData.facebook_url}
                  onChange={(e) => handleInputChange('facebook_url', e.target.value)}
                  placeholder="https://facebook.com/yourusername"
                  className="h-12 border-input focus:border-ring focus:ring-ring transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="linkedin_url" className="text-sm font-medium text-card-foreground">LinkedIn URL</Label>
                <Input
                  id="linkedin_url"
                  value={formData.linkedin_url}
                  onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                  placeholder="https://linkedin.com/in/yourusername"
                  className="h-12 border-input focus:border-ring focus:ring-ring transition-colors"
                />
              </div>
            </CardContent>
          </Card>

          {/* Expert Services */}
          <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-warning to-orange-500 rounded-lg flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <CardTitle className="text-xl font-semibold text-card-foreground">Expert Services</CardTitle>
                </div>
                <Button
                  onClick={() => setShowAddService(true)}
                  size="sm"
                  className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Add/Edit Service Form */}
              {(showAddService || editingService) && (
                <Card className="mb-8 border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-primary-hover/5 shadow-lg">
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="service_type" className="text-sm font-medium text-card-foreground">Service Type</Label>
                        <Select
                          value={serviceFormData.service_type}
                          onValueChange={handleServiceTypeChange}
                        >
                          <SelectTrigger className="h-12 border-input focus:border-ring focus:ring-ring transition-colors">
                            <SelectValue placeholder="Select a service type" />
                          </SelectTrigger>
                          <SelectContent>
                            {serviceTypeOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="service_title" className="text-sm font-medium text-card-foreground">Service Title</Label>
                        <Input
                          id="service_title"
                          value={serviceFormData.title}
                          onChange={(e) => handleServiceInputChange('title', e.target.value)}
                          placeholder="Service title"
                          className="h-12 border-input focus:border-ring focus:ring-ring transition-colors"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="service_description" className="text-sm font-medium text-card-foreground">Description</Label>
                        <Textarea
                          id="service_description"
                          value={serviceFormData.description}
                          onChange={(e) => handleServiceInputChange('description', e.target.value)}
                          placeholder="Describe what's included in this service"
                          rows={3}
                          className="border-input focus:border-ring focus:ring-ring transition-colors resize-none"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="service_price" className="text-sm font-medium text-card-foreground">Price ($)</Label>
                          <Input
                            id="service_price"
                            type="number"
                            value={serviceFormData.price}
                            onChange={(e) => handleServiceInputChange('price', e.target.value)}
                            placeholder="0.00"
                            min="0"
                            step="0.01"
                            className="h-12 border-input focus:border-ring focus:ring-ring transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="service_slots" className="text-sm font-medium text-card-foreground">Available Spots</Label>
                          <Input
                            id="service_slots"
                            type="number"
                            value={serviceFormData.availability_slots}
                            onChange={(e) => handleServiceInputChange('availability_slots', e.target.value)}
                            placeholder="0"
                            min="0"
                            className="h-12 border-input focus:border-ring focus:ring-ring transition-colors"
                          />
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <Button
                          onClick={editingService ? handleUpdateService : handleAddService}
                          className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white shadow-lg hover:shadow-xl transition-all duration-200"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          {editingService ? 'Update Service' : 'Add Service'}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleCancelEdit}
                          className="border-input hover:bg-accent transition-colors"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Services List */}
              <div className="space-y-4">
                {services.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="h-8 w-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-card-foreground mb-2">No services yet</h3>
                    <p className="text-muted-foreground mb-4">Start by adding your first service offering</p>
                    <Button
                      onClick={() => setShowAddService(true)}
                      className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Your First Service
                    </Button>
                  </div>
                ) : (
                  services.map((service) => (
                    <Card key={service.id} className="border border-border hover:border-ring hover:shadow-lg transition-all duration-200 bg-card">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              <h3 className="text-lg font-semibold text-card-foreground">{service.title}</h3>
                              {!service.is_active && (
                                <span className="text-xs bg-muted text-muted-foreground px-3 py-1 rounded-full">
                                  Inactive
                                </span>
                              )}
                              <span className="text-sm bg-success/10 text-success px-3 py-1 rounded-full font-medium">
                                ${service.price}
                              </span>
                            </div>
                            <p className="text-muted-foreground mb-3 leading-relaxed">
                              {service.description || 'No description provided'}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1 text-muted-foreground">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                {service.availability_slots} spot{service.availability_slots !== 1 ? 's' : ''} available
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditService(service)}
                              className="border-input hover:bg-accent hover:border-ring transition-colors"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteService(service.id)}
                              className="border-input hover:bg-destructive/10 hover:border-destructive text-destructive hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-center pt-8">
            <Button
              onClick={handleSaveProfile}
              disabled={false} // Removed saving state as it's not managed by useState anymore
              className="bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white px-8 py-3 text-lg font-medium shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
            >
              <Save className="h-5 w-5 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManageProfile; 