import { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { apiFetch } from '../config/api';

interface Post {
  id_post: string;
  contenu: string;
  media_url?: string;
  media_type?: string;
  liked_by_me: boolean;
  likes_count: number;
  comments_count: number;
  created_at: string;
  utilisateurs?: { nom?: string; prenom?: string; email: string };
}

interface Props {
  post: Post;
  onComment: (post: Post) => void;
  onDelete?: (id: string) => void;
  currentUserId?: string;
}

export default function PostCard({ post, onComment, onDelete, currentUserId }: Props) {
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likesCount, setLikesCount] = useState(post.likes_count);

  async function handleLike() {
    try {
      const res = await apiFetch(`/api/v1/posts/${post.id_post}/likes`, { method: 'POST' });
      setLiked(res.liked);
      setLikesCount(prev => res.liked ? prev + 1 : prev - 1);
    } catch {}
  }

  const author = post.utilisateurs;
  const authorName = author?.prenom || author?.nom || author?.email || 'Utilisateur';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{authorName[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.authorName}>{authorName}</Text>
        {onDelete && (
          <TouchableOpacity onPress={() => onDelete(post.id_post)} style={styles.deleteBtn}>
            <Text style={styles.deleteText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={styles.contenu}>{post.contenu}</Text>

      {post.media_url && post.media_type === 'image' && (
        <Image source={{ uri: post.media_url }} style={styles.media} resizeMode="cover" />
      )}

      <View style={styles.actions}>
        <TouchableOpacity onPress={handleLike} style={styles.actionBtn}>
          <Text style={[styles.actionText, liked && styles.liked]}>
            {liked ? '❤️' : '🤍'} {likesCount}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => onComment(post)} style={styles.actionBtn}>
          <Text style={styles.actionText}>💬 {post.comments_count}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', marginBottom: 12, padding: 16, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#16a34a', justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  authorName: { fontWeight: '600', fontSize: 15, flex: 1 },
  deleteBtn: { padding: 4 },
  deleteText: { color: '#ef4444', fontSize: 14 },
  contenu: { fontSize: 15, lineHeight: 22, marginBottom: 10 },
  media: { width: '100%', height: 200, borderRadius: 8, marginBottom: 10 },
  actions: { flexDirection: 'row', gap: 16, borderTopWidth: 1, borderTopColor: '#f3f4f6', paddingTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionText: { fontSize: 15, color: '#6b7280' },
  liked: { color: '#ef4444' },
});
