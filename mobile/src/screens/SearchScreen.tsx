import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  FlatList, SafeAreaView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { apiFetch } from '../config/api';
import Avatar from '../components/Avatar';

export default function SearchScreen() {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(() => search(query), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  async function search(q: string) {
    setLoading(true);
    try {
      const data = await apiFetch(`/api/v1/users/search?q=${encodeURIComponent(q)}`);
      setResults(data || []);
      const map: Record<string, boolean> = {};
      (data || []).forEach((u: any) => { map[u.id_utilisateur] = u.is_following; });
      setFollowingMap(map);
    } catch {}
    setLoading(false);
  }

  async function toggleFollow(id: string) {
    const wasFollowing = followingMap[id];
    setFollowingMap(prev => ({ ...prev, [id]: !wasFollowing }));
    try {
      await apiFetch(`/api/v1/users/${id}/follow`, { method: wasFollowing ? 'DELETE' : 'POST' });
    } catch {
      setFollowingMap(prev => ({ ...prev, [id]: wasFollowing }));
    }
  }

  const initials = (u: any) =>
    (u.prenom || u.email || '?').charAt(0).toUpperCase();
  const displayName = (u: any) =>
    u.prenom || u.nom ? `${u.prenom || ''} ${u.nom || ''}`.trim() : u.email?.split('@')[0] || 'Utilisateur';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Recherche</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="#4b5563" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Nom, prénom ou email..."
            placeholderTextColor="#4b5563"
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={18} color="#4b5563" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Contenu */}
      {loading ? (
        <ActivityIndicator color="#22c55e" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={results}
          keyExtractor={item => item.id_utilisateur}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              <TouchableOpacity
                style={styles.userInfo}
                onPress={() => navigation.navigate('UserProfile', { id_utilisateur: item.id_utilisateur })}
                activeOpacity={0.8}
              >
                <Avatar uri={item.avatar_url} initials={initials(item)} size={48} withGlow />
                <View style={styles.userText}>
                  <Text style={styles.userName}>{displayName(item)}</Text>
                  <Text style={styles.userEmail}>{item.email}</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.followBtn, followingMap[item.id_utilisateur] && styles.followBtnActive]}
                onPress={() => toggleFollow(item.id_utilisateur)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={followingMap[item.id_utilisateur] ? 'checkmark' : 'person-add-outline'}
                  size={14}
                  color={followingMap[item.id_utilisateur] ? '#22c55e' : '#fff'}
                />
                <Text style={[styles.followBtnText, followingMap[item.id_utilisateur] && styles.followBtnTextActive]}>
                  {followingMap[item.id_utilisateur] ? 'Abonné' : 'Suivre'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            query.trim() ? (
              <View style={styles.empty}>
                <Ionicons name="person-outline" size={48} color="#21262d" />
                <Text style={styles.emptyTitle}>Aucun résultat</Text>
                <Text style={styles.emptySubtitle}>Essaie avec un autre nom ou email</Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <Ionicons name="search" size={36} color="#22c55e" />
                </View>
                <Text style={styles.emptyTitle}>Trouve des gens</Text>
                <Text style={styles.emptySubtitle}>Cherche par nom, prénom ou email</Text>
              </View>
            )
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d1117' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '800', color: '#f0f6fc', marginBottom: 14 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#161b22', borderRadius: 16,
    borderWidth: 1, borderColor: '#21262d', paddingHorizontal: 14,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#f0f6fc' },
  clearBtn: { padding: 4 },
  list: { padding: 16, paddingBottom: 110 },
  userCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#161b22', borderRadius: 16,
    borderWidth: 1, borderColor: '#21262d',
    padding: 14, marginBottom: 10,
  },
  userInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  userText: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700', color: '#f0f6fc' },
  userEmail: { fontSize: 12, color: '#4b5563', marginTop: 2 },
  followBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#22c55e', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    shadowColor: '#22c55e', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  followBtnActive: {
    backgroundColor: '#161b22', borderWidth: 1, borderColor: '#22c55e',
    shadowOpacity: 0, elevation: 0,
  },
  followBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  followBtnTextActive: { color: '#22c55e' },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#22c55e15', justifyContent: 'center', alignItems: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#f0f6fc' },
  emptySubtitle: { fontSize: 14, color: '#4b5563', textAlign: 'center' },
});
