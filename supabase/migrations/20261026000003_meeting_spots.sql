-- ==============================================================================
-- 20261026000003_meeting_spots.sql
-- SAFE CAFE & MEETING SPOTS MODULE (নিরাপদ ক্যাফে স্পট)
-- Verified public meetup spots recommended for safe dating & community meetups
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.meeting_spots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  area TEXT NOT NULL,
  city TEXT NOT NULL DEFAULT 'Dhaka',
  address TEXT,
  tip TEXT,
  google_maps_url TEXT,
  image_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_meeting_spots_active 
  ON public.meeting_spots(is_active, display_order, city);

CREATE INDEX IF NOT EXISTS idx_meeting_spots_city_area 
  ON public.meeting_spots(city, area);

-- Enable Row Level Security
ALTER TABLE public.meeting_spots ENABLE ROW LEVEL SECURITY;

-- 1. Read Policy: Active spots visible to all users (for chat invite picker)
CREATE POLICY "Active meeting spots readable by everyone"
  ON public.meeting_spots
  FOR SELECT
  USING (
    is_active = true 
    OR EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- 2. Insert Policy: Admins and Moderators only
CREATE POLICY "Admins and moderators can insert meeting spots"
  ON public.meeting_spots
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- 3. Update Policy: Admins and Moderators only
CREATE POLICY "Admins and moderators can update meeting spots"
  ON public.meeting_spots
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- 4. Delete Policy: Admins and Moderators only
CREATE POLICY "Admins and moderators can delete meeting spots"
  ON public.meeting_spots
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'moderator')
    )
  );

-- Seed Initial Verified Dhaka Cafes
INSERT INTO public.meeting_spots (name, area, city, tip, google_maps_url, image_url, display_order)
VALUES 
  (
    'North End Coffee Roasters', 
    'Banani / Dhanmondi / Gulshan', 
    'Dhaka', 
    'শান্ত ও নান্দনিক পরিবেশ, সিসিটিভি ক্যামেরা ও ওপেন সিটিং ব্যবস্থা।',
    'https://maps.google.com/?q=North+End+Coffee+Roasters+Dhaka',
    'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=800&q=80',
    1
  ),
  (
    'Crimson Cup Coffee', 
    'Dhanmondi / Banani', 
    'Dhaka', 
    'কফিপ্রেমীদের পছন্দের আড্ডা, নিরাপদ পারিবারিক পরিবেশ ও মানসম্মত সার্ভিস।',
    'https://maps.google.com/?q=Crimson+Cup+Coffee+Dhaka',
    'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=800&q=80',
    2
  ),
  (
    'Gloria Jean''s Coffees', 
    'Gulshan-2 / Dhanmondi', 
    'Dhaka', 
    'আরামদায়ক বসার ব্যবস্থা, প্রিমিয়াম কফি ও প্রথম ডেটের জন্য নিরাপদ স্পট।',
    'https://maps.google.com/?q=Gloria+Jeans+Coffees+Dhaka',
    'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=800&q=80',
    3
  ),
  (
    'Cha Adda Corner (রবীন্দ্র সরোবর)', 
    'Dhanmondi Lake', 
    'Dhaka', 
    'খোলামেলা লেকভিউ, তাজা বাতাস ও খাঁটি গরম মাটির ভাঁড়ের চা।',
    'https://maps.google.com/?q=Rabindra+Sarobar+Dhanmondi+Dhaka',
    'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=800&q=80',
    4
  ),
  (
    'Butlers Chocolate Cafe', 
    'Gulshan-1', 
    'Dhaka', 
    'চমৎকার ডেজার্ট, সিগনেচার হট চকলেট ও আকর্ষণীয় ইনডোর পরিবেশ।',
    'https://maps.google.com/?q=Butlers+Chocolate+Cafe+Gulshan+Dhaka',
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
    5
  ),
  (
    'Coffee World', 
    'Uttara Sector 3', 
    'Dhaka', 
    'উত্তরাবাসীদের জন্য নিরিবিলি ও আরামদায়ক কফি ডেটিং লাউঞ্জ।',
    'https://maps.google.com/?q=Coffee+World+Uttara+Dhaka',
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=800&q=80',
    6
  )
ON CONFLICT DO NOTHING;
