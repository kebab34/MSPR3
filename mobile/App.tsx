import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import Navigation from './src/navigation';

export default function App() {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      ImagePicker.requestCameraPermissionsAsync();
      ImagePicker.requestMediaLibraryPermissionsAsync();
    }
  }, []);

  return <Navigation />;
}
