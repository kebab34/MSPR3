import { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, Dimensions, Modal, ActivityIndicator, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiFetch } from '../config/api';

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - 40 - 4) / 3;

export default function UserProfileScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { id_utilisateur } = route.params as { id_utilisateur: string };

  const [profile, setProfile] = useState<any>(null);
  const [ownId, setOwnId] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, [id_utilisateur]);

  async function loadData() {
    setLoading(true);
    try {
      const [me, data] = await Promise.all([
        apiFetch('/api/v1/auth/me'),
        apiFetch(`/api/v1/users/${id_utilisateur}`),
      ]);
      setOwnId(me.id_utilisateur);
      setProfile(data);
      setIsFollowing(data.is_following);
    } catch {}
    setLoading(false);
  }

  async function toggleFollow() {
    if (followLoading) return;
    setFollowLoading(true);
    const wasFollowing = isFollowing;
    setIsFollowing(!wasFollowing);
    setProfile((p: any) => ({
      ...p,
      followers_count: (p.followers_count || 0) + (wasFollowing ? -1 : 1),
    }));
    try {
      await apiFetch(`/api/v1/users/${id_utilisateur}/follow`, {
        method: wasFollowing ? 'DELETE' : 'POST',
      });
    } catch {
      setIsFollowing(wasFollowing);
      setProfile((p: any) => ({
        ...p,
        followers_count: (p.followers_count || 0) + (wasFollowing ? 1 : -1),
      }));
    }
    setFollowLoading(false);
  }

  const isOwnProfile = ownId && ownId === id_utilisateur;
  const initials = (profile?.prenom || profile?.email || '?').charAt(0).toUpperCase();
  const displayName = profile?.prenom || profile?.nom
    ? `${profile?.prenom || ''} ${profile?.nom || ''}`.trim()
    : profile?.email?.split('@')[0] || 'Utilisateur';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#f0f6fc" />
        </TouchableOpacity>
        <Text style={styles.topBarTitle} numberOfLines={1}>{loading ? '' : displayName}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <ActivityIndicator color="#22c55e" style={{ marginTop: 80 }} />
      ) : !profile ? (
        <View style={styles.errorWrap}>
          <Ionicons name="person-outline" size={48} color="#21262d" />
          <Text style={styles.errorText}>Utilisateur introuvable</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.header}>
            <View style={styles.avatarGlow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            </View>
            <Text style={styles.displayName}>{displayName}</Text>
            <View style={styles.emailBadge}>
              <Ionicons name="mail-outline" size={12} color="#4b5563" />
              <Text style={styles.emailText}>{profile.email}</Text>
            </View>

            {/* Stats */}
            <View style={styles.stats}>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{profile.posts_count || 0}</Text>
                <Text style={styles.statLabel}>Publications</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNum}>{profile.followers_count || 0}</Text>
                <Text style={styles.statLabel}>Abonnés</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNum}>{profile.following_count || 0}</Text>
                <Text style={styles.statLabel}>Abonnements</Text>
              </View>
            </View>

            {/* Bouton follow */}
            {!isOwnProfile && (
              <TouchableOpacity
                style={[styles.followBtn, isFollowing && styles.followBtnActive]}
                onPress={toggleFollow}
                disabled={followLoading}
                activeOpacity={0.8}
              >
                {followLoading ? (
                  <ActivityIndicator size="small" color={isFollowing ? '#22c55e' : '#fff'} />
                ) : (
                  <>
                    <Ionicons
                      name={isFollowing ? 'checkmark-circle' : 'person-add-outline'}
                      size={16}
                      color={isFollowing ? '#22c55e' : '#fff'}
                    />
                    <Text style={[styles.followBtnText, isFollowing && styles.followBtnTextActive]}>
                      {isFollowing ? 'Abonné' : 'Suivre'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.sectionHeader}>
            <Ionicons name="grid-outline" size={16} color="#22c55e" />
            <Text style={styles.sectionTitle}>Publications</Text>
          </View>

          {profile.posts?.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="images-outline" size={48} color="#21262d" />
              <Text style={styles.emptyText}>Aucune publication</Text>
            </View>
          ) : (
            <View style={styles.grid}>
              {(profile.posts || []).map((post: any) => (
                <TouchableOpacity
                  key={post.id_post}
                  style={styles.gridItem}
                  onPress={() => setSelectedPost(post)}
                  activeOpacity={0.8}
                >
                  {post.media_url ? (
                    <Image source={{ uri: post.media_url }} style={styles.gridImg} resizeMode="cover" />
                  ) : (
                    <View style={styles.gridText}>
                      <Text style={styles.gridTextContent} numberOfLines={4}>{post.contenu}</Text>
                    </View>
                  )}
                  <View style={styles.gridOverlay}>
                    <Ionicons name="heart" size={12} color="#fff" />
                    <Text style={styles.gridOverlayText}>{post.likes_count || 0}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      )}

      <Modal visible={!!selectedPost} animationType="fade" transparent onRequestClose={() => setSelectedPost(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setSelectedPost(null)}>
              <Ionicons name="close" size={22} color="#f0f6fc" />
            </TouchableOpacity>
            {selectedPost?.media_url && (
              <Image source={{ uri: selectedPost.media_url }} style={styles.modalImg} resizeMode="cover" />
            )}
            {selectedPost?.contenu ? (
              <Text style={styles.modalContent}>{selectedPost.contenu}</Text>
            ) : null}
            <View style={styles.modalActions}>
              <View style={styles.modalAction}>
                <Ionicons
                  name={selectedPost?.liked_by_me ? 'heart' : 'heart-outline'}
                  size={16} color={selectedPost?.liked_by_me ? '#f43f5e' : '#4b5563'}
                />
                <Text style={styles.modalActionText}>{selectedPost?.likes_count || 0} j'aime</Text>
              </View>
              <View style={styles.modalAction}>
                <Ionicons name="chatbubble-outline" size={16} color="#4b5563" />
                <Text style={styles.modalActionText}>{selectedPost?.comments_count || 0} commentaires</Text>
              </View>
            </View>
          </View>
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
  topBarTitle: { fontSize: 16, fontWeight: '700', color: '#f0f6fc', flex: 1, textAlign: 'center' },
  scroll: { paddingBottom: 40 },
  header: { alignItems: 'center', paddingTop: 24, paddingHorizontal: 20, paddingBottom: 20, gap: 6 },
  avatarGlow: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#22c55e18', justifyContent: 'center', alignItems: 'center', marginBottom: 6,
  },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#22c55e', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 18, elevation: 10,
  },
  avatarText: { color: '#fff', fontSize: 34, fontWeight: '900' },
  displayName: { fontSize: 22, fontWeight: '800', color: '#f0f6fc' },
  emailBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#161b22', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: '#21262d',
  },
  emailText: { fontSize: 12, color: '#4b5563' },
  stats: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#161b22', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 24,
    borderWidth: 1, borderColor: '#21262d', width: '100%', marginTop: 10,
  },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800', color: '#f0f6fc' },
  statLabel: { fontSize: 11, color: '#4b5563', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: '#21262d' },
  followBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#22c55e', borderRadius: 14, paddingVertical: 12, paddingHorizontal: 32,
    width: '100%', marginTop: 6,
    shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  followBtnActive: {
    backgroundColor: '#161b22', borderWidth: 1, borderColor: '#22c55e',
    shadowOpacity: 0, elevation: 0,
  },
  followBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  followBtnTextActive: { color: '#22c55e' },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#21262d',
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#f0f6fc' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 2 },
  gridItem: {
    width: GRID_SIZE, height: GRID_SIZE, margin: 1,
    backgroundColor: '#161b22', overflow: 'hidden', position: 'relative',
  },
  gridImg: { width: '100%', height: '100%' },
  gridText: {
    width: '100%', height: '100%', backgroundColor: '#161b22',
    justifyContent: 'center', padding: 8,
  },
  gridTextContent: { fontSize: 11, color: '#8b949e', lineHeight: 16 },
  gridOverlay: {
    position: 'absolute', bottom: 4, right: 4,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2,
  },
  gridOverlayText: { fontSize: 10, color: '#fff', fontWeight: '700' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: '#4b5563', fontSize: 15 },
  errorWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  errorText: { color: '#4b5563', fontSize: 16 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center', alignItems: 'center', padding: 20,
  },
  modalCard: {
    backgroundColor: '#161b22', borderRadius: 20, overflow: 'hidden',
    width: '100%', maxWidth: 440, borderWidth: 1, borderColor: '#21262d',
  },
  modalClose: {
    position: 'absolute', top: 12, right: 12, zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 16, padding: 4,
  },
  modalImg: { width: '100%', height: 280 },
  modalContent: { padding: 16, fontSize: 15, color: '#c9d1d9', lineHeight: 22 },
  modalActions: {
    flexDirection: 'row', gap: 16, padding: 16,
    borderTopWidth: 1, borderTopColor: '#21262d',
  },
  modalAction: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modalActionText: { fontSize: 13, color: '#4b5563', fontWeight: '600' },
});
