import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

export const SUPABASE_URL = "https://ljwpxjioetqabsrgwmmq.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxqd3B4amlvZXRxYWJzcmd3bW1xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxMzM5ODAsImV4cCI6MjEwNTcwOTk4MH0.4UZIy5ZzJBCMYHTxK1NWSbJ94CUrcHW-b1LhYJmfNCk";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: "pkce"
  },
  global: {
    headers: {
      "x-client-info": "gyaanbikas-web"
    }
  }
});
