-- Rename discord_handle to google_meet_link for Google Meet integration
ALTER TABLE public.internship_applications 
  RENAME COLUMN discord_handle TO google_meet_link;
