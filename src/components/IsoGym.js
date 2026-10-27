// Isometric 3D rendering of the virtual gym using react-native-svg.
// Every tile, wall and machine is projected from grid space to screen space;
// machines are drawn as shaded 3D blocks in painter's order (back to front).
// The camera can be rotated in 90° steps to view the gym from all four sides.
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Polygon, Stop } from 'react-native-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';
import { getEquipment } from '../data/gym';

// Rotate grid coordinates according to the camera angle (0-3).
const rotate = (x, y, size, cam) => {
  switch (cam) {
    case 1:
      return [size - 1 - y, x];
    case 2:
      return [size - 1 - x, size - 1 - y];
    case 3:
      return [y, size - 1 - x];
    default:
      return [x, y];
  }
};

// Inverse of rotate(): screen-space grid cell back to stored grid cell.
const unrotate = (rx, ry, size, cam) => {
  switch (cam) {
    case 1:
      return [ry, size - 1 - rx];
    case 2:
      return [size - 1 - rx, size - 1 - ry];
    case 3:
      return [size - 1 - ry, rx];
    default:
      return [rx, ry];
  }
};

const shade = (hex, amt) => {
  const n = parseInt(hex.replace('#', ''), 16);
  const clamp = (v) => Math.max(0, Math.min(255, v));
  const r = clamp((n >> 16) + amt);
  const g = clamp(((n >> 8) & 0xff) + amt);
  const b = clamp((n & 0xff) + amt);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
};

function Customer({ path, delay, project, size }) {
  const pos = useRef(new Animated.ValueXY(project(path[0]))).current;
  const bob = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const steps = path.map((p) =>
      Animated.sequence([
        Animated.delay(900),
        Animated.timing(pos, {
          toValue: project(p),
          duration: 1600,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: false,
        }),
      ])
    );
    const walk = Animated.loop(Animated.sequence([Animated.delay(delay), ...steps]));
    const bounce = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, { toValue: -3, duration: 300, useNativeDriver: false }),
        Animated.timing(bob, { toValue: 0, duration: 300, useNativeDriver: false }),
      ])
    );
    walk.start();
    bounce.start();
    return () => {
      walk.stop();
      bounce.stop();
    };
  }, [path, delay, project, pos, bob]);

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        left: Animated.subtract(pos.x, size / 2),
        top: Animated.add(Animated.subtract(pos.y, size), bob),
      }}
    >
      <MaterialCommunityIcons name="human-handsdown" size={size} color={COLORS.primaryDark} />
    </Animated.View>
  );
}

