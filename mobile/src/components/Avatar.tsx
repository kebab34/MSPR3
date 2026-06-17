import { View, Text, Image, StyleSheet } from 'react-native';

interface AvatarProps {
  uri?: string | null;
  initials: string;
  size?: number;
  withGlow?: boolean;
}

export default function Avatar({ uri, initials, size = 40, withGlow = false }: AvatarProps) {
  const radius = size / 2;
  const glowPad = Math.max(4, size * 0.1);

  const circle = (
    <View style={[styles.circle, { width: size, height: size, borderRadius: radius }]}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: radius }}
          resizeMode="cover"
        />
      ) : (
        <Text style={[styles.initials, { fontSize: size * 0.38 }]}>
          {initials.charAt(0).toUpperCase()}
        </Text>
      )}
    </View>
  );

  if (!withGlow) return circle;

  const glowSize = size + glowPad * 2;
  return (
    <View style={[styles.glow, { width: glowSize, height: glowSize, borderRadius: glowSize / 2 }]}>
      {circle}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: '#fff',
    fontWeight: '900',
  },
  glow: {
    backgroundColor: '#22c55e18',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
