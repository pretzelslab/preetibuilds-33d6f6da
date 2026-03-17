import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hfvfxiqfmcphctjbenul.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhmdmZ4aXFmbWNwaGN0amJlbnVsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3MDYwMTAsImV4cCI6MjA4OTI4MjAxMH0.EpDsQCa7TF_R-nZodM2kf_f1qiSUbeN8_q5VKp1KKC4";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// The access code doubles as the user identity for all MedLog data
export const USER_KEY = "PRL2026";
