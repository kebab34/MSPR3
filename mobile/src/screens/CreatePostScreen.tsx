import { useState } from 'react';
import {
  Text, TextInput, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, ScrollView, Platform,
  SafeAreaView, View, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../config/supabase';
import { SOCIAL_API_URL } from '../config/api';

export default function CreatePostScreen() {
  const [contenu, setContenu] = useState('');
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "L'accès à la galerie est nécessaire.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] as any, quality: 0.8 });
    if (!result.canceled) setImage(result.assets[0]);
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission refusée', "L'accès à la caméra est nécessaire pour prendre une photo.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'] as any, quality: 0.8 });
    if (!result.canceled) setImage(result.assets[0]);
  }

  async function handleSubmit() {
    setErrorMsg(''); setSuccessMsg('');
    if (!contenu.trim()) { setErrorMsg('Le contenu ne peut pas être vide.'); return; }
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const formData = new FormData();
      formData.append('contenu', contenu.trim());
      if (image) {
        if (Platform.OS === 'web') {
          const resp = await fetch(image.uri);
          const blob = await resp.blob();
          formData.append('file', blob, `photo.${blob.type.split('/')[1] || 'jpg'}`);
        } else {
          const filename = image.uri.split('/').pop() || 'photo.jpg';
          formData.append('file', { uri: image.uri, name: filename, type: `image/${filename.split('.').pop() || 'jpg'}` } as any);
        }
      }
      const res = await fetch(`${SOCIAL_API_URL}/api/v1/posts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error(await res.text());
      setContenu(''); setImage(null);
      setSuccessMsg('Publication partagée !');
    } catch (e: any) {
      setErrorMsg(e.message || 'Erreur inconnue');
    } finally {
      setLoading(false);
    }
  }

  const MAX = 500;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Nouvelle publication</Text>

        {errorMsg ? (
          <View style={styles.alert}>
            <Ionicons name="alert-circle-outline" size={15} color="#f87171" />
            <Text style={styles.alertError}>{errorMsg}</Text>
          </View>
        ) : null}
        {successMsg ? (
          <View style={[styles.alert, styles.alertSuccessWrap]}>
            <Ionicons name="checkmark-circle-outline" size={15} color="#22c55e" />
            <Text style={styles.alertSuccess}>{successMsg}</Text>
          </View>
        ) : null}

        <View style={styles.textareaWrap}>
          <TextInput
            style={styles.textarea}
            placeholder="Quoi de neuf ? Partage ton expérience..."
            placeholderTextColor="#4b5563"
            value={contenu}
            onChangeText={t => { if (t.length <= MAX) setContenu(t); }}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, contenu.length > MAX * 0.85 && { color: '#f59e0b' }]}>
            {contenu.length}/{MAX}
          </Text>
        </View>

        {image ? (
          <View style={styles.previewWrap}>
            <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="cover" />
            <TouchableOpacity style={styles.removeImg} onPress={() => setImage(null)}>
              <Ionicons name="close-circle" size={26} color="#fff" />
            </TouchableOpacity>
          </View>
        ) : null}

        <View style={styles.mediaBtns}>
          <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
            <Ionicons name="image-outline" size={20} color="#22c55e" />
            <Text style={styles.photoBtnText}>{image ? 'Changer' : 'Galerie'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.photoBtn} onPress={takePhoto}>
            <Ionicons name="camera-outline" size={20} color="#22c55e" />
            <Text style={styles.photoBtnText}>Caméra</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, (!contenu.trim() || loading) && styles.submitOff]}
          onPress={handleSubmit}
          disabled={!contenu.trim() || loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <><Ionicons name="paper-plane-outline" size={18} color="#fff" /><Text style={styles.submitText}>Publier</Text></>
          }
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117' },
  scroll: { padding: 20, paddingBottom: 110 },
  title: { fontSize: 26, fontWeight: '800', color: '#f0f6fc', marginBottom: 20 },
  alert: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#2d1219', borderRadius: 10, padding: 12, marginBottom: 14,
    borderLeftWidth: 3, borderLeftColor: '#f87171',
  },
  alertSuccessWrap: { backgroundColor: '#0d2818', borderLeftColor: '#22c55e' },
  alertError: { color: '#f87171', fontSize: 13, flex: 1 },
  alertSuccess: { color: '#22c55e', fontSize: 13, flex: 1 },
  textareaWrap: {
    backgroundColor: '#161b22', borderRadius: 16,
    borderWidth: 1, borderColor: '#21262d', marginBottom: 16,
  },
  textarea: {
    padding: 16, fontSize: 15, color: '#f0f6fc', minHeight: 140, lineHeight: 23,
  },
  charCount: { textAlign: 'right', fontSize: 11, color: '#4b5563', paddingHorizontal: 16, paddingBottom: 10 },
  previewWrap: { position: 'relative', marginBottom: 16, borderRadius: 16, overflow: 'hidden' },
  preview: { width: '100%', height: 220, borderRadius: 16 },
  removeImg: {
    position: 'absolute', top: 10, right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 13,
  },
  mediaBtns: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  photoBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center',
    borderWidth: 1, borderColor: '#22c55e30', borderRadius: 14, borderStyle: 'dashed',
    padding: 14, backgroundColor: '#22c55e0a',
  },
  photoBtnText: { color: '#22c55e', fontSize: 14, fontWeight: '600' },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#22c55e', borderRadius: 14, paddingVertical: 16,
    shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  submitOff: { backgroundColor: '#1a3a1a', shadowOpacity: 0, elevation: 0 },
  submitText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
