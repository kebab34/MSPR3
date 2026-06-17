import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiFetch } from '../config/api';

const { width } = Dimensions.get('window');

interface PostCardProps {
  post: any;
  onComment: (post: any) => void;
  onDelete?: (id: string) => void;
  onUserPress?: (id_utilisateur: string) => void;
}

export default function PostCard({ post, onComment, onDelete, onUserPress }: PostCardProps) {
  const [liked, setLiked] = useState(post.liked_by_me || false);
  const [likesCount, setLikesCount] = useState(post.likes_count || 0);

  const initials = (post.utilisateurs?.prenom || post.utilisateurs?.email || '?')
    .charAt(0).toUpperCase();
  const displayName = post.utilisateurs?.prenom && post.utilisateurs?.nom
    ? `${post.utilisateurs.prenom} ${post.utilisateurs.nom}`
    : post.utilisateurs?.email?.split('@')[0] || 'Utilisateur';

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "À l'instant";
    if (m < 60) return `${m}min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}j`;
  };

  async function toggleLike() {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikesCount((c: number) => wasLiked ? c - 1 : c + 1);
    try {
      await apiFetch(`/api/v1/posts/${post.id_post}/likes`, { method: 'POST' });
    } catch {
      setLiked(wasLiked);
      setLikesCount((c: number) => wasLiked ? c + 1 : c - 1);
    }
  }

  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => onUserPress?.(post.id_utilisateur)}
          activeOpacity={onUserPress ? 0.7 : 1}
          style={styles.avatarGlow}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerInfo}
          onPress={() => onUserPress?.(post.id_utilisateur)}
          activeOpacity={onUserPress ? 0.7 : 1}
        >
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.time}>{timeAgo(post.created_at)}</Text>
        </TouchableOpacity>
        {onDelete && (
          <TouchableOpacity onPress={() => onDelete(post.id_post)} style={styles.deleteBtn}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#4b5563" />
          </TouchableOpacity>
        )}
      </View>

      {/* Content */}
      {post.contenu ? <Text style={styles.content}>{post.contenu}</Text> : null}

      {/* Image */}
      {post.media_url && post.media_type === 'image' && (
        <Image source={{ uri: post.media_url }} style={styles.image} resizeMode="cover" />
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.action} onPress={toggleLike} activeOpacity={0.7}>
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={24}
            color={liked ? '#f43f5e' : '#6b7280'}
          />
          <Text style={[styles.actionCount, liked && { color: '#f43f5e' }]}>
            {likesCount > 0 ? likesCount : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.action} onPress={() => onComment(post)} activeOpacity={0.7}>
          <Ionicons name="chatbubble-outline" size={22} color="#6b7280" />
          <Text style={styles.actionCount}>
            {post.comments_count > 0 ? post.comments_count : ''}
          </Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />
        <TouchableOpacity activeOpacity={0.7}>
          <Ionicons name="bookmark-outline" size={22} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#161b22',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#21262d',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  avatarGlow: {
    borderRadius: 24,
    padding: 2,
    backgroundColor: '#22c55e22',
    marginRight: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  headerInfo: { flex: 1 },
  name: { fontWeight: '700', fontSize: 14, color: '#f0f6fc', letterSpacing: 0.2 },
  time: { fontSize: 12, color: '#4b5563', marginTop: 1 },
  deleteBtn: { padding: 6 },
  content: {
    fontSize: 15,
    color: '#c9d1d9',
    lineHeight: 23,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  image: {
    width: '100%',
    height: 260,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 18,
    borderTopWidth: 1,
    borderTopColor: '#21262d',
  },
  action: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  actionCount: { fontSize: 14, color: '#6b7280', fontWeight: '600', minWidth: 16 },
});
