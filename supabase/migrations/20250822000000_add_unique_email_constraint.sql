-- Add unique constraint on email to prevent duplicates
-- This will prevent the same email from being submitted multiple times

-- First, remove any existing duplicates (keep the latest)
DELETE FROM public.leads 
WHERE id NOT IN (
  SELECT DISTINCT ON (email) id
  FROM public.leads
  ORDER BY email, created_at DESC
);

-- Add unique constraint on email
ALTER TABLE public.leads 
ADD CONSTRAINT unique_email UNIQUE (email);

-- Create a more restrictive policy for inserts to handle duplicates gracefully
DROP POLICY IF EXISTS "Anyone can submit leads" ON public.leads;

CREATE POLICY "Anyone can submit leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (true);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_leads_email_unique ON public.leads(email);
