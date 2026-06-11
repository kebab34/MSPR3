import { useState, useEffect, useCallback } from 'react';
import {
  View, FlatList, RefreshControl, StyleSheet,
  Text, Modal, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { apiFetch } from '../config/api';
import { supabase } from '../config/supabase';
import PostCard from '../components/PostCard';

export default function FeedScreen() {
  const [posts, setPosts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [commentaires, setCommentaires] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setCurrentUserId(data.session?.user.id || '');
    });
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      const data = await apiFetch('/api/v1/posts');
      setPosts(data || []);
    } catch {}
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPosts();
    setRefreshing(false);
  }, []);

  async function openComments(post: any) {
    setSelectedPost(post);
    try {
      const data = await apiFetch(`/api/v1/posts/${post.id_post}/commentaires`);
      setCommentaires(data || []);
    } catch {}
  }

  async function sendComment() {
    if (!newComment.trim() || !selectedPost) return;
    try {
      await apiFetch(`/api/v1/posts/${selectedPost.id_post}/commentaires`, {
        method: 'POST',
        body: JSON.stringify({ contenu: newComment.trim() }),
      });
      setNewComment('');
      const data = await apiFetch(`/api/v1/posts/${selectedPost.id_post}/commentaires`);
      setCommentaires(data || []);
    } catch {}
  }

  async function handleDelete(id_post: string) {
    try {
      await apiFetch(`/api/v1/posts/${id_post}`, { method: 'DELETE' });
      setPosts(prev => prev.filter(p => p.id_post !== id_post));
    } catch {}
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={item => item.id_post}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onComment={openComments}
            onDelete={item.id_utilisateur === currentUserId ? handleDelete : undefined}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>Aucune publication pour l'instant.</Text>}
      />

      <Modal visible={!!selectedPost} animationType="slide" onRequestClose={() => setSelectedPost(null)}>
        <KeyboardAvoidingView style={styles.modal} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Commentaires</Text>
            <TouchableOpacity onPress={() => setSelectedPost(null)}>
              <Text style={styles.closeBtn}>Fermer</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={commentaires}
            keyExtractor={item => item.id_commentaire}
            renderItem={({ item }) => (
              <View style={styles.comment}>
                <Text style={styles.commentAuthor}>
                  {item.utilisateurs?.prenom || item.utilisateurs?.email || 'Utilisateur'}
                </Text>
                <Text>{item.contenu}</Text>
              </View>
            )}
            ListEmptyComponent={<Text style={styles.empty}>Aucun commentaire.</Text>}
            style={styles.commentList}
          />
          <View style={styles.commentInput}>
            <TextInput
              style={styles.input}
              placeholder="Ajouter un commentaire..."
              value={newComment}
              onChangeText={setNewComment}
            />
            <TouchableOpacity style={styles.sendBtn} onPress={sendComment}>
              <Text style={styles.sendText}>Envoyer</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  list: { padding: 12 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 16 },
  modal: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  closeBtn: { color: '#16a34a', fontSize: 16 },
  commentList: { flex: 1, padding: 12 },
  comment: { marginBottom: 12, padding: 12, backgroundColor: '#f3f4f6', borderRadius: 8 },
  commentAuthor: { fontWeight: '600', marginBottom: 4 },
  commentInput: { flexDirection: 'row', padding: 12, borderTopWidth: 1, borderTopColor: '#e5e7eb', gap: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10 },
  sendBtn: { backgroundColor: '#16a34a', paddingHorizontal: 16, borderRadius: 8, justifyContent: 'center' },
  sendText: { color: '#fff', fontWeight: 'bold' },
});
