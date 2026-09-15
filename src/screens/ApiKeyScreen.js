import { useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { storage } from '../hooks/useStorage';

async function validateApiKey(apiKey) {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/ping?x_cg_demo_api_key=${apiKey.trim()}`
    );
    return response.ok;
  } catch {
    return false;
  }
}

export default function ApiKeyScreen({ navigation }) {
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!apiKey.trim()) {
      setError('Clé API invalide.');
      return;
    }
    setLoading(true);
    setError('');
    const valid = await validateApiKey(apiKey);
    setLoading(false);
    if (valid) {
      await storage.setApiKey(apiKey);
      navigation.replace('Home');
    } else {
      setError('Clé API invalide.');
    }
  }

  function handleRestart() {
    setApiKey('');
    setError('');
  }

  function handleQuit() {
    BackHandler.exitApp();
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CrYpTo ChOiZ</Text>
      <Text style={styles.subtitle}>ChOiZ v.1</Text>

      {!error ? (
        <>
          <Text style={styles.label}>Saisis ta clé API CoinGecko</Text>
          <TextInput
            style={styles.input}
            value={apiKey}
            onChangeText={setApiKey}
            placeholder="Clé API CoinGecko"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {loading
            ? <ActivityIndicator size="large" style={styles.loader} />
            : <TouchableOpacity style={styles.button} onPress={handleSave}>
                <Text style={styles.buttonText}>Valider</Text>
              </TouchableOpacity>
          }
        </>
      ) : (
        <>
          <Text style={styles.error}>{error}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={handleRestart}>
              <Text style={styles.buttonText}>Recommencer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={handleQuit}>
              <Text style={styles.buttonText}>Quitter</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fffce6', paddingHorizontal: 30 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#0d0d0d', textAlign: 'center', marginTop: '55%' },
  subtitle: { fontSize: 20, fontWeight: '600', color: '#0d0d0d', textAlign: 'center', marginTop: 6, marginBottom: '45%' },
  label: { fontSize: 16, marginBottom: 12, color: '#0d0d0d', textAlign: 'center' },
  input: { width: '100%', borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, fontSize: 14, marginBottom: 16, textAlign: 'center', backgroundColor: 'white' },
  error: { fontSize: 18, color: '#f41a1a', textAlign: 'center', marginBottom: '25%' },
  buttonRow: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  button: { backgroundColor: '#0d0d0d', padding: 14, borderRadius: 8, width: '50%', alignItems: 'center', marginTop: '35%', alignSelf: 'center' },
  buttonText: { color: '#fcfcfc', fontSize: 16, fontWeight: 'bold' },
  loader: { marginTop: '35%' },
});