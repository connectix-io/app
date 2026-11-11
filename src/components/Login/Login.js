import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase, supabaseConfigured, toAuthSession } from '../../lib/clients/supabase';
import { saveSession } from '../../lib/auth';
import { useSipPhoneCtx } from '../../context/SipPhoneContext';
import { sipSettingsFromUser } from '../../lib/sip/sipSettings';
import i18n from '../../i18n/config';

// Email + password login against Supabase Auth. The session is mirrored into the
// app's `auth` key (lib/clients/supabase.ts) so the rest of the app reads it.
export const useLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [touched, setTouched] = useState({ email: false, password: false });

  const { login, setLoading, setError, loading, error } = useAuth();
  const { connect: sipConnect } = useSipPhoneCtx();
  const navigate = useNavigate();

  const handleEmailChange = (e) => setEmail(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setTouched({ email: true, password: true });

    if (!email || !password) {
      setError('Email and password are required');
      return;
    }
    if (!supabaseConfigured) {
      setError('Supabase is not configured (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY)');
      return;
    }

    setLoading();

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      if (!data.session) throw new Error('Login returned no session');

      // Persist explicitly (don't rely on the auth listener's timing), then update context.
      const session = toAuthSession(data.session);
      saveSession(session);
      login(session);

      const lang = data.user?.user_metadata?.language;
      if (lang) i18n.changeLanguage(lang);

      // Softphone: use the SIP settings already stored on this browser. The login
      // password is deliberately NOT passed as a SIP secret. Fire-and-forget.
      try { sipConnect(sipSettingsFromUser(null)); } catch { /* phone optional */ }
      navigate('/conversations');
    } catch (err) {
      console.error('Login error:', err);
      setError(err?.message || 'Login failed. Please try again.');
    }
  };

  return {
    email,
    password,
    touched,
    loading,
    error,
    handleEmailChange,
    handlePasswordChange,
    handleBlur,
    handleSubmit,
  };
};
