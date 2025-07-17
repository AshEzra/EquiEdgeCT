-- Add social media links to profiles table
ALTER TABLE public.profiles 
ADD COLUMN instagram_url TEXT,
ADD COLUMN facebook_url TEXT,
ADD COLUMN linkedin_url TEXT;

-- Create reviews table for expert reviews
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL,
  expert_id UUID NOT NULL,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for reviews
CREATE POLICY "Anyone can view reviews" 
ON public.reviews 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create reviews for their completed bookings" 
ON public.reviews 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM bookings b
    JOIN profiles p ON p.id = b.user_id
    WHERE b.id = booking_id 
    AND b.expert_id = reviews.expert_id
    AND b.user_id = reviews.user_id
    AND p.user_id = auth.uid()
    AND b.status = 'completed'
  )
);

CREATE POLICY "Users can update their own reviews" 
ON public.reviews 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM profiles p
    WHERE p.id = user_id 
    AND p.user_id = auth.uid()
  )
);

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add foreign key constraints
ALTER TABLE public.reviews
ADD CONSTRAINT reviews_booking_id_fkey 
FOREIGN KEY (booking_id) REFERENCES public.bookings(id),
ADD CONSTRAINT reviews_expert_id_fkey 
FOREIGN KEY (expert_id) REFERENCES public.profiles(id),
ADD CONSTRAINT reviews_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id);