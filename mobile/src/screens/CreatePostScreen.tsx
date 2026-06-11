import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Image, Alert, ActivityIndicator, ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../config/supabase';
import { SOCIAL_API_URL } from '../config/api';

export default function CreatePostScreen() {
  const [contenu, setContenu] = useState('');
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [loading, setLoading] = useState(false);

  async function pickImage() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0]);
  }

  async function handleSubmit() {
    if (!contenu.trim()) {
      Alert.alert('Erreur', 'Le contenu ne peut pas être vide.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      const formData = new FormData();
      formData.append('contenu', contenu.trim());

      if (image) {
        const filename = image.uri.split('/').pop() || 'photo.jpg';
        const ext = filename.split('.').pop() || 'jpg';
        formData.append('file', {
          uri: image.uri,
          name: filename,
          type: `image/${ext}`,
        } as any);
      }

      const res = await fetch(`${SOCIAL_API_URL}/api/v1/posts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) throw new Error('Erreur lors de la publication');
      setContenu('');
      setImage(null);
      Alert.alert('Succès', 'Publication créée !');
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Nouvelle publication</Text>
      <TextInput
        style={styles.textarea}
        placeholder="Quoi de neuf ?"
        value={contenu}
        onChangeText={setContenu}
        multiline
        numberOfLines={5}
        textAlignVertical="top"
      />
      {image && <Image source={{ uri: image.uri }} style={styles.preview} resizeMode="cover" />}
      <TouchableOpacity style={styles.photoBtn} onPress={pickImage}>
        <Text style={styles.photoBtnText}>📷 {image ? 'Changer la photo' : 'Ajouter une photo'}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Publier</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, color: '#111827' },
  textarea: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 12, fontSize: 16, minHeight: 120, marginBottom: 12 },
  preview: { width: '100%', height: 200, borderRadius: 8, marginBottom: 12 },
  photoBtn: { borderWidth: 1, borderColor: '#16a34a', borderRadius: 8, padding: 12, alignItems: 'center', marginBottom: 12 },
  photoBtnText: { color: '#16a34a', fontSize: 15 },
  submitBtn: { backgroundColor: '#16a34a', padding: 14, borderRadius: 8, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
