import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../config/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  async function handleLogin() {
    setErrorMsg(''); setSuccessMsg('');
    if (!email || !password) { setErrorMsg('Remplis tous les champs.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setErrorMsg(error.message);
  }

  async function handleRegister() {
    setErrorMsg(''); setSuccessMsg('');
    if (!email || !password) { setErrorMsg('Remplis tous les champs.'); return; }
    if (password.length < 6) { setErrorMsg('Mot de passe trop court (6 caractères min).'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) setErrorMsg(error.message);
    else setSuccessMsg('Compte créé ! Vérifie ton email.');
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.logoOuter}>
            <View style={styles.logoInner}>
              <Ionicons name="fitness" size={36} color="#fff" />
            </View>
          </View>
          <Text style={styles.brand}>HealthAI</Text>
          <Text style={styles.brandSub}>Coach</Text>
          <Text style={styles.tagline}>Rejoins ta communauté santé</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <View style={styles.toggle}>
            <TouchableOpacity
              style={[styles.toggleBtn, !isRegister && styles.toggleActive]}
              onPress={() => { setIsRegister(false); setErrorMsg(''); setSuccessMsg(''); }}
            >
              <Text style={[styles.toggleText, !isRegister && styles.toggleTextActive]}>Connexion</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, isRegister && styles.toggleActive]}
              onPress={() => { setIsRegister(true); setErrorMsg(''); setSuccessMsg(''); }}
            >
              <Text style={[styles.toggleText, isRegister && styles.toggleTextActive]}>Inscription</Text>
            </TouchableOpacity>
          </View>

          {errorMsg ? (
            <View style={styles.alertError}>
              <Ionicons name="alert-circle-outline" size={15} color="#f87171" />
              <Text style={styles.alertErrorText}>{errorMsg}</Text>
            </View>
          ) : null}
          {successMsg ? (
            <View style={styles.alertSuccess}>
              <Ionicons name="checkmark-circle-outline" size={15} color="#22c55e" />
              <Text style={styles.alertSuccessText}>{successMsg}</Text>
            </View>
          ) : null}

          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color="#4b5563" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Adresse email"
              placeholderTextColor="#4b5563"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color="#4b5563" style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Mot de passe"
              placeholderTextColor="#4b5563"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPwd}
            />
            <TouchableOpacity onPress={() => setShowPwd(v => !v)} style={{ padding: 4 }}>
              <Ionicons name={showPwd ? 'eye-off-outline' : 'eye-outline'} size={18} color="#4b5563" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.btn, loading && { opacity: 0.6 }]}
            onPress={isRegister ? handleRegister : handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.btnText}>
              {loading ? 'Chargement...' : isRegister ? 'Créer mon compte' : 'Se connecter'}
            </Text>
            {!loading && <Ionicons name="arrow-forward" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  hero: { alignItems: 'center', marginBottom: 36 },
  logoOuter: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: '#22c55e18', justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  logoInner: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#22c55e', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6, shadowRadius: 20, elevation: 12,
  },
  brand: { fontSize: 36, fontWeight: '900', color: '#f0f6fc', letterSpacing: -1 },
  brandSub: { fontSize: 18, fontWeight: '600', color: '#22c55e', marginTop: -6, letterSpacing: 4 },
  tagline: { fontSize: 14, color: '#4b5563', marginTop: 8 },
  card: {
    backgroundColor: '#161b22', borderRadius: 24, padding: 24,
    borderWidth: 1, borderColor: '#21262d',
  },
  toggle: {
    flexDirection: 'row', backgroundColor: '#0d1117', borderRadius: 14,
    padding: 4, marginBottom: 24,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 11, alignItems: 'center' },
  toggleActive: { backgroundColor: '#22c55e' },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#4b5563' },
  toggleTextActive: { color: '#fff' },
  alertError: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#2d1219', borderRadius: 10, padding: 12, marginBottom: 14,
    borderLeftWidth: 3, borderLeftColor: '#f87171',
  },
  alertErrorText: { color: '#f87171', fontSize: 13, flex: 1 },
  alertSuccess: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#0d2818', borderRadius: 10, padding: 12, marginBottom: 14,
    borderLeftWidth: 3, borderLeftColor: '#22c55e',
  },
  alertSuccessText: { color: '#22c55e', fontSize: 13, flex: 1 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#0d1117', borderRadius: 14, borderWidth: 1,
    borderColor: '#21262d', marginBottom: 12, paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#f0f6fc' },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#22c55e', borderRadius: 14, paddingVertical: 16, marginTop: 6,
    shadowColor: '#22c55e', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  btnText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
