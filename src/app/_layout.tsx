// Root layout. The agent edits THIS file to set the navigation shell
// (bottom-tabs / drawer / stack-only / custom-floating). TokenProvider must
// stay outermost so every shell reads from useTokens().
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TokenProvider, useTokens } from '@/lib/tokens';

function ThemedStatusBar() {
  const t = useTokens();
  return <StatusBar style={t.palette.mode === 'dark' ? 'light' : 'dark'} />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <TokenProvider>
          <ThemedStatusBar />
          <Stack screenOptions={{ headerShown: false }} />
        </TokenProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
