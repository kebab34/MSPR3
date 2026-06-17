import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  FlatList, Image, Modal, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { apiFetch } from '../config/api';

interface Story {
  id_story: string;
  media_url: string;
  created_at: string;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.max(1, Math.floor(diff / 60000))} min`;
  if (h < 24) return `${h}h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}j`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function StoryArchiveScreen() {
  const navigation = useNavigation();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Story | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { loadArchive(); }, []);

  async function loadArchive() {
    setLoading(true);
    try {
      const data = await apiFetch('/api/v1/stories/archive');
      setStories(data || []);
    } catch {}
    setLoading(false);
  }

  async function deleteStory(story: Story) {
    setDeleting(true);
    try {
      await apiFetch(`/api/v1/stories/${story.id_story}`, { method: 'DELETE' });
      setStories(prev => prev.filter(s => s.id_story !== story.id_story));
      setSelected(null);
    } catch {}
    setDeleting(false);
  }

  const is24hActive = (iso: string) => Date.now() - new Date(iso).getTime() < 86400000;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#f0f6fc" />
        </TouchableOpacity>
        <Text style={styles.title}>Archives</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator color="#22c55e" style={{ marginTop: 80 }} />
      ) : stories.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="time-outline" size={40} color="#22c55e" />
          </View>
          <Text style={styles.emptyTitle}>Aucune story archivée</Text>
          <Text style={styles.emptySubtitle}>Tes stories apparaîtront ici après expiration</Text>
        </View>
      ) : (
        <FlatList
          data={stories}
          keyExtractor={s => s.id_story}
          numColumns={2}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.gridItem}
              onPress={() => setSelected(item)}
              activeOpacity={0.85}
            >
              <Image source={{ uri: item.media_url }} style={styles.gridImg} resizeMode="cover" />
              <View style={styles.dateTag}>
                {is24hActive(item.created_at) && (
                  <View style={styles.activeDot} />
                )}
                <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal
        visible={!!selected}
        transparent
        animationType="fade"
        onRequestClose={() => setSelected(null)}
      >
        <View style={styles.modalBg}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            onPress={() => setSelected(null)}
            activeOpacity={1}
          />
          {selected && (
            <View style={styles.modalCard}>
              <Image source={{ uri: selected.media_url }} style={styles.modalImg} resizeMode="contain" />
              <View style={styles.modalFooter}>
                <Text style={styles.modalDate}>{formatDate(selected.created_at)}</Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteStory(selected)}
                  disabled={deleting}
                >
                  {deleting
                    ? <ActivityIndicator size="small" color="#f87171" />
                    : <Ionicons name="trash-outline" size={20} color="#f87171" />
                  }
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeModalBtn} onPress={() => setSelected(null)}>
                  <Ionicons name="close" size={20} color="#f0f6fc" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#21262d',
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#161b22', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#21262d',
  },
  title: { fontSize: 18, fontWeight: '800', color: '#f0f6fc' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  emptyIcon: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#22c55e15',
    justifyContent: 'center', alignItems: 'center',
  },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#f0f6fc' },
  emptySubtitle: { fontSize: 13, color: '#4b5563', textAlign: 'center', paddingHorizontal: 40 },
  grid: { padding: 8, paddingBottom: 40 },
  row: { gap: 8, marginBottom: 8 },
  gridItem: {
    flex: 1, aspectRatio: 0.75,
    borderRadius: 14, overflow: 'hidden',
    backgroundColor: '#161b22',
    position: 'relative',
  },
  gridImg: { width: '100%', height: '100%' },
  dateTag: {
    position: 'absolute', bottom: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  activeDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e',
  },
  dateText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  modalBg: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center', alignItems: 'center',
  },
  modalCard: {
    width: '90%', maxWidth: 400,
    backgroundColor: '#161b22', borderRadius: 20, overflow: 'hidden',
    borderWidth: 1, borderColor: '#21262d',
  },
  modalImg: { width: '100%', height: 480 },
  modalFooter: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderTopWidth: 1, borderTopColor: '#21262d', gap: 10,
  },
  modalDate: { fontSize: 13, color: '#8b949e' },
  deleteBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#2d1219', justifyContent: 'center', alignItems: 'center',
  },
  closeModalBtn: {
    width: 38, height: 38, borderRadius: 10,
    backgroundColor: '#21262d', justifyContent: 'center', alignItems: 'center',
  },
});
