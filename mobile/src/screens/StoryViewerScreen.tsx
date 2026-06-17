import { useState, useEffect, useRef } from 'react';
import {
  View, Text, Image, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { apiFetch } from '../config/api';
import Avatar from '../components/Avatar';

const STORY_DURATION = 5000;

interface Story {
  id_story: string;
  media_url: string;
  created_at: string;
  id_utilisateur: string;
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

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return `${Math.max(1, Math.floor(diff / 60000))} min`;
  return `${h}h`;
}

export default function StoryViewerScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { groups, groupIndex: initialGroupIndex } = route.params as {
    groups: StoryGroup[];
    groupIndex: number;
  };

  const [groupIdx, setGroupIdx] = useState(initialGroupIndex);
  const [storyIdx, setStoryIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const nextRef = useRef<() => void>(() => {});
  const intervalRef = useRef<any>(null);

  const currentGroup = groups[groupIdx];
  const currentStory = currentGroup?.stories[storyIdx];

  function goNext() {
    const group = groups[groupIdx];
    if (storyIdx < group.stories.length - 1) {
      setStoryIdx(s => s + 1);
    } else if (groupIdx < groups.length - 1) {
      setGroupIdx(g => g + 1);
      setStoryIdx(0);
    } else {
      navigation.goBack();
    }
  }

  function goPrev() {
    if (storyIdx > 0) {
      setStoryIdx(s => s - 1);
    } else if (groupIdx > 0) {
      setGroupIdx(g => g - 1);
      setStoryIdx(0);
    }
  }

  nextRef.current = goNext;

  useEffect(() => {
    setProgress(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
    const start = Date.now();
    intervalRef.current = setInterval(() => {
      const p = (Date.now() - start) / STORY_DURATION;
      if (p >= 1) {
        clearInterval(intervalRef.current);
        setProgress(1);
        nextRef.current();
      } else {
        setProgress(p);
      }
    }, 50);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [groupIdx, storyIdx]);

  async function deleteStory() {
    if (!currentStory || !currentGroup.is_own || deleting) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/v1/stories/${currentStory.id_story}`, { method: 'DELETE' });
      goNext();
    } catch {}
    setDeleting(false);
  }

  if (!currentGroup || !currentStory) return null;

  const displayName = currentGroup.user.prenom || currentGroup.user.nom
    ? `${currentGroup.user.prenom || ''} ${currentGroup.user.nom || ''}`.trim()
    : currentGroup.user.email?.split('@')[0] || '';
  const initials = (currentGroup.user.prenom || currentGroup.user.email || '?').charAt(0).toUpperCase();

  return (
    <View style={styles.container}>
      <Image source={{ uri: currentStory.media_url }} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <View style={styles.overlay} />

      {/* Tap zones — behind the top bar */}
      <View style={styles.tapZones}>
        <TouchableOpacity style={styles.tapLeft} onPress={goPrev} activeOpacity={1} />
        <TouchableOpacity style={styles.tapRight} onPress={goNext} activeOpacity={1} />
      </View>

      {/* Top bar — in front of tap zones */}
      <SafeAreaView style={styles.topArea}>
        <View style={styles.progressBars}>
          {currentGroup.stories.map((_, i) => (
            <View key={i} style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: i < storyIdx ? '100%' : i === storyIdx ? `${progress * 100}%` : '0%' } as any,
                ]}
              />
            </View>
          ))}
        </View>

        <View style={styles.topBar}>
          <Avatar uri={currentGroup.user.avatar_url} initials={initials} size={36} />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{displayName}</Text>
            <Text style={styles.storyTime}>{timeAgo(currentStory.created_at)}</Text>
          </View>
          {currentGroup.is_own && (
            <TouchableOpacity onPress={deleteStory} style={styles.iconBtn} disabled={deleting}>
              {deleting
                ? <ActivityIndicator size="small" color="#fff" />
                : <Ionicons name="trash-outline" size={20} color="rgba(255,255,255,0.85)" />
              }
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="close" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.12)' },
  tapZones: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    flexDirection: 'row', zIndex: 1,
  },
  tapLeft: { flex: 1 },
  tapRight: { flex: 2 },
  topArea: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10,
  },
  progressBars: {
    flexDirection: 'row', paddingHorizontal: 10, paddingTop: 10, gap: 4,
  },
  progressBarBg: {
    flex: 1, height: 2.5,
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 2, overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%', backgroundColor: '#fff', borderRadius: 2,
  },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10, gap: 10,
  },
  userInfo: { flex: 1 },
  userName: {
    color: '#fff', fontWeight: '700', fontSize: 14,
    textShadowColor: 'rgba(0,0,0,0.7)', textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 1 },
  },
  storyTime: { color: 'rgba(255,255,255,0.65)', fontSize: 11, marginTop: 1 },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center', alignItems: 'center',
  },
});
