-- =====================================================================
-- OVUM BIRTH STORY - DATABASE SCHEMA SETUP SCRIPT
-- Run this script in your Supabase SQL Editor (SQL Editor -> New Query)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. CLEAN UP (Optional: Uncomment if you need to start fresh)
-- ---------------------------------------------------------------------
-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- DROP FUNCTION IF EXISTS public.handle_new_user();
-- DROP TABLE IF EXISTS public.pdf_versions;
-- DROP TABLE IF EXISTS public.stories;
-- DROP TABLE IF EXISTS public.users;

-- ---------------------------------------------------------------------
-- 2. PUBLIC PROFILE USERS TABLE
-- ---------------------------------------------------------------------
-- This table mirrors the users registered in Supabase Auth (auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'STAFF', 'APPROVER')),
    assigned_centre TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Allow select of profiles for authenticated users" 
    ON public.users FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Allow individual writes to own profiles" 
    ON public.users FOR ALL 
    TO authenticated 
    USING (auth.uid() = id);

-- ---------------------------------------------------------------------
-- 3. SIGNUP AUTH AUTOMATIC PROFILE TRIGGER
-- ---------------------------------------------------------------------
-- Trigger to automatically create a profile in public.users when a user signs up.
-- Extracts name and role from raw_user_meta_data.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, name, email, role, assigned_centre)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', 'Keepsake Staff'),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'STAFF'),
    new.raw_user_meta_data->>'assigned_centre'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Bind trigger to auth.users table
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------
-- 4. STORIES TABLE (MAIN STORY DETAILS)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    baby_name TEXT NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female')),
    birth_date DATE,
    birth_time TEXT,
    birth_weight TEXT, -- Weight stored as text to accommodate custom formats
    height TEXT,       -- Height stored as text to accommodate custom formats
    first_cry_time TEXT,
    latitude TEXT,
    longitude TEXT,
    hospital TEXT,
    
    -- Family details
    mother_name TEXT NOT NULL,
    father_name TEXT NOT NULL,
    maternal_grandmother TEXT,
    maternal_grandfather TEXT,
    paternal_grandmother TEXT,
    paternal_grandfather TEXT,
    other_family TEXT,
    
    -- Hospital details
    room_type TEXT,
    checkin_date DATE,
    checkin_time TEXT,
    
    -- Medical team arrays
    doctor_names TEXT[] DEFAULT '{}',
    nurse_names TEXT[] DEFAULT '{}',
    
    -- First moments
    baby_first_outfit TEXT,
    mother_outfit TEXT,
    first_feed TEXT,
    
    -- Assets & status
    photo_url TEXT,
    latest_pdf_url TEXT,
    status TEXT CHECK (status IN ('Draft', 'Pending Approval', 'Approved', 'Rejected', 'Completed', 'Archived')) DEFAULT 'Draft',
    rejection_reason TEXT,
    approved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Allow select stories for authenticated users" 
    ON public.stories FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Allow insert stories for authenticated users" 
    ON public.stories FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

CREATE POLICY "Allow update stories for authenticated users" 
    ON public.stories FOR UPDATE 
    TO authenticated 
    USING (true);

CREATE POLICY "Allow delete stories for authenticated users" 
    ON public.stories FOR DELETE 
    TO authenticated 
    USING (true);

-- Create Indices for quick filtering and queries
CREATE INDEX IF NOT EXISTS idx_stories_baby_name ON public.stories (baby_name);
CREATE INDEX IF NOT EXISTS idx_stories_mother_name ON public.stories (mother_name);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories (created_at DESC);

-- ---------------------------------------------------------------------
-- 5. PDF VERSIONS TABLE (HISTORICAL VERSION BACKUPS)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pdf_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    story_id UUID REFERENCES public.stories(id) ON DELETE CASCADE,
    version INTEGER NOT NULL,
    pdf_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.pdf_versions ENABLE ROW LEVEL SECURITY;

-- Create Policies
CREATE POLICY "Allow select pdf versions for authenticated users" 
    ON public.pdf_versions FOR SELECT 
    TO authenticated 
    USING (true);

CREATE POLICY "Allow insert pdf versions for authenticated users" 
    ON public.pdf_versions FOR INSERT 
    TO authenticated 
    WITH CHECK (true);

-- Create Indices
CREATE INDEX IF NOT EXISTS idx_pdf_versions_story_id ON public.pdf_versions (story_id);

-- ---------------------------------------------------------------------
-- 6. STORAGE BUCKET CONFIGURATION REMINDERS
-- ---------------------------------------------------------------------
-- Go to your Supabase Console -> Storage
-- 1. Create a bucket named "baby-images"
--    - Set Bucket Access to: Public (CORS allowed, public URLs accessible)
-- 2. Create a bucket named "pdfs"
--    - Set Bucket Access to: Public (CORS allowed, public URLs accessible)
-- 
-- Ensure you have appropriate policies set in Storage -> Policies to allow 
-- authenticated uploads to these buckets. E.g., select "Insert" and "Update" 
-- for Authenticated Users on "bucket_id = 'baby-images'" and "bucket_id = 'pdfs'".
-- =====================================================================
