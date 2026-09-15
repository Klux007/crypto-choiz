import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';

import AccessCodeScreen from '../screens/AccessCodeScreen';
import ApiKeyScreen from '../screens/ApiKeyScreen';
import HomeScreen from '../screens/HomeScreen';
import LoadingScreen from '../screens/LoadingScreen';
import ResultsScreen from '../screens/ResultsScreen';

import { storage } from '../hooks/useStorage';

const Stack = createStackNavigator();

export default function AppNavigator() {
  const [initialRoute, setInitialRoute] = useState(null);

  useEffect(() => {
    async function determineInitialRoute() {
      const accessValidated = await storage.isAccessValidated();
      const apiKey = await storage.getApiKey();

      if (!accessValidated) {
        setInitialRoute('AccessCode');
      } else if (!apiKey) {
        setInitialRoute('ApiKey');
      } else {
        setInitialRoute('Home');
      }
    }
    determineInitialRoute();
  }, []);

  if (!initialRoute) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="AccessCode" component={AccessCodeScreen} />
        <Stack.Screen name="ApiKey" component={ApiKeyScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Loading" component={LoadingScreen} />
        <Stack.Screen name="Results" component={ResultsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}