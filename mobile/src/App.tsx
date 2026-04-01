import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  ActivityIndicator 
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ConvexHttpClient } from 'convex/browser';
import { ConvexProvider } from 'convex/react';
import { WorkOSProvider } from '@workos-inc/authkit-react-native';

// Import screens
import LoginScreen from './screens/LoginScreen';
import DashboardScreen from './screens/DashboardScreen';
import GradesScreen from './screens/GradesScreen';
import AssignmentsScreen from './screens/AssignmentsScreen';
import AttendanceScreen from './screens/AttendanceScreen';
import FeesScreen from './screens/FeesScreen';
import ProfileScreen from './screens/ProfileScreen';

// Import theme
import { theme } from './theme';

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.EXPO_PUBLIC_CONVEX_URL || '');

// Create navigation stack
const Stack = createNativeStackNavigator();

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication status on app start
    const checkAuth = async () => {
      try {
        // Check if user has valid session
        // This would integrate with WorkOS auth
        setIsLoading(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading EduMyles...</Text>
      </SafeAreaView>
    );
  }

  return (
    <ConvexProvider client={convex}>
      <WorkOSProvider clientId={process.env.EXPO_PUBLIC_WORKOS_CLIENT_ID || ''}>
        <NavigationContainer>
          <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />
            
            <Stack.Navigator
              screenOptions={{
                headerStyle: {
                  backgroundColor: theme.colors.primary,
                },
                headerTintColor: theme.colors.white,
                headerTitleStyle: {
                  fontWeight: 'bold',
                },
              }}
            >
              {isAuthenticated ? (
                // Authenticated screens
                <>
                  <Stack.Screen 
                    name="Dashboard" 
                    component={DashboardScreen}
                    options={{ title: 'Dashboard' }}
                  />
                  <Stack.Screen 
                    name="Grades" 
                    component={GradesScreen}
                    options={{ title: 'My Grades' }}
                  />
                  <Stack.Screen 
                    name="Assignments" 
                    component={AssignmentsScreen}
                    options={{ title: 'Assignments' }}
                  />
                  <Stack.Screen 
                    name="Attendance" 
                    component={AttendanceScreen}
                    options={{ title: 'Attendance' }}
                  />
                  <Stack.Screen 
                    name="Fees" 
                    component={FeesScreen}
                    options={{ title: 'Fees & Payments' }}
                  />
                  <Stack.Screen 
                    name="Profile" 
                    component={ProfileScreen}
                    options={{ title: 'Profile' }}
                  />
                </>
              ) : (
                // Unauthenticated screens
                <Stack.Screen 
                  name="Login" 
                  component={LoginScreen}
                  options={{ headerShown: false }}
                />
              )}
            </Stack.Navigator>
          </SafeAreaView>
        </NavigationContainer>
      </WorkOSProvider>
    </ConvexProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: theme.colors.text,
    fontFamily: theme.fonts.regular,
  },
});

export default App;
