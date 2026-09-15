import { useEffect, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { fetchMarketData, filterResults } from '../services/coingecko';

const MESSAGES = [
  'Connecting...',
  'Getting results...',
  'Generating...',
];

export default function LoadingScreen({ navigation, route }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const { apiKey, params } = route.params;
  const rotation = new Animated.Value(0);

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    const interval = setInterval(() => {
      setMsgIndex(prev => (prev < MESSAGES.length - 1 ? prev + 1 : prev));
    }, 1500);

    async function load() {
      try {
        const [coins] = await Promise.all([
          fetchMarketData({
            apiKey,
            vsCurrency: params.currency,
            universe: params.universe,
            scope: params.scope,
            priceChangePercentage: params.period,
          }),
          new Promise(resolve => setTimeout(resolve, 3000))
        ]);
        const results = filterResults(coins, params.period, params.direction);
        clearInterval(interval);
        navigation.replace('Results', { results, params });
      } catch (e) {
        clearInterval(interval);
        navigation.replace('Results', { results: [], params, error: e.message });
      }
    }

    load();
    return () => clearInterval(interval);
  }, []);

  const rotate = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CrYpTo ChOiZ</Text>
      <Text style={styles.subtitle}>ChOiZ v.1</Text>
      <Animated.Text style={[styles.gear, { transform: [{ rotate }] }]}>⚙️</Animated.Text>
      <Text style={styles.message}>{MESSAGES[msgIndex]}</Text>
      <View style={styles.attribution}>
        <Text style={styles.attributionText}>Data powered by</Text>
        <Image
          source={require('../../assets/coingecko.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fffce6', alignItems: 'center', paddingTop: 80 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#0d0d0d', textAlign: 'center' },
  subtitle: { fontSize: 20, fontWeight: '600', color: '#0d0d0d', textAlign: 'center', marginTop: 6, marginBottom: 0 },
  gear: { fontSize: 70, marginTop: 'auto', marginBottom: 30 },
  message: { fontSize: 20, fontWeight: 'bold', color: '#0d0d0d', marginBottom: 'auto' },
attribution: { marginBottom: 'auto', marginTop: 10, alignItems: 'center' },
attributionText: { fontSize: 22, color: '#0d0d0d', marginBottom: 12 },
logo: { width: 220, height: 60 },
});