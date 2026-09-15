import { useState } from 'react';
import { ActivityIndicator, BackHandler, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { storage } from '../hooks/useStorage';
import { verifyAccessCode } from '../services/accessCode';

export default function AccessCodeScreen({ navigation }) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleValidate() {
    if (!code.trim()) {
      setError('Code invalide.');
      return;
    }
    setLoading(true);
    setError('');
    const result = await verifyAccessCode(code);
    setLoading(false);
    if (result.valid) {
      await storage.setAccessValidated();
      navigation.replace('ApiKey');
    } else {
      setError('Code invalide.');
    }
  }

  function handleRestart() {
    setCode('');
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
          <Text style={styles.label}>Saisis ton code d'accès</Text>
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="Code d'accès"
            autoCapitalize="characters"
          />
          {loading
            ? <ActivityIndicator size="large" />
            : <TouchableOpacity style={styles.button} onPress={handleValidate}>
                <Text style={styles.buttonText}>Valider</Text>
              </TouchableOpacity>
          }
        </>
      ) : (
        <>
          <Text style={styles.error}>Code invalide.</Text>
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
  input: { width: '100%', borderWidth: 1, borderColor: '#ccc', padding: 12, borderRadius: 8, fontSize: 18, marginBottom: 16, textAlign: 'center', backgroundColor: 'white' },
  error: { fontSize: 18, color: '#f41a1a', textAlign: 'center', marginBottom: '25%' },
  buttonRow: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  button: { backgroundColor: '#0d0d0d', padding: 14, borderRadius: 8, width: '45%', alignItems: 'center', marginTop: '15%', alignSelf: 'center' },
  buttonText: { color: '#fcfcfc', fontSize: 16, fontWeight: 'bold' },
});