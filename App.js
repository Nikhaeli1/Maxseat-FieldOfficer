import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen    from './src/screens/LoginScreen';
import DispatchScreen from './src/screens/DispatchScreen';
import ActionScreen   from './src/screens/ActionScreen';

const Stack = createNativeStackNavigator();

// ─── Root navigator — switches between Auth and App stacks ───────────────────
function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
        {user ? (
          // ── Authenticated: Enforcer App ──────────────────────────────────────
          <>
            <Stack.Screen name="Dispatch" component={DispatchScreen} />
            <Stack.Screen
              name="Action"
              component={ActionScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </>
        ) : (
          // ── Unauthenticated: Login ───────────────────────────────────────────
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ─── App entry point ─────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});