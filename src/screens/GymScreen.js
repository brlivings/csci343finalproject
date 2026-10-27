import React, { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientHeader from '../components/GradientHeader';
import IsoGym from '../components/IsoGym';
import PrimaryButton from '../components/PrimaryButton';
import { COLORS, FONTS, SHADOW, SIZES } from '../constants/theme';
import {
  EQUIPMENT,
  FLOORS,
  MAX_ACCRUAL_HOURS,
  WALLS,
  getEquipment,
  gymStats,
  levelForXp,
  pendingRevenue,
} from '../data/gym';
import { useBiohacker } from '../context/BiohackerContext';
import useResponsive from '../hooks/useResponsive';

export default function GymScreen({ navigation }) {
  const { state, buyItem, moveItem, rotateItem, sellItem, setGym, collectRevenue } = useBiohacker();
  const { width, height, isLandscape, contentWidth } = useResponsive();
  const { gym, progress } = state;
  const level = levelForXp(progress.xp);
  const stats = useMemo(() => gymStats(gym.items, level), [gym.items, level]);

  const [camera, setCamera] = useState(0);
  const [selected, setSelected] = useState(null); // { x, y }
  const [movingId, setMovingId] = useState(null);
  const [shopOpen, setShopOpen] = useState(false);
  const [designOpen, setDesignOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Start the revenue clock the first time the gym is opened.
  useEffect(() => {
    if (!gym.lastCollectedAt) setGym({ lastCollectedAt: new Date().toISOString() });
  }, [gym.lastCollectedAt, setGym]);

  // Tick every 15 s so pending revenue updates live.
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(id);
  }, []);

  const pending = pendingRevenue(gym.lastCollectedAt, stats.incomePerHour, now);
  const floor = FLOORS.find((f) => f.id === gym.floor) || FLOORS[0];
  const wall = WALLS.find((w) => w.id === gym.wall) || WALLS[0];
  const selectedItem = selected && gym.items.find((i) => i.x === selected.x && i.y === selected.y);
  const selectedEq = selectedItem && getEquipment(selectedItem.itemId);

  const onTilePress = ({ x, y, occupied }) => {
    if (movingId) {
      if (occupied) {
        Alert.alert('Tile occupied', 'Pick an empty tile to move this equipment to.');
        return;
      }
      moveItem(movingId, x, y);
      setMovingId(null);
      setSelected({ x, y });
      return;
    }
    setSelected({ x, y });
    if (!occupied) setShopOpen(true);
  };

  const confirmSell = () => {
    if (!selectedItem) return;
    Alert.alert('Sell equipment?', `Sell ${selectedEq.name} for $${Math.floor(selectedEq.cost / 2)} (50% refund)?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sell',
        style: 'destructive',
        onPress: () => {
          sellItem(selectedItem.id);
          setSelected(null);
        },
      },
    ]);
  };

  const buy = (eq) => {
    if (!selected) return;
    if (eq.level > level) {
      Alert.alert('Locked', `Reach level ${eq.level} by acing quizzes to unlock the ${eq.name}.`, [
        { text: 'OK' },
        { text: 'Take a quiz', onPress: () => { setShopOpen(false); navigation.navigate('Quizzes'); } },
      ]);
      return;
    }
    if (progress.coins < eq.cost) {
      Alert.alert('Not enough cash', `You need $${eq.cost - progress.coins} more. Collect revenue or earn cash from quizzes.`);
      return;
    }
    buyItem(eq.id, selected.x, selected.y);
    setShopOpen(false);
  };

  const pad = SIZES.padding;
  const gymWidth = isLandscape
    ? Math.max(240, Math.min(contentWidth * 0.55, (height - 180) / 0.72))
    : Math.min(contentWidth - pad * 2, 640);

  const gymView = (
    <View style={[styles.gymCard, SHADOW, { width: gymWidth + 16 }]}>
      <IsoGym
        width={gymWidth}
        size={stats.size}
        items={gym.items}
        floor={floor}
        wall={wall}
        camera={camera}
        selectedTile={selected}
        moving={!!movingId}
        customers={stats.customers}
        onTilePress={onTilePress}
      />
      <View style={styles.camRow}>
        <Pressable onPress={() => setCamera((c) => (c + 3) % 4)} style={styles.camBtn} accessibilityLabel="Rotate view left">
          <MaterialCommunityIcons name="rotate-left" size={22} color={COLORS.primary} />
        </Pressable>
        <Text style={styles.camText}>{movingId ? 'Tap an empty tile to move' : 'Tap a tile to build or select'}</Text>
        <Pressable onPress={() => setCamera((c) => (c + 1) % 4)} style={styles.camBtn} accessibilityLabel="Rotate view right">
          <MaterialCommunityIcons name="rotate-right" size={22} color={COLORS.primary} />
        </Pressable>
      </View>
    </View>
  );

  const panel = (
    <View style={isLandscape ? { flex: 1, marginLeft: 16 } : { marginTop: 16 }}>
      <View style={styles.statsGrid}>
        <Stat icon="account-group" label="Customers" value={`${stats.customers}/${stats.capacity}`} />
        <Stat icon="cash-plus" label="Per hour" value={`$${stats.incomePerHour}`} />
        <Stat icon="star" label="Rating" value={`${stats.rating}/5`} />
        <Stat icon="dumbbell" label="Machines" value={gym.items.length} />
      </View>

      <LinearGradient colors={['#E3F2FD', '#FFFFFF']} style={styles.collect}>
        <View style={{ flex: 1 }}>
          <Text style={styles.collectTitle}>Membership revenue</Text>
          <Text style={styles.collectSub}>Accrues for up to {MAX_ACCRUAL_HOURS}h · ${pending} waiting</Text>
        </View>
        <PrimaryButton
          title={`Collect $${pending}`}
          icon="hand-coin"
          onPress={() => collectRevenue(pending)}
          disabled={pending <= 0}
        />
      </LinearGradient>

      {selectedItem ? (
        <View style={styles.selected}>
          <MaterialCommunityIcons name={selectedEq.icon} size={26} color={COLORS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.selName}>{selectedEq.name}</Text>
            <Text style={styles.selMeta}>Draws {selectedEq.appeal} customers{selectedEq.income ? ` · +$${selectedEq.income}/hr` : ''}</Text>
          </View>
          <IconAction icon={movingId ? 'close' : 'cursor-move'} label={movingId ? 'Cancel' : 'Move'} onPress={() => setMovingId(movingId ? null : selectedItem.id)} />
          <IconAction icon="rotate-3d-variant" label="Rotate" onPress={() => rotateItem(selectedItem.id)} />
          <IconAction icon="cash-refund" label="Sell" onPress={confirmSell} danger />
        </View>
      ) : null}

      <View style={styles.actions}>
        <PrimaryButton title="Shop" icon="cart" onPress={() => (selected && !selectedItem ? setShopOpen(true) : Alert.alert('Pick a spot', 'Tap an empty floor tile first, then choose what to build there.'))} style={{ flex: 1 }} />
        <PrimaryButton title="Design" icon="palette" variant="outline" onPress={() => setDesignOpen(true)} style={{ flex: 1 }} />
      </View>
      <Text style={styles.hint}>
        Ace quizzes to level up. Higher levels unlock new machines, styles and a bigger floor. More machines = more customers = more cash.
      </Text>
    </View>
  );

  return (
    <View style={styles.screen}>
      <GradientHeader
        compact
        title={gym.name}
        subtitle={`Level ${level} gym · ${stats.size}×${stats.size} floor`}
        right={
          <View style={styles.coinPill}>
            <MaterialCommunityIcons name="cash-multiple" size={18} color={COLORS.primaryDark} />
            <Text style={styles.coinText}>${progress.coins}</Text>
          </View>
        }
      />
      <ScrollView contentContainerStyle={[styles.content, { width: contentWidth }, isLandscape && styles.row]}>
        {gymView}
        {panel}
      </ScrollView>

      <ShopModal
        visible={shopOpen}
        onClose={() => setShopOpen(false)}
        level={level}
        coins={progress.coins}
        onBuy={buy}
        width={width}
      />
      <DesignModal
        visible={designOpen}
        onClose={() => setDesignOpen(false)}
        gym={gym}
        level={level}
        onSave={(changes) => {
          setGym(changes);
          setDesignOpen(false);
        }}
      />
    </View>
  );
}

function Stat({ icon, label, value }) {
  return (
    <View style={styles.stat}>
      <MaterialCommunityIcons name={icon} size={20} color={COLORS.primary} />
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function IconAction({ icon, label, onPress, danger }) {
  return (
    <Pressable onPress={onPress} style={styles.iconAction} accessibilityLabel={label}>
      <MaterialCommunityIcons name={icon} size={22} color={danger ? COLORS.danger : COLORS.primary} />
      <Text style={[styles.iconActionText, danger && { color: COLORS.danger }]}>{label}</Text>
    </Pressable>
  );
}

function ShopModal({ visible, onClose, level, coins, onBuy, width }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { width: Math.min(width, 560), paddingBottom: insets.bottom + 12 }]}>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>Equipment shop</Text>
            <Text style={styles.sheetCoins}>${coins}</Text>
            <Pressable onPress={onClose} hitSlop={12} accessibilityLabel="Close shop">
              <MaterialCommunityIcons name="close" size={24} color={COLORS.textMuted} />
            </Pressable>
          </View>
          <FlatList
            data={EQUIPMENT}
            keyExtractor={(e) => e.id}
            contentContainerStyle={{ paddingHorizontal: 16 }}
            renderItem={({ item }) => {
              const locked = item.level > level;
              const affordable = coins >= item.cost;
              return (
                <Pressable onPress={() => onBuy(item)} style={[styles.shopRow, locked && { opacity: 0.55 }]}>
                  <View style={[styles.shopIcon, { backgroundColor: item.color }]}>
                    <MaterialCommunityIcons name={locked ? 'lock' : item.icon} size={22} color={COLORS.white} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.shopName}>{item.name}</Text>
                    <Text style={styles.shopMeta}>
                      {locked ? `Unlocks at level ${item.level}` : `+${item.appeal} customers${item.income ? ` · +$${item.income}/hr` : ''}`}
                    </Text>
                  </View>
                  <Text style={[styles.shopCost, !affordable && !locked && { color: COLORS.danger }]}>${item.cost}</Text>
                </Pressable>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

function DesignModal({ visible, onClose, gym, level, onSave }) {
  const [name, setName] = useState(gym.name);
  const [floor, setFloor] = useState(gym.floor);
  const [wall, setWall] = useState(gym.wall);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (visible) {
      setName(gym.name);
      setFloor(gym.floor);
      setWall(gym.wall);
      setError(null);
    }
  }, [visible, gym]);

  const save = () => {
    const trimmed = name.trim();
    if (trimmed.length < 3) return setError('Name must be at least 3 characters.');
    if (trimmed.length > 24) return setError('Name must be 24 characters or fewer.');
    if (!/^[\w\s'&!.-]+$/.test(trimmed)) return setError('Use letters, numbers and basic punctuation only.');
    return onSave({ name: trimmed, floor, wall });
  };

  const Swatches = ({ options, value, onPick }) => (
    <View style={styles.swatches}>
      {options.map((o) => {
        const locked = o.level > level;
        const active = value === o.id;
        return (
          <Pressable
            key={o.id}
            onPress={() => (locked ? Alert.alert('Locked', `Unlocks at level ${o.level}.`) : onPick(o.id))}
            style={[styles.swatch, active && styles.swatchActive]}
          >
            <LinearGradient colors={o.colors} style={styles.swatchColor}>
              {locked ? <MaterialCommunityIcons name="lock" size={16} color={COLORS.textMuted} /> : null}
            </LinearGradient>
            <Text style={styles.swatchText} numberOfLines={1}>
              {o.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose} supportedOrientations={['portrait', 'landscape']}>
      <View style={[styles.overlay, { justifyContent: 'center' }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.dialog}>
          <ScrollView contentContainerStyle={{ padding: 20 }} keyboardShouldPersistTaps="handled">
            <Text style={styles.sheetTitle}>Design your gym</Text>
            <Text style={styles.label}>Gym name</Text>
            <TextInput
              value={name}
              onChangeText={(t) => {
                setName(t);
                setError(null);
              }}
              maxLength={30}
              style={[styles.input, error && { borderColor: COLORS.danger }]}
              placeholder="e.g. Blue Lab Fitness"
              placeholderTextColor={COLORS.textMuted}
              accessibilityLabel="Gym name"
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Text style={styles.label}>Floor</Text>
            <Swatches options={FLOORS} value={floor} onPick={setFloor} />
            <Text style={styles.label}>Walls</Text>
            <Swatches options={WALLS} value={wall} onPick={setWall} />
            <PrimaryButton title="Save design" icon="content-save" onPress={save} style={{ marginTop: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: SIZES.padding, paddingBottom: 40, alignSelf: 'center', alignItems: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  coinPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, gap: 6 },
  coinText: { fontFamily: FONTS.semiBold, color: COLORS.primaryDark },
  gymCard: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg, padding: 8, alignSelf: 'center', borderWidth: 1, borderColor: COLORS.border },
  camRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  camBtn: { padding: 8, borderRadius: 10, backgroundColor: COLORS.sky },
  camText: { flex: 1, textAlign: 'center', fontFamily: FONTS.regular, fontSize: SIZES.tiny, color: COLORS.textMuted },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  stat: { flexGrow: 1, flexBasis: '22%', minWidth: 72, backgroundColor: COLORS.white, borderRadius: SIZES.radius, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  statValue: { fontFamily: FONTS.bold, color: COLORS.text, fontSize: SIZES.body, marginTop: 2 },
  statLabel: { fontFamily: FONTS.regular, color: COLORS.textMuted, fontSize: SIZES.tiny },
  collect: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: SIZES.radius, padding: 12, marginTop: 12, borderWidth: 1, borderColor: COLORS.border },
  collectTitle: { fontFamily: FONTS.semiBold, color: COLORS.text },
  collectSub: { fontFamily: FONTS.regular, color: COLORS.textMuted, fontSize: SIZES.tiny },
  selected: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.white, borderRadius: SIZES.radius, padding: 12, marginTop: 12, borderWidth: 1.5, borderColor: COLORS.primaryLight },
  selName: { fontFamily: FONTS.semiBold, color: COLORS.text },
  selMeta: { fontFamily: FONTS.regular, color: COLORS.textMuted, fontSize: SIZES.tiny },
  iconAction: { alignItems: 'center', paddingHorizontal: 4 },
  iconActionText: { fontFamily: FONTS.medium, fontSize: 10, color: COLORS.primary },
  actions: { flexDirection: 'row', gap: 12, marginTop: 12 },
  hint: { fontFamily: FONTS.regular, color: COLORS.textMuted, fontSize: SIZES.tiny, marginTop: 10, lineHeight: 16 },
  overlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end', alignItems: 'center' },
  sheet: { backgroundColor: COLORS.white, borderTopLeftRadius: SIZES.radiusLg, borderTopRightRadius: SIZES.radiusLg, maxHeight: '80%' },
  sheetHead: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 },
  sheetTitle: { flex: 1, fontFamily: FONTS.bold, fontSize: SIZES.h3, color: COLORS.text },
  sheetCoins: { fontFamily: FONTS.semiBold, color: COLORS.primary },
  shopRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  shopIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  shopName: { fontFamily: FONTS.semiBold, color: COLORS.text },
  shopMeta: { fontFamily: FONTS.regular, color: COLORS.textMuted, fontSize: SIZES.tiny },
  shopCost: { fontFamily: FONTS.bold, color: COLORS.primary },
  dialog: { backgroundColor: COLORS.white, borderRadius: SIZES.radiusLg, width: '92%', maxWidth: 520, maxHeight: '90%' },
  label: { fontFamily: FONTS.medium, color: COLORS.text, marginTop: 16, marginBottom: 6 },
  input: { borderWidth: 1.5, borderColor: COLORS.border, borderRadius: SIZES.radius, padding: 12, fontFamily: FONTS.regular, color: COLORS.text, backgroundColor: COLORS.background },
  error: { fontFamily: FONTS.regular, color: COLORS.danger, fontSize: SIZES.small, marginTop: 4 },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatch: { width: 76, alignItems: 'center', padding: 4, borderRadius: 12, borderWidth: 2, borderColor: 'transparent' },
  swatchActive: { borderColor: COLORS.primary },
  swatchColor: { width: 56, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  swatchText: { fontFamily: FONTS.regular, fontSize: 10, color: COLORS.text, marginTop: 2 },
});
