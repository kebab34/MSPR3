import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const SUPABASE_URL = 'https://jgtnjeoaeoderkbzifyd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpndG5qZW9hZW9kZXJrYnppZnlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMTQ2NjIsImV4cCI6MjA5Mjc5MDY2Mn0.TpWaVLYpoqfVXM-sGeDcvcFS5Nd-3ohUVbj3vJIO0DI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
