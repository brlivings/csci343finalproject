import React, { useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DoseModal from '../components/DoseModal';
import EvidenceBadge from '../components/EvidenceBadge';
import PrimaryButton from '../components/PrimaryButton';
import { COLORS, FONTS, GRADIENTS, LINKS, SHADOW, SIZES } from '../constants/theme';
import { getCompound, getFamily } from '../data/compounds';
import { fetchCompoundProperties, structureImageUrl } from '../services/pubchem';
import { useBiohacker } from '../context/BiohackerContext';
import useResponsive from '../hooks/useResponsive';

export default function CompoundDetailScreen({ route, navigation }) {
  const compound = getCompound(route.params?.id);
  const family = compound && getFamily(compound.family);
  const { state, addToStack, logDose, toggleFavorite } = useBiohacker();
  const { isLandscape, contentWidth } = useResponsive();
  const [chem, setChem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chemError, setChemError] = useState(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [modal, setModal] = useState(null); // 'stack' | 'log' | null

  const favorite = compound && state.favorites.includes(compound.id);
  const inStack = compound && state.stack.some((s) => s.compoundId === compound.id);

  // Set the header title and favorite button before paint.
  useLayoutEffect(() => {
    if (!compound) return;
    navigation.setOptions({
      title: compound.name,
      headerRight: () => (
        <Pressable onPress={() => toggleFavorite(compound.id)} hitSlop={12} accessibilityLabel="Toggle favorite">
          <MaterialCommunityIcons name={favorite ? 'star' : 'star-outline'} size={24} color={COLORS.white} />
        </Pressable>
      ),
    });
  }, [navigation, compound, favorite, toggleFavorite]);

  // Fetch live chemistry data from PubChem.
  useEffect(() => {
    if (!compound) return undefined;
    const controller = new AbortController();
    setLoading(true);
    setChemError(null);
    fetchCompoundProperties(compound.pubchem, { signal: controller.signal })
      .then(setChem)
      .catch((e) => {
        if (e.name !== 'AbortError') setChemError('Chemistry data unavailable offline or for this extract.');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [compound]);

  if (!compound) {
    return (
      <View style={styles.center}>
        <Text style={styles.body}>Compound not found.</Text>
      </View>
    );
  }

  const open = (url) => Linking.openURL(url).catch(() => {});

  const structure = (
    <View style={[styles.imageCard, SHADOW, isLandscape && { flex: 1, marginRight: 16 }]}>
      {!imageFailed ? (
        <Image
          source={{ uri: structureImageUrl(compound.pubchem) }}
          style={styles.image}
          resizeMode="contain"
          onError={() => setImageFailed(true)}
          accessibilityLabel={`${compound.name} chemical structure`}
        />
      ) : (
        <View style={[styles.image, styles.center]}>
          <MaterialCommunityIcons name={family?.icon || 'flask'} size={64} color={COLORS.primaryLight} />
          <Text style={styles.muted}>Structure image unavailable</Text>
        </View>
      )}
      <Text style={styles.caption}>Structure: {compound.pubchem} (PubChem)</Text>
      <View style={styles.chemBox}>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} />
        ) : chem ? (
          <>
            <ChemRow label="Formula" value={chem.formula} />
            <ChemRow label="Mol. weight" value={chem.weight ? `${chem.weight} g/mol` : '—'} />
            <ChemRow label="PubChem CID" value={String(chem.cid)} />
          </>
        ) : (
          <Text style={styles.muted}>{chemError}</Text>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={[styles.content, { width: contentWidth }]}>
        <LinearGradient colors={GRADIENTS.card} style={styles.hero}>
          <Text style={styles.path}>
            {family?.name} › {compound.group}
          </Text>
          <Text style={styles.name}>{compound.name}</Text>
          <EvidenceBadge grade={compound.evidence} showLabel />
          <Text style={[styles.body, { marginTop: 10 }]}>{compound.summary}</Text>
        </LinearGradient>

        <View style={isLandscape ? styles.row : null}>
          {structure}
          <View style={isLandscape ? { flex: 1 } : null}>
            <Section icon="star-four-points" title="Benefits">
              <View style={styles.tags}>
                {compound.benefits.map((b) => (
                  <View key={b} style={styles.tag}>
                    <Text style={styles.tagText}>{b}</Text>
                  </View>
                ))}
              </View>
            </Section>
            <Section icon="scale-balance" title="Typical dose">
              <Text style={styles.doseBig}>
                {compound.dose.min}–{compound.dose.max} {compound.dose.unit}
              </Text>
              <Text style={styles.body}>{compound.timing}</Text>
            </Section>
            {state.settings.showCautions ? (
              <Section icon="alert-circle-outline" title="Cautions" tint={COLORS.danger}>
                <Text style={styles.body}>{compound.cautions}</Text>
              </Section>
            ) : null}
          </View>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            title={inStack ? 'In your stack' : 'Add to stack'}
            icon={inStack ? 'check' : 'plus'}
            onPress={() => setModal('stack')}
            disabled={inStack}
            style={{ flex: 1 }}
          />
          <PrimaryButton title="Log dose" icon="pencil-plus" variant="outline" onPress={() => setModal('log')} style={{ flex: 1 }} />
        </View>

        <Text style={styles.linksTitle}>Learn more</Text>
        <LinkRow icon="book-open-variant" label="Examine.com research summary" onPress={() => open(LINKS.examine(compound.examine))} />
        <LinkRow icon="file-document-outline" label="Studies on PubMed" onPress={() => open(LINKS.pubmed(compound.name))} />
        <LinkRow icon="flask-outline" label="PubChem compound page" onPress={() => open(LINKS.pubchemSearch(compound.pubchem))} />
      </ScrollView>

      <DoseModal
        visible={modal !== null}
        mode={modal || 'stack'}
        compound={compound}
        onClose={() => setModal(null)}
        onSubmit={(payload) => {
          if (modal === 'stack') addToStack({ compoundId: payload.compoundId, dose: payload.dose, unit: payload.unit, slot: payload.slot });
          else logDose(payload);
          setModal(null);
        }}
      />
    </View>
  );
}

function Section({ icon, title, children, tint = COLORS.primary }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <MaterialCommunityIcons name={icon} size={20} color={tint} />
        <Text style={[styles.sectionTitle, { color: tint }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

function ChemRow({ label, value }) {
  return (
    <View style={styles.chemRow}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={styles.chemValue}>{value}</Text>
    </View>
  );
}

function LinkRow({ icon, label, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.link, pressed && { backgroundColor: COLORS.sky }]} accessibilityRole="link">
      <MaterialCommunityIcons name={icon} size={20} color={COLORS.primary} />
      <Text style={styles.linkText}>{label}</Text>
      <MaterialCommunityIcons name="open-in-new" size={18} color={COLORS.textMuted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.padding, paddingBottom: 40, alignSelf: 'center' },
  center: { alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  hero: { borderRadius: SIZES.radiusLg, padding: 18, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  path: { fontFamily: FONTS.medium, color: COLORS.primary, fontSize: SIZES.small },
  name: { fontFamily: FONTS.bold, fontSize: SIZES.h1, color: COLORS.text, marginBottom: 6 },
  body: { fontFamily: FONTS.regular, fontSize: SIZES.body, color: COLORS.text, lineHeight: 22 },
  muted: { fontFamily: FONTS.regular, fontSize: SIZES.small, color: COLORS.textMuted },
  imageCard: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg, padding: 14, marginBottom: 16 },
  image: { width: '100%', height: 200 },
  caption: { fontFamily: FONTS.regular, fontSize: SIZES.tiny, color: COLORS.textMuted, textAlign: 'center', marginTop: 4 },
  chemBox: { marginTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10, minHeight: 40 },
  chemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
  chemValue: { fontFamily: FONTS.semiBold, fontSize: SIZES.small, color: COLORS.text },
  section: { backgroundColor: COLORS.white, borderRadius: SIZES.radius, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  sectionTitle: { fontFamily: FONTS.semiBold, fontSize: SIZES.body },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: COLORS.sky, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  tagText: { fontFamily: FONTS.medium, color: COLORS.primaryDark, fontSize: SIZES.small },
  doseBig: { fontFamily: FONTS.bold, fontSize: SIZES.h2, color: COLORS.primary },
  actions: { flexDirection: 'row', gap: 12, marginTop: 4, marginBottom: 20 },
  linksTitle: { fontFamily: FONTS.semiBold, fontSize: SIZES.h3, color: COLORS.text, marginBottom: 8 },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  linkText: { flex: 1, fontFamily: FONTS.medium, color: COLORS.text },
});
