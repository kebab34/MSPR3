import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, SafeAreaView, ActivityIndicator, FlatList,
  Image, Dimensions, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../config/supabase';
import { apiFetch } from '../config/api';

const { width } = Dimensions.get('window');
const GRID_SIZE = (width - 40 - 4) / 3;

type Tab = 'posts' | 'liked' | 'edit';

export default function ProfileScreen() {
  const [email, setEmail] = useState('');
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<Tab>('posts');
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  useFocusEffect(useCallback(() => { loadAll(); }, []));

  async function loadAll() {
    const { data } = await supabase.auth.getSession();
    setEmail(data.session?.user.email || '');
    try {
      const profile = await apiFetch('/api/v1/auth/me');
      setNom(profile.nom || ''); setPrenom(profile.prenom || '');
    } catch {}
    loadPosts();
  }

  async function loadPosts() {
    setLoadingPosts(true);
    try {
      const [mine, liked] = await Promise.all([
        apiFetch('/api/v1/posts/me'),
        apiFetch('/api/v1/posts/liked'),
      ]);
      setMyPosts(mine || []);
      setLikedPosts(liked || []);
    } catch {}
    setLoadingPosts(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await apiFetch('/api/v1/auth/me', { method: 'PATCH', body: JSON.stringify({ nom, prenom }) });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {}
    setSaving(false);
  }

  const initials = (prenom || email).charAt(0).toUpperCase() || '?';
  const displayName = prenom || nom ? `${prenom} ${nom}`.trim() : 'Mon profil';
  const postsData = tab === 'liked' ? likedPosts : myPosts;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} stickyHeaderIndices={[1]}>

        {/* Header profil */}
        <View style={styles.header}>
          <View style={styles.avatarGlow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
          </View>
          <Text style={styles.displayName}>{displayName}</Text>
          <View style={styles.emailBadge}>
            <Ionicons name="mail-outline" size={12} color="#4b5563" />
            <Text style={styles.emailText}>{email}</Text>
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{myPosts.length}</Text>
              <Text style={styles.statLabel}>Publications</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>{likedPosts.length}</Text>
              <Text style={styles.statLabel}>J'aime</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNum}>
                {myPosts.reduce((s, p) => s + (p.likes_count || 0), 0)}
              </Text>
              <Text style={styles.statLabel}>Likes reçus</Text>
            </View>
          </View>

          {/* Actions rapides */}
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => setTab('edit')}>
              <Ionicons name="pencil-outline" size={16} color="#f0f6fc" />
              <Text style={styles.editBtnText}>Modifier le profil</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Onglets sticky */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'posts' && styles.tabActive]}
            onPress={() => setTab('posts')}
          >
            <Ionicons name="grid-outline" size={18} color={tab === 'posts' ? '#22c55e' : '#4b5563'} />
            <Text style={[styles.tabLabel, tab === 'posts' && styles.tabLabelActive]}>Posts</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'liked' && styles.tabActive]}
            onPress={() => setTab('liked')}
          >
            <Ionicons name="heart-outline" size={18} color={tab === 'liked' ? '#22c55e' : '#4b5563'} />
            <Text style={[styles.tabLabel, tab === 'liked' && styles.tabLabelActive]}>J'aime</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'edit' && styles.tabActive]}
            onPress={() => setTab('edit')}
          >
            <Ionicons name="settings-outline" size={18} color={tab === 'edit' ? '#22c55e' : '#4b5563'} />
            <Text style={[styles.tabLabel, tab === 'edit' && styles.tabLabelActive]}>Paramètres</Text>
          </TouchableOpacity>
        </View>

        {/* Contenu selon l'onglet */}
        {(tab === 'posts' || tab === 'liked') && (
          <View style={styles.gridSection}>
            {loadingPosts ? (
              <ActivityIndicator color="#22c55e" style={{ marginTop: 40 }} />
            ) : postsData.length === 0 ? (
              <View style={styles.emptyTab}>
                <Ionicons
                  name={tab === 'liked' ? 'heart-outline' : 'images-outline'}
                  size={48} color="#21262d"
                />
                <Text style={styles.emptyTabText}>
                  {tab === 'liked' ? 'Aucun post liké' : 'Aucune publication'}
                </Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {postsData.map(post => (
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
                    {/* Overlay likes */}
                    <View style={styles.gridOverlay}>
                      <Ionicons name="heart" size={12} color="#fff" />
                      <Text style={styles.gridOverlayText}>{post.likes_count || 0}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {tab === 'edit' && (
          <View style={styles.editSection}>
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person-outline" size={16} color="#22c55e" />
                <Text style={styles.sectionTitle}>Informations personnelles</Text>
              </View>
              <Text style={styles.label}>Prénom</Text>
              <View style={styles.inputWrap}>
                <TextInput style={styles.input} value={prenom} onChangeText={setPrenom} placeholder="Votre prénom" placeholderTextColor="#4b5563" />
              </View>
              <Text style={styles.label}>Nom</Text>
              <View style={styles.inputWrap}>
                <TextInput style={styles.input} value={nom} onChangeText={setNom} placeholder="Votre nom" placeholderTextColor="#4b5563" />
              </View>
              <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving} activeOpacity={0.85}>
                {saving ? <ActivityIndicator color="#fff" size="small" />
                  : saved
                    ? <><Ionicons name="checkmark-circle" size={18} color="#fff" /><Text style={styles.saveBtnText}>Enregistré !</Text></>
                    : <><Ionicons name="save-outline" size={18} color="#fff" /><Text style={styles.saveBtnText}>Enregistrer</Text></>
                }
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutBtn} onPress={() => supabase.auth.signOut()} activeOpacity={0.85}>
              <Ionicons name="log-out-outline" size={18} color="#f87171" />
              <Text style={styles.logoutText}>Se déconnecter</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Modal détail post */}
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
                <Ionicons name="heart" size={16} color="#f43f5e" />
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
  scroll: { paddingBottom: 110 },
  header: { alignItems: 'center', paddingTop: 24, paddingHorizontal: 20, paddingBottom: 20 },
  avatarGlow: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: '#22c55e18', justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatar: {
    width: 84, height: 84, borderRadius: 42,
    backgroundColor: '#22c55e', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#22c55e', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 18, elevation: 10,
  },
  avatarText: { color: '#fff', fontSize: 34, fontWeight: '900' },
  displayName: { fontSize: 22, fontWeight: '800', color: '#f0f6fc', marginBottom: 6 },
  emailBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#161b22', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: '#21262d', marginBottom: 20,
  },
  emailText: { fontSize: 12, color: '#4b5563' },
  stats: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#161b22', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 24,
    borderWidth: 1, borderColor: '#21262d', width: '100%', marginBottom: 14,
  },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 22, fontWeight: '800', color: '#f0f6fc' },
  statLabel: { fontSize: 11, color: '#4b5563', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: '#21262d' },
  headerActions: { width: '100%' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#161b22', borderRadius: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: '#21262d',
  },
  editBtnText: { color: '#f0f6fc', fontWeight: '600', fontSize: 14 },
  tabBar: {
    flexDirection: 'row', backgroundColor: '#0d1117',
    borderBottomWidth: 1, borderBottomColor: '#21262d',
  },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#22c55e' },
  tabLabel: { fontSize: 13, fontWeight: '600', color: '#4b5563' },
  tabLabelActive: { color: '#22c55e' },
  gridSection: { padding: 2, minHeight: 200 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: {
    width: GRID_SIZE, height: GRID_SIZE, margin: 1,
    backgroundColor: '#161b22', overflow: 'hidden',
    position: 'relative',
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
  emptyTab: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyTabText: { color: '#4b5563', fontSize: 15 },
  editSection: { padding: 20 },
  section: {
    backgroundColor: '#161b22', borderRadius: 20, padding: 20, marginBottom: 16,
    borderWidth: 1, borderColor: '#21262d',
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#f0f6fc' },
  label: { fontSize: 11, fontWeight: '700', color: '#4b5563', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  inputWrap: {
    backgroundColor: '#0d1117', borderRadius: 12, borderWidth: 1,
    borderColor: '#21262d', marginBottom: 16, paddingHorizontal: 14,
  },
  input: { paddingVertical: 13, fontSize: 15, color: '#f0f6fc' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: '#22c55e', borderRadius: 12, paddingVertical: 14, marginTop: 4,
    shadowColor: '#22c55e', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  saveBtnText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderWidth: 1, borderColor: '#2d1219', borderRadius: 14, paddingVertical: 14,
    backgroundColor: '#1a0d0d',
  },
  logoutText: { color: '#f87171', fontWeight: '700', fontSize: 15 },
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
