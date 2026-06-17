import { useState, useCallback } from 'react';
import {
  View, FlatList, RefreshControl, StyleSheet, Text,
  Modal, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { apiFetch } from '../config/api';
import { supabase } from '../config/supabase';
import PostCard from '../components/PostCard';
import Avatar from '../components/Avatar';

export default function FeedScreen() {
  const navigation = useNavigation<any>();
  const [posts, setPosts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [commentaires, setCommentaires] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [currentUserId, setCurrentUserId] = useState('');
  const [sending, setSending] = useState(false);
  const [feedMode, setFeedMode] = useState<'all' | 'following'>('all');

  useFocusEffect(useCallback(() => {
    supabase.auth.getSession().then(({ data }) => setCurrentUserId(data.session?.user.id || ''));
    loadPosts(feedMode);
  }, [feedMode]));

  async function loadPosts(mode: 'all' | 'following' = feedMode) {
    const url = mode === 'following' ? '/api/v1/posts?following=true' : '/api/v1/posts';
    try { setPosts((await apiFetch(url)) || []); } catch {}
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true); await loadPosts(feedMode); setRefreshing(false);
  }, [feedMode]);

  async function openComments(post: any) {
    setSelectedPost(post);
    try { setCommentaires((await apiFetch(`/api/v1/posts/${post.id_post}/commentaires`)) || []); } catch {}
  }

  async function sendComment() {
    if (!newComment.trim() || !selectedPost || sending) return;
    setSending(true);
    try {
      await apiFetch(`/api/v1/posts/${selectedPost.id_post}/commentaires`, {
        method: 'POST', body: JSON.stringify({ contenu: newComment.trim() }),
      });
      setNewComment('');
      setCommentaires((await apiFetch(`/api/v1/posts/${selectedPost.id_post}/commentaires`)) || []);
    } catch {}
    setSending(false);
  }

  async function handleDelete(id_post: string) {
    try {
      await apiFetch(`/api/v1/posts/${id_post}`, { method: 'DELETE' });
      setPosts(prev => prev.filter(p => p.id_post !== id_post));
    } catch {}
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={posts}
        keyExtractor={item => item.id_post}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onComment={openComments}
            onDelete={item.id_utilisateur === currentUserId ? handleDelete : undefined}
            onUserPress={id => navigation.navigate('UserProfile', { id_utilisateur: id })}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22c55e" />}
        contentContainerStyle={posts.length === 0 ? styles.emptyContainer : styles.list}
        ListHeaderComponent={
          <View>
            <View style={styles.feedHeader}>
              <View>
                <Text style={styles.feedGreeting}>HealthAI</Text>
                <Text style={styles.feedTitle}>Fil d'actualité</Text>
              </View>
              <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
                <Ionicons name="refresh" size={18} color="#22c55e" />
              </TouchableOpacity>
            </View>
            <View style={styles.feedToggle}>
              <TouchableOpacity
                style={[styles.feedToggleBtn, feedMode === 'all' && styles.feedToggleBtnActive]}
                onPress={() => setFeedMode('all')}
              >
                <Ionicons name="globe-outline" size={14} color={feedMode === 'all' ? '#fff' : '#4b5563'} />
                <Text style={[styles.feedToggleText, feedMode === 'all' && styles.feedToggleTextActive]}>Tout</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.feedToggleBtn, feedMode === 'following' && styles.feedToggleBtnActive]}
                onPress={() => setFeedMode('following')}
              >
                <Ionicons name="people-outline" size={14} color={feedMode === 'following' ? '#fff' : '#4b5563'} />
                <Text style={[styles.feedToggleText, feedMode === 'following' && styles.feedToggleTextActive]}>Abonnements</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIconWrap}>
              <Ionicons name="leaf" size={40} color="#22c55e" />
            </View>
            <Text style={styles.emptyTitle}>Aucune publication</Text>
            <Text style={styles.emptySubtitle}>Sois le premier à partager quelque chose !</Text>
          </View>
        }
      />

      <Modal visible={!!selectedPost} animationType="slide" onRequestClose={() => setSelectedPost(null)}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Commentaires</Text>
            <TouchableOpacity onPress={() => setSelectedPost(null)} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color="#c9d1d9" />
            </TouchableOpacity>
          </View>

          <FlatList
            data={commentaires}
            keyExtractor={item => item.id_commentaire}
            renderItem={({ item }) => (
              <View style={styles.comment}>
                <Avatar
                  uri={item.utilisateurs?.avatar_url}
                  initials={(item.utilisateurs?.prenom || item.utilisateurs?.email || '?')}
                  size={32}
                />
                <View style={styles.commentBubble}>
                  <Text style={styles.commentAuthor}>
                    {item.utilisateurs?.prenom || item.utilisateurs?.email?.split('@')[0] || 'Utilisateur'}
                  </Text>
                  <Text style={styles.commentText}>{item.contenu}</Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyComments}>
                <Ionicons name="chatbubble-outline" size={36} color="#21262d" />
                <Text style={styles.emptyCommentsText}>Aucun commentaire</Text>
              </View>
            }
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          />

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.commentInputRow}>
              <TextInput
                style={styles.commentInput}
                placeholder="Ajouter un commentaire..."
                placeholderTextColor="#4b5563"
                value={newComment}
                onChangeText={setNewComment}
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!newComment.trim() || sending) && styles.sendBtnOff]}
                onPress={sendComment}
                disabled={!newComment.trim() || sending}
              >
                <Ionicons name="send" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117' },
  list: { padding: 14, paddingBottom: 110 },
  emptyContainer: { flexGrow: 1, padding: 14, paddingBottom: 110 },
  feedHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  feedGreeting: { fontSize: 12, fontWeight: '700', color: '#22c55e', letterSpacing: 2, textTransform: 'uppercase' },
  feedTitle: { fontSize: 26, fontWeight: '800', color: '#f0f6fc', marginTop: 2 },
  refreshBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#161b22', borderWidth: 1, borderColor: '#21262d',
    justifyContent: 'center', alignItems: 'center',
  },
  feedToggle: {
    flexDirection: 'row', backgroundColor: '#161b22', borderRadius: 14,
    padding: 4, marginBottom: 16, borderWidth: 1, borderColor: '#21262d',
  },
  feedToggleBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8, borderRadius: 11,
  },
  feedToggleBtnActive: { backgroundColor: '#22c55e' },
  feedToggleText: { fontSize: 13, fontWeight: '600', color: '#4b5563' },
  feedToggleTextActive: { color: '#fff' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14, paddingTop: 60 },
  emptyIconWrap: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: '#22c55e15',
    justifyContent: 'center', alignItems: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#f0f6fc' },
  emptySubtitle: { fontSize: 14, color: '#4b5563', textAlign: 'center' },
  modal: { flex: 1, backgroundColor: '#0d1117' },
  modalHandle: {
    width: 36, height: 4, backgroundColor: '#21262d', borderRadius: 2,
    alignSelf: 'center', marginTop: 12,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#21262d',
  },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#f0f6fc' },
  closeBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: '#161b22', justifyContent: 'center', alignItems: 'center',
  },
  comment: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 10 },
  commentAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center',
  },
  commentAvatarText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  commentBubble: {
    flex: 1, backgroundColor: '#161b22', borderRadius: 14, padding: 12,
    borderTopLeftRadius: 4, borderWidth: 1, borderColor: '#21262d',
  },
  commentAuthor: { fontWeight: '700', fontSize: 13, color: '#f0f6fc', marginBottom: 3 },
  commentText: { fontSize: 14, color: '#8b949e', lineHeight: 20 },
  emptyComments: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 60 },
  emptyCommentsText: { color: '#4b5563', fontSize: 15 },
  commentInputRow: {
    flexDirection: 'row', padding: 14, gap: 10,
    borderTopWidth: 1, borderTopColor: '#21262d',
  },
  commentInput: {
    flex: 1, backgroundColor: '#161b22', borderRadius: 24, paddingHorizontal: 18,
    paddingVertical: 12, fontSize: 14, color: '#f0f6fc',
    borderWidth: 1, borderColor: '#21262d',
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center',
  },
  sendBtnOff: { backgroundColor: '#1a3a1a' },
});
