-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  is_expert BOOLEAN NOT NULL DEFAULT false,
  bio TEXT,
  profile_image_url TEXT,
  location TEXT,
  specialties TEXT[],
  starting_price INTEGER, -- in cents
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expert categories table
CREATE TABLE public.expert_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expert category associations (many-to-many)
CREATE TABLE public.expert_category_associations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expert_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.expert_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(expert_id, category_id)
);

-- Create expert services table
CREATE TABLE public.expert_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expert_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL CHECK (service_type IN ('30_min', '1_hour', '1_week', '1_month')),
  title TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- in cents
  availability_slots INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  expert_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.expert_services(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  price_paid INTEGER, -- in cents
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create waitlist table
CREATE TABLE public.waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default expert categories
INSERT INTO public.expert_categories (name, description) VALUES
  ('Showjumping', 'Show jumping and competition training'),
  ('Hunters', 'Hunter classes and equitation'),
  ('Young Horse Development', 'Training and development of young horses'),
  ('Rider Health & Mindset', 'Physical and mental fitness for riders'),
  ('Horse Health & Peak Performance', 'Veterinary and performance optimization'),
  ('Equestrian Business & Career', 'Business and career development in equestrian industry'),
  ('Training', 'General training and coaching'),
  ('Competition', 'Competition preparation and strategy');

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_category_associations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expert_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for expert_categories
CREATE POLICY "Anyone can view categories" 
ON public.expert_categories 
FOR SELECT 
USING (true);

-- Create RLS policies for expert_category_associations
CREATE POLICY "Anyone can view expert categories" 
ON public.expert_category_associations 
FOR SELECT 
USING (true);

CREATE POLICY "Experts can manage their own category associations" 
ON public.expert_category_associations 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = expert_category_associations.expert_id 
  AND profiles.user_id = auth.uid()
  AND profiles.is_expert = true
));

-- Create RLS policies for expert_services
CREATE POLICY "Anyone can view active services" 
ON public.expert_services 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Experts can manage their own services" 
ON public.expert_services 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = expert_services.expert_id 
  AND profiles.user_id = auth.uid()
  AND profiles.is_expert = true
));

-- Create RLS policies for bookings
CREATE POLICY "Users can view their own bookings" 
ON public.bookings 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = bookings.user_id 
  AND profiles.user_id = auth.uid()
) OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = bookings.expert_id 
  AND profiles.user_id = auth.uid()
));

CREATE POLICY "Users can create bookings for themselves" 
ON public.bookings 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = bookings.user_id 
  AND profiles.user_id = auth.uid()
));

CREATE POLICY "Users and experts can update relevant bookings" 
ON public.bookings 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = bookings.user_id 
  AND profiles.user_id = auth.uid()
) OR EXISTS (
  SELECT 1 FROM public.profiles 
  WHERE profiles.id = bookings.expert_id 
  AND profiles.user_id = auth.uid()
));

-- Create RLS policies for waitlist (public access for insertion)
CREATE POLICY "Anyone can view waitlist entries" 
ON public.waitlist 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can join waitlist" 
ON public.waitlist 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expert_services_updated_at
  BEFORE UPDATE ON public.expert_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, first_name, last_name, is_expert)
  VALUES (
    NEW.id, 
    NEW.email,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();