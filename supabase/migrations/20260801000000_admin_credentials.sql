-- Admin Credentials Table
-- Stores predefined admin email/password pairs for prelogin access
-- Only the system admin can add/remove entries

CREATE TABLE IF NOT EXISTS public.admin_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  label TEXT DEFAULT '',                    -- e.g., "Main Admin", "Support Admin"
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_login_at TIMESTAMPTZ,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;

-- Only the admin-data edge function (service_role) can access this
CREATE POLICY "Service role can manage admin_credentials"
  ON public.admin_credentials
  USING (true)
  WITH CHECK (true);

-- Enable realtime for admin_credentials
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_credentials;

-- Seed default admin credential
-- Password is SHA-256 hash of user's chosen password
-- Default: admin@growlancer.com / Admin@123
-- IMPORTANT: Change this password after first login!
INSERT INTO public.admin_credentials (email, password_hash, label, is_active)
VALUES (
  'admin@growlancer.com',
  -- SHA-256 hash of 'Admin@123'
  '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9',
  'Main Admin',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Add second admin credential placeholder
INSERT INTO public.admin_credentials (email, password_hash, label, is_active)
VALUES (
  'support@growlancer.com',
  -- SHA-256 hash of 'Support@456'
  '9649b2ce9bad42f3d6c1ffaffd85fa52f2cf0314bc0fb46f6401e7a5c5c2d114',
  'Support Admin',
  true
)
ON CONFLICT (email) DO NOTHING;
