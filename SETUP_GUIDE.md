# 🚀 Complete Supabase Setup Guide

## ✅ Current Status
- ✅ App is running at http://localhost:8080
- ✅ Frontend code is fixed (no duplicate emails)
- ❌ Database needs setup
- ❌ Edge Functions need deployment
- ❌ Environment variables need configuration

## 🔧 Required Setup Steps

### 1. Database Setup (CRITICAL)

**Option A: Manual Setup in Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Open your project: `ewehkzmtrmngsjeiikqz`
3. Go to **SQL Editor**
4. Run this SQL to create the leads table:

```sql
-- Create leads table for storing contact submissions
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  industry TEXT NOT NULL DEFAULT 'Other',
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anyone to insert leads (public form)
CREATE POLICY "Anyone can submit leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (true);

-- Create policy to allow reading leads (for analytics/dashboard later)
CREATE POLICY "Anyone can view leads" 
ON public.leads 
FOR SELECT 
USING (true);

-- Add unique constraint on email to prevent duplicates
ALTER TABLE public.leads 
ADD CONSTRAINT unique_email UNIQUE (email);

-- Add indexes for better performance
CREATE INDEX idx_leads_email ON public.leads(email);
CREATE INDEX idx_leads_submitted_at ON public.leads(submitted_at);
```

### 2. Edge Functions Setup (FOR EMAIL)

**You need to deploy the email function:**

1. Go to **Edge Functions** in your Supabase dashboard
2. Create a new function named `send-confirmation`
3. Copy the code from `supabase/functions/send-confirmation/index.ts`

### 3. Environment Variables (CRITICAL FOR EMAIL)

**In Supabase Dashboard:**
1. Go to **Settings** → **Edge Functions** → **Environment Variables**
2. Add these variables:

```
RESEND_API_KEY=your_resend_api_key_here
```

**To get Resend API Key:**
1. Go to https://resend.com
2. Sign up/login
3. Go to API Keys
4. Create new API key
5. Copy the key (starts with `re_`)

### 4. Test the Application

After setup, test:
1. Fill out the form at http://localhost:8080
2. Check if data saves to database
3. Check if email is sent

## 🐛 Current Issues to Fix

1. **Database Table Missing** - Run the SQL above
2. **Edge Function Not Deployed** - Deploy send-confirmation function
3. **No Resend API Key** - Add RESEND_API_KEY environment variable

## 🔍 How to Debug

**Check Database:**
- Go to Table Editor in Supabase
- Look for `leads` table
- Check if data is being inserted

**Check Edge Functions:**
- Go to Edge Functions → send-confirmation → Logs
- Look for error messages

**Check Browser Console:**
- Open Developer Tools (F12)
- Check Console tab for errors
- Check Network tab for failed requests

## ⚡ Quick Test Without Email

If you want to test just the database part:
1. Set up the database table (SQL above)
2. Comment out the email sending code temporarily
3. Test form submission to see if data saves

## 🎯 Priority Order

1. **FIRST**: Create database table (SQL above)
2. **SECOND**: Test form submission (should save to database)
3. **THIRD**: Set up Resend API key
4. **FOURTH**: Deploy edge function
5. **FIFTH**: Test email sending

Would you like me to help you with any specific step?