export default function IsoGym({
  width,
  size,
  items,
  floor,
  wall,
  camera = 0,
  selectedTile,
  moving,
  customers = 0,
  onTilePress,
}) {
  const tw = (width * 0.96) / size; // tile width on screen
  const th = tw / 2; // tile height (2:1 isometric)
  const wallH = tw * 1.1;
  const ox = width / 2;
  const oy = wallH + 6;
  const height = oy + size * th + 8;

  // Project grid corner (gx, gy) (already camera-rotated) to screen space.
  const P = (gx, gy, z = 0) => [ox + (gx - gy) * (tw / 2), oy + (gx + gy) * (th / 2) - z];
  const pts = (arr) => arr.map((p) => p.join(',')).join(' ');

  const occupied = useMemo(() => {
    const set = new Set();
    items.forEach((i) => set.add(`${i.x},${i.y}`));
    return set;
  }, [items]);

  // Walking routes for animated customers across free tiles.
  const customerPaths = useMemo(() => {
    const free = [];
    for (let x = 0; x < size; x += 1) for (let y = 0; y < size; y += 1) if (!occupied.has(`${x},${y}`)) free.push([x, y]);
    if (!free.length) return [];
    const shown = Math.min(customers, 12, free.length);
    return Array.from({ length: shown }, (_, k) =>
      Array.from({ length: 4 }, (_, j) => free[(k * 7 + j * 5 + k * j) % free.length])
    );
  }, [customers, size, occupied]);

  const projectCell = useMemo(
    () => ([x, y]) => {
      const [rx, ry] = rotate(x, y, size, camera);
      const [sx, sy] = [ox + (rx + 0.5 - (ry + 0.5)) * (tw / 2), oy + (rx + 0.5 + ry + 0.5) * (th / 2)];
      return { x: sx, y: sy };
    },
    [size, camera, ox, oy, tw, th]
  );

  // Floor tiles.
  const tiles = [];
  for (let rx = 0; rx < size; rx += 1) {
    for (let ry = 0; ry < size; ry += 1) {
      const [gx, gy] = unrotate(rx, ry, size, camera);
      const isSel = selectedTile && selectedTile.x === gx && selectedTile.y === gy;
      tiles.push(
        <Polygon
          key={`t${rx}-${ry}`}
          points={pts([P(rx, ry), P(rx + 1, ry), P(rx + 1, ry + 1), P(rx, ry + 1)])}
          fill={isSel ? (moving ? '#90CAF9' : '#64B5F6') : floor.colors[(rx + ry) % 2]}
          stroke={isSel ? COLORS.primaryDark : 'rgba(0,0,0,0.08)'}
          strokeWidth={isSel ? 2 : 1}
        />
      );
    }
  }

  // Equipment blocks sorted back-to-front for correct overlap.
  const blocks = items
    .map((placed) => {
      const eq = getEquipment(placed.itemId);
      const [rx, ry] = rotate(placed.x, placed.y, size, camera);
      return eq ? { placed, eq, rx, ry } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.rx + a.ry - (b.rx + b.ry));

  const inset = 0.14;
  const blockShapes = blocks.map(({ placed, eq, rx, ry }) => {
    const h = eq.height * (tw / 56);
    const a = [rx + inset, ry + inset];
    const b = [rx + 1 - inset, ry + inset];
    const c = [rx + 1 - inset, ry + 1 - inset];
    const d = [rx + inset, ry + 1 - inset];
    const isSel = selectedTile && selectedTile.x === placed.x && selectedTile.y === placed.y;
    // Rotation picks which visible side shows the darker "front" panel.
    const frontRight = (placed.rotation || 0) % 2 === 1;
    return (
      <React.Fragment key={placed.id}>
        {/* shadow */}
        <Polygon points={pts([P(...a), P(...b), P(...c), P(...d)])} fill="rgba(0,0,0,0.18)" />
        {/* left (+y) face */}
        <Polygon
          points={pts([P(...d), P(...c), P(...c, h), P(...d, h)])}
          fill={shade(eq.color, frontRight ? -10 : -40)}
        />
        {/* right (+x) face */}
        <Polygon
          points={pts([P(...b), P(...c), P(...c, h), P(...b, h)])}
          fill={shade(eq.color, frontRight ? -40 : -20)}
        />
        {/* top face */}
        <Polygon
          points={pts([P(...a, h), P(...b, h), P(...c, h), P(...d, h)])}
          fill={shade(eq.color, 25)}
          stroke={isSel ? COLORS.accent : 'rgba(255,255,255,0.35)'}
          strokeWidth={isSel ? 2.5 : 1}
        />
      </React.Fragment>
    );
  });

  const iconSize = Math.max(12, tw * 0.42);
  const icons = blocks.map(({ placed, eq, rx, ry }) => {
    const h = eq.height * (tw / 56);
    const [cx, cy] = P(rx + 0.5, ry + 0.5, h);
    return (
      <View
        key={`i${placed.id}`}
        pointerEvents="none"
        style={[
          styles.icon,
          {
            left: cx - iconSize / 2,
            top: cy - iconSize * 0.75,
            transform: [{ scaleX: (placed.rotation || 0) >= 2 ? -1 : 1 }],
          },
        ]}
      >
        <MaterialCommunityIcons name={eq.icon} size={iconSize} color={COLORS.white} />
      </View>
    );
  });

  // Convert a tap location back to a grid cell (inverse isometric projection).
  const handlePress = (e) => {
    // locationX/Y on native; offsetX/Y on web.
    const ne = e.nativeEvent;
    const locationX = Number.isFinite(ne.locationX) ? ne.locationX : ne.offsetX;
    const locationY = Number.isFinite(ne.locationY) ? ne.locationY : ne.offsetY;
    if (!Number.isFinite(locationX) || !Number.isFinite(locationY)) return;
    const dx = (locationX - ox) / (tw / 2);
    const dy = (locationY - oy) / (th / 2);
    const rx = Math.floor((dx + dy) / 2);
    const ry = Math.floor((dy - dx) / 2);
    if (rx < 0 || ry < 0 || rx >= size || ry >= size) return;
    const [x, y] = unrotate(rx, ry, size, camera);
    onTilePress?.({ x, y, occupied: occupied.has(`${x},${y}`) });
  };

  return (
    <Pressable onPress={handlePress} style={{ width, height }} accessibilityLabel="Gym floor. Tap a tile to place or select equipment.">
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Svg width={width} height={height}>
          <Defs>
            <SvgGradient id="wallL" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={wall.colors[0]} />
              <Stop offset="1" stopColor={wall.colors[1]} />
            </SvgGradient>
            <SvgGradient id="wallR" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={shade(wall.colors[0], -18)} />
              <Stop offset="1" stopColor={shade(wall.colors[1], -18)} />
            </SvgGradient>
          </Defs>
          {/* back walls */}
          <Polygon points={pts([P(0, 0), P(0, size), P(0, size, wallH), P(0, 0, wallH)])} fill="url(#wallL)" stroke="rgba(0,0,0,0.12)" />
          <Polygon points={pts([P(0, 0), P(size, 0), P(size, 0, wallH), P(0, 0, wallH)])} fill="url(#wallR)" stroke="rgba(0,0,0,0.12)" />
          {/* floor slab edge for depth */}
          <Polygon points={pts([P(0, size), P(size, size), P(size, size, -6), P(0, size, -6)])} fill={shade(floor.colors[1], -50)} />
          <Polygon points={pts([P(size, 0), P(size, size), P(size, size, -6), P(size, 0, -6)])} fill={shade(floor.colors[1], -35)} />
          {tiles}
          {blockShapes}
        </Svg>
        {icons}
        {customerPaths.map((path, k) => (
          <Customer key={`c${k}-${camera}`} path={path} delay={k * 250} project={projectCell} size={Math.max(12, tw * 0.38)} />
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  icon: { position: 'absolute' },
});
