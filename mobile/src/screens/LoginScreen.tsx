import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { supabase } from '../config/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function handleLogin() {
    setErrorMsg('');
    setSuccessMsg('');
    if (!email || !password) { setErrorMsg('Email et mot de passe requis.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) setErrorMsg(error.message);
  }

  async function handleRegister() {
    setErrorMsg('');
    setSuccessMsg('');
    if (!email || !password) { setErrorMsg('Email et mot de passe requis.'); return; }
    if (password.length < 6) { setErrorMsg('Le mot de passe doit faire au moins 6 caractères.'); return; }
    setLoading(true);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) setErrorMsg(error.message);
    else setSuccessMsg('Compte créé ! Vérifie ton email pour confirmer.');
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>HealthAI Coach</Text>
      {errorMsg ? <Text style={styles.error}>{errorMsg}</Text> : null}
      {successMsg ? <Text style={styles.success}>{successMsg}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe (6 caractères min.)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Chargement...' : 'Se connecter'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.buttonSecondary} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonSecondaryText}>Créer un compte</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 32, color: '#16a34a' },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  button: { backgroundColor: '#16a34a', padding: 14, borderRadius: 8, alignItems: 'center', marginBottom: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  buttonSecondary: { padding: 14, alignItems: 'center' },
  buttonSecondaryText: { color: '#16a34a', fontSize: 16 },
  error: { color: '#ef4444', textAlign: 'center', marginBottom: 12, fontSize: 14 },
  success: { color: '#16a34a', textAlign: 'center', marginBottom: 12, fontSize: 14 },
});
