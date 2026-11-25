/* ==========================================================================
   MIST JOB PORTAL — configuration
   --------------------------------------------------------------------------
   MODE = "local"     -> XAMPP + MySQL + PHP (offline, default for the demo)
   MODE = "supabase"  -> the original cloud deployment

   For local mode you do not need to change anything below. The database
   settings live in api/bootstrap.php (root/no password by default, as XAMPP
   ships them).
   ========================================================================== */

window.APP_CONFIG = {
  MODE: "local",

  SUPABASE_URL: "https://cgwbniuhrxxfpvlqxrkj.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_SnAVyuL6aUJTHQdf4dHZCA_FSllYzXn",

  SITE_NAME: "MIST Job Portal",
  CONTACT_EMAIL: "careers@mistjobportal.test",
};
