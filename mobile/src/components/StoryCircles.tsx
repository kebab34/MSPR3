import { useState, useEffect } from 'react';
import {
  View, ScrollView, TouchableOpacity, Text, StyleSheet,
  Modal, ActivityIndicator, Platform, Alert, InteractionManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { apiFetch, SOCIAL_API_URL } from '../config/api';
import { supabase } from '../config/supabase';
import Avatar from './Avatar';

interface Story {
  id_story: string;
  media_url: string;
  created_at: string;
}

interface StoryGroup {
  user: {
    id_utilisateur: string;
    nom?: string;
    prenom?: string;
    email: string;
    avatar_url?: string | null;
  };
  stories: Story[];
  is_own: boolean;
}

export default function StoryCircles() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const [groups, setGroups] = useState<StoryGroup[]>([]);
  const [ownAvatar, setOwnAvatar] = useState<string | null>(null);
  const [ownInitials, setOwnInitials] = useState('?');
  const [showPicker, setShowPicker] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (isFocused) loadStories();
  }, [isFocused]);

  async function loadStories() {
    try {
      const [data, me] = await Promise.all([
        apiFetch('/api/v1/stories/feed'),
        apiFetch('/api/v1/auth/me'),
      ]);
      setGroups(data || []);
      setOwnAvatar(me?.avatar_url || null);
      setOwnInitials((me?.prenom || me?.email || '?').charAt(0).toUpperCase());
    } catch {}
  }

  function handlePickerChoice(useCamera: boolean) {
    setShowPicker(false);
    // Attend que toutes les animations (fermeture du modal) soient finies avant d'ouvrir le picker
    InteractionManager.runAfterInteractions(() => {
      void doCreateStory(useCamera);
    });
  }

  async function doCreateStory(useCamera: boolean) {
    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', "L'accès à la caméra est nécessaire pour créer une story.");
        return;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission refusée', "L'accès à la galerie est nécessaire pour créer une story.");
        return;
      }
    }

    const result = useCamera
      ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'] as any, quality: 0.85 })
      : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'] as any, quality: 0.85 });
    if (result.canceled) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      const formData = new FormData();
      if (Platform.OS === 'web') {
        const resp = await fetch(asset.uri);
        const blob = await resp.blob();
        formData.append('file', blob, `story.${blob.type.split('/')[1] || 'jpg'}`);
      } else {
        const filename = asset.uri.split('/').pop() || 'story.jpg';
        formData.append('file', { uri: asset.uri, name: filename, type: `image/${filename.split('.').pop() || 'jpg'}` } as any);
      }
      const res = await fetch(`${SOCIAL_API_URL}/api/v1/stories`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (res.ok) await loadStories();
    } catch {}
    setUploading(false);
  }

  function openViewer(groupIndex: number) {
    navigation.navigate('StoryViewer', { groups, groupIndex });
  }

  const hasOwnStory = groups.some(g => g.is_own);

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Own circle — always shown */}
        <TouchableOpacity
          style={styles.circle}
          onPress={hasOwnStory ? () => openViewer(0) : () => setShowPicker(true)}
          activeOpacity={0.8}
        >
          <View style={styles.ringWrap}>
            <View style={[styles.ring, hasOwnStory && styles.ringActive]}>
              {uploading ? (
                <View style={styles.uploadCircle}>
                  <ActivityIndicator color="#22c55e" size="small" />
                </View>
              ) : (
                <Avatar uri={ownAvatar} initials={ownInitials} size={52} />
              )}
            </View>
            {!hasOwnStory && !uploading && (
              <View style={styles.addBadge}>
                <Ionicons name="add" size={11} color="#fff" />
              </View>
            )}
          </View>
          <Text style={styles.circleName} numberOfLines={1}>Ma story</Text>
        </TouchableOpacity>

        {/* Other users' stories */}
        {groups
          .filter(g => !g.is_own)
          .map(group => {
            const idx = groups.findIndex(g => g.user.id_utilisateur === group.user.id_utilisateur);
            const name = group.user.prenom || group.user.email?.split('@')[0] || '';
            const initials = (group.user.prenom || group.user.email || '?').charAt(0).toUpperCase();
            return (
              <TouchableOpacity
                key={group.user.id_utilisateur}
                style={styles.circle}
                onPress={() => openViewer(idx)}
                activeOpacity={0.8}
              >
                <View style={styles.ringWrap}>
                  <View style={[styles.ring, styles.ringActive]}>
                    <Avatar uri={group.user.avatar_url} initials={initials} size={52} />
                  </View>
                </View>
                <Text style={styles.circleName} numberOfLines={1}>{name}</Text>
              </TouchableOpacity>
            );
          })}
      </ScrollView>

      <Modal visible={showPicker} transparent animationType="fade" onRequestClose={() => setShowPicker(false)}>
        <TouchableOpacity style={styles.modalOverlay} onPress={() => setShowPicker(false)} activeOpacity={1}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>Créer une story</Text>
            <TouchableOpacity style={styles.modalOption} onPress={() => handlePickerChoice(false)}>
              <View style={styles.modalOptionIcon}>
                <Ionicons name="images-outline" size={22} color="#22c55e" />
              </View>
              <View>
                <Text style={styles.modalOptionLabel}>Galerie</Text>
                <Text style={styles.modalOptionSub}>Choisir une photo</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalOption} onPress={() => handlePickerChoice(true)}>
              <View style={styles.modalOptionIcon}>
                <Ionicons name="camera-outline" size={22} color="#22c55e" />
              </View>
              <View>
                <Text style={styles.modalOptionLabel}>Caméra</Text>
                <Text style={styles.modalOptionSub}>Prendre une photo</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPicker(false)}>
              <Text style={styles.cancelText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  scroll: { paddingHorizontal: 8, gap: 14, paddingVertical: 6 },
  circle: { alignItems: 'center', gap: 5, width: 70 },
  ringWrap: { position: 'relative', width: 60, height: 60 },
  ring: {
    width: 60, height: 60, borderRadius: 30,
    borderWidth: 2, borderColor: '#21262d',
    justifyContent: 'center', alignItems: 'center',
    padding: 2, backgroundColor: '#161b22',
  },
  ringActive: { borderColor: '#22c55e' },
  uploadCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: '#161b22',
    justifyContent: 'center', alignItems: 'center',
  },
  addBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: '#22c55e',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: '#0d1117',
  },
  circleName: { fontSize: 10, color: '#8b949e', textAlign: 'center', width: 70 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#161b22',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: 40,
    borderTopWidth: 1, borderColor: '#21262d',
    gap: 4,
  },
  modalTitle: {
    fontSize: 13, fontWeight: '700', color: '#8b949e',
    textAlign: 'center', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1,
  },
  modalOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingVertical: 14, paddingHorizontal: 8, borderRadius: 12,
  },
  modalOptionIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: '#22c55e15',
    justifyContent: 'center', alignItems: 'center',
  },
  modalOptionLabel: { fontSize: 16, fontWeight: '700', color: '#f0f6fc' },
  modalOptionSub: { fontSize: 12, color: '#4b5563', marginTop: 1 },
  cancelBtn: {
    marginTop: 8, paddingVertical: 14, alignItems: 'center',
    backgroundColor: '#21262d', borderRadius: 14,
  },
  cancelText: { color: '#8b949e', fontWeight: '700', fontSize: 15 },
});
