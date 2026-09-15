import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { storage } from '../hooks/useStorage';

const PARAMS = {
  count: [5, 10],
  direction: ['Winners', 'Loosers'],
  currency: ['vs USD', 'vs BTC', 'vs ETH'],
  period: ['1H', 'Day', 'Week'],
  universe: [50, 100, 150, 200, 400],
};

// Display order: Meme, AI, RWA, then Others (the "all" key — everything not
// in the 3 named categories) last on the right.
const SCOPE_KEYS = ['meme', 'ai', 'rwa', 'all'];
const SCOPE_LABELS = { meme: 'Meme', ai: 'AI', rwa: 'RWA', all: 'Others' };

const DEFAULT = {
  count: 5,
  direction: 'Winners',
  currency: 'vs USD',
  period: '1H',
  scope: { all: true, meme: true, ai: true, rwa: true },
  universe: 100,
};

export default function HomeScreen({ navigation }) {
  const [selected, setSelected] = useState(DEFAULT);

  useEffect(() => {
    async function loadSaved() {
      const saved = await storage.getLastParams();
      // Merge over DEFAULT so params saved by an earlier version (missing
      // fields like `scope`, or a `scope` missing the newer ai/rwa keys)
      // don't crash the new screen.
      if (saved) {
        setSelected({
          ...DEFAULT,
          ...saved,
          scope: { ...DEFAULT.scope, ...(saved.scope || {}) },
        });
      }
    }
    loadSaved();
  }, []);

  async function toggle(param, value) {
    const updated = { ...selected, [param]: value };
    setSelected(updated);
    await storage.saveLastParams(updated);
  }

  // scope = { all, meme, ai, rwa } — non-exclusive toggles, at least one
  // must always stay active (refuse turning off the last active one).
  async function toggleScope(key) {
    const current = selected.scope;
    const activeCount = SCOPE_KEYS.filter(k => current[k]).length;
    if (current[key] === true && activeCount === 1) {
      // Refused: at least one of All / Meme / AI / RWA must stay active.
      return;
    }
    const updated = { ...selected, scope: { ...current, [key]: !current[key] } };
    setSelected(updated);
    await storage.saveLastParams(updated);
  }

  async function handleGo() {
    const apiKey = await storage.getApiKey();
    const periodMap = { '1H': '1h', 'Day': '24h', 'Week': '7d' };
    const currencyMap = { 'vs USD': 'usd', 'vs BTC': 'btc', 'vs ETH': 'eth' };

    navigation.navigate('Loading', {
      apiKey,
      params: {
        count: selected.count,
        direction: selected.direction.toLowerCase(),
        currency: currencyMap[selected.currency],
        period: periodMap[selected.period],
        scope: selected.scope,
        universe: selected.universe,
      }
    });
  }

  function Row({ param, values, variant }) {
    const rowStyle = variant === 'tight' ? styles.rowTight : styles.row;
    const btnStyle = variant === 'compact' ? styles.btnCompact : variant === 'tight' ? styles.btnTight : styles.btn;
    const textStyle = variant === 'compact' ? styles.btnTextCompact : variant === 'tight' ? styles.btnTextTight : styles.btnText;
    return (
      <View style={rowStyle}>
        {values.map(val => (
          <TouchableOpacity
            key={String(val)}
            style={[btnStyle, selected[param] === val ? styles.active : styles.inactive]}
            onPress={() => toggle(param, val)}
          >
            <Text style={textStyle}>{String(val)}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  function ScopeRow() {
    return (
      <View style={styles.rowScope}>
        {SCOPE_KEYS.map(key => (
          <TouchableOpacity
            key={key}
            style={[styles.btnScope, selected.scope[key] ? styles.active : styles.inactive]}
            onPress={() => toggleScope(key)}
          >
            <Text style={styles.btnTextTight}>{SCOPE_LABELS[key]}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>CrYpTo ChOiZ</Text>
      <Text style={styles.subtitle}>ChOiZ v.1</Text>
      <Text style={styles.instructions}>Utilises les boutons pour définir les paramètres de ta demande, puis valides avec Go !</Text>
      <Row param="count" values={PARAMS.count} />
      <Row param="direction" values={PARAMS.direction} />
      <Row param="currency" values={PARAMS.currency} variant="compact" />
      <Row param="period" values={PARAMS.period} />
      <ScopeRow />
      <Row param="universe" values={PARAMS.universe} variant="tight" />
      <TouchableOpacity style={styles.goBtn} onPress={handleGo}>
        <Text style={styles.goBtnText}>Go !</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', paddingHorizontal: 30, paddingTop: 45, paddingBottom: 40, backgroundColor: '#fffce6' },
  title: { fontSize: 36, fontWeight: 'bold', color: '#0d0d0d', textAlign: 'center' },
  subtitle: { fontSize: 20, fontWeight: '600', color: '#0d0d0d', textAlign: 'center', marginTop: 6, marginBottom: 14 },
  instructions: { fontSize: 18, color: '#0d0d0d', textAlign: 'center', marginBottom: 44, paddingHorizontal: 10 },
  row: { flexDirection: 'row', marginBottom: 22, gap: 20 },
  rowTight: { flexDirection: 'row', marginBottom: 24, gap: 22 },
  // Same as rowTight but stretched to the full content width so the 4 equal-
  // width scope buttons below (flex: 1 each) have a fixed span to share.
  rowScope: { flexDirection: 'row', marginBottom: 24, gap: 22, width: '100%' },
  // +10% vs the previous pass, same gap (20) as before.
  btn: { paddingVertical: 13, paddingHorizontal: 31, borderRadius: 8 },
  // +10% vs the previous pass, same gap (20) as before.
  btnCompact: { paddingVertical: 11, paddingHorizontal: 15, borderRadius: 8 },
  // Same height as `btn`, ~1.5x the width of the previous pass, gap slightly opened up.
  btnTight: { paddingVertical: 13, paddingHorizontal: 12, borderRadius: 8 },
  // Same vertical sizing as btnTight, but equal width for all 4 (flex: 1
  // shares rowScope's fixed width evenly, instead of hugging each label).
  btnScope: { flex: 1, paddingVertical: 13, borderRadius: 8, alignItems: 'center' },
  active: { backgroundColor: '#32c832' },
  inactive: { backgroundColor: '#e31a1a' },
  btnText: { color: '#fcfcfc', fontWeight: 'bold', fontSize: 20 },
  btnTextCompact: { color: '#fcfcfc', fontWeight: 'bold', fontSize: 17 },
  btnTextTight: { color: '#fcfcfc', fontWeight: 'bold', fontSize: 15 },
  goBtn: { backgroundColor: '#0d0d0d', padding: 16, borderRadius: 8, marginTop: 20, width: '50%', alignItems: 'center' },
  goBtnText: { color: '#fcfcfc', fontSize: 22, fontWeight: 'bold' },
});