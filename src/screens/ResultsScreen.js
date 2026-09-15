import { useState } from 'react';
import { BackHandler, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const NAMED_KEYS = ['meme', 'ai', 'rwa'];

// Builds the category phrase(s) for a set of named keys (meme/ai/rwa),
// merging the shared "coins liés à/aux ..." wording for ai+rwa together so
// "coins" is never repeated (ex: "coins liés à l'IA et aux RWA").
function categoryParts(keys) {
  const parts = [];
  if (keys.includes('meme')) parts.push('Mèmecoins');
  const hasAi = keys.includes('ai');
  const hasRwa = keys.includes('rwa');
  if (hasAi && hasRwa) parts.push("coins liés à l'IA et aux RWA");
  else if (hasAi) parts.push("coins liés à l'IA");
  else if (hasRwa) parts.push("coins liés aux RWA");
  return parts;
}

// Prefixes each part with its article ("des"/"les") and joins them with "et".
function joinFr(parts, article) {
  const withArticle = parts.map(p => `${article} ${p}`);
  if (withArticle.length <= 1) return withArticle.join('');
  return `${withArticle.slice(0, -1).join(', ')} et ${withArticle[withArticle.length - 1]}`;
}

export default function ResultsScreen({ navigation, route }) {
  const { results, params, error } = route.params;
  const [page, setPage] = useState(0);

  const periodLabel = { '1h': '1H', '24h': 'daily', '7d': 'weekly' };
  const directionLabel = { winners: 'meilleures', loosers: 'pires' };
  const currencyLabel = { usd: 'USD', btc: 'BTC', eth: 'ETH' };

  const summaryIntro = page === 0
    ? `Voici les ${params.count} ${directionLabel[params.direction]} performances`
    : `Voici les ${params.count} ${directionLabel[params.direction]} performances suivantes`;
  const summary = `${summaryIntro} ${periodLabel[params.period]} vs ${currencyLabel[params.currency]} parmi les ${params.universe} plus grandes capitalisations, à la date du ${new Date().toLocaleString('fr-FR')}.`;

  const activeNamed = NAMED_KEYS.filter(k => params.scope[k]);
  const inactiveNamed = NAMED_KEYS.filter(k => !params.scope[k]);
  const scopeNote = params.scope.all && inactiveNamed.length > 0
    ? `Recherches effectuées à l'exclusion ${joinFr(categoryParts(inactiveNamed), 'des')}.`
    : !params.scope.all && activeNamed.length > 0
    ? `Recherches effectuées uniquement sur ${joinFr(categoryParts(activeNamed), 'les')}.`
    : null;

  const pageResults = error ? [] : results.slice(page * params.count, (page + 1) * params.count);
  const hasNext = !error && page === 0 && results.length > params.count;

  const shortfall = !error && pageResults.length > 0 && pageResults.length < params.count;
  const shortfallText = shortfall
    ? `La requête n'a permis d'obtenir que ${pageResults.length} résultat${pageResults.length > 1 ? 's' : ''} sur les ${params.count} demandés.`
    : null;

  function handleRestart() {
    navigation.replace('Home');
  }

  function handleQuit() {
    BackHandler.exitApp();
  }

  function handleNext() {
    if (hasNext) setPage(1);
  }

  function handlePrev() {
    setPage(0);
  }

  const fieldMap = {
    '1h': 'price_change_percentage_1h_in_currency',
    '24h': 'price_change_percentage_24h_in_currency',
    '7d': 'price_change_percentage_7d_in_currency',
  };

  function PrevNextButton() {
    return page === 0 ? (
      <TouchableOpacity
        style={[styles.button, !hasNext && styles.buttonDisabled]}
        onPress={handleNext}
        disabled={!hasNext}
      >
        <Text style={[styles.buttonText, !hasNext && styles.buttonTextDisabled]}>Suiv.</Text>
      </TouchableOpacity>
    ) : (
      <TouchableOpacity style={styles.button} onPress={handlePrev}>
        <Text style={styles.buttonText}>Préc.</Text>
      </TouchableOpacity>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>CrYpTo ChOiZ</Text>
      <Text style={styles.subtitle}>ChOiZ v.1</Text>
      <Text style={[styles.summary, scopeNote && styles.summaryNoGap]}>{summary}</Text>
      {scopeNote ? <Text style={styles.scopeNote}>{scopeNote}</Text> : null}

      {shortfallText ? (
        <Text style={styles.shortfall}>{shortfallText}</Text>
      ) : null}

      {error ? (
        <Text style={styles.error}>Erreur : {error}</Text>
      ) : (
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: 1 }]}>#</Text>
            <Text style={[styles.headerCell, { flex: 2 }]}>Ticker</Text>
            <Text style={[styles.headerCell, { flex: 4, textAlign: 'center' }]}>Nom</Text>
            <Text style={[styles.headerCell, { flex: 2, textAlign: 'center' }]}>Perf %</Text>
          </View>
          {pageResults.map((coin, index) => {
            const perf = coin[fieldMap[params.period]];
            return (
              <View key={coin.id} style={[styles.tableRow, index % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
                <Text style={[styles.cell, { flex: 1 }]}>{page * params.count + index + 1}</Text>
                <Text style={[styles.cell, { flex: 2 }]} numberOfLines={1} ellipsizeMode="tail">{coin.symbol.toUpperCase()}</Text>
                <Text style={[styles.cell, { flex: 4 }]} numberOfLines={1} ellipsizeMode="tail">{coin.name}</Text>
                <Text style={[styles.cell, { flex: 2, color: perf >= 0 ? '#32c832' : '#e31a1a', fontWeight: 'bold' }]}>{perf?.toFixed(2)}%</Text>
              </View>
            );
          })}
        </View>
      )}

      <Text style={styles.disclaimer}>Les résultats fournis par CrYpTo ChOiZ App ne constituent pas des conseils en investissement.</Text>

      {params.count === 10 ? (
        <View style={styles.buttonRow}>
          <PrevNextButton />
          <TouchableOpacity style={styles.button} onPress={handleRestart}>
            <Text style={styles.buttonText}>Reprendre</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={handleQuit}>
            <Text style={styles.buttonText}>Quitter</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.buttonRow}>
            <PrevNextButton />
            <TouchableOpacity style={styles.button} onPress={handleRestart}>
              <Text style={styles.buttonText}>Reprendre</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.quitCentered} onPress={handleQuit}>
            <Text style={styles.buttonText}>Quitter</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 20, paddingTop: 60, backgroundColor: '#fffce6' },
  title: { fontSize: 32, fontWeight: 'bold', color: '#0d0d0d', textAlign: 'center' },
  subtitle: { fontSize: 18, fontWeight: '600', color: '#0d0d0d', textAlign: 'center', marginTop: 5, marginBottom: 16 },
  summary: { fontSize: 16, marginBottom: 16, textAlign: 'center', color: '#0d0d0d' },
  summaryNoGap: { marginBottom: 0 },
  scopeNote: { fontSize: 16, marginBottom: 16, textAlign: 'center', color: '#0d0d0d' },
  error: { color: '#e31a1a', textAlign: 'center', marginBottom: 20, fontSize: 16 },
  shortfall: { color: '#0d0d0d', textAlign: 'center', marginBottom: 16, fontSize: 14, fontStyle: 'italic' },
  table: { width: '100%', marginBottom: 16 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#4932ff', padding: 8, borderRadius: 4 },
  headerCell: { color: '#fcfcfc', fontWeight: 'bold', fontSize: 14 },
  tableRow: { flexDirection: 'row', padding: 8 },
  rowEven: { backgroundColor: '#f0edd0' },
  rowOdd: { backgroundColor: '#fffce6' },
  cell: { fontSize: 14 },
  disclaimer: { fontSize: 13, color: '#0d0d0d', textAlign: 'center', marginBottom: 24, fontStyle: 'italic' },
  buttonRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, width: '100%' },
  button: { flex: 1, backgroundColor: '#0d0d0d', paddingVertical: 14, borderRadius: 8, alignItems: 'center' },
  quitCentered: { backgroundColor: '#0d0d0d', paddingVertical: 14, borderRadius: 8, alignItems: 'center', width: '50%', alignSelf: 'center', marginTop: 24 },
  buttonDisabled: { backgroundColor: '#b0b0ac' },
  buttonText: { color: '#fcfcfc', fontSize: 16, fontWeight: 'bold' },
  buttonTextDisabled: { color: '#e6e6e0' },
});