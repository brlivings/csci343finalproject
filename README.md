# Biohacker

A blue-and-white React Native (Expo SDK 58) app for learning about **legal, over-the-counter** supplements, tracking a daily stack, and building a virtual 3D gym by acing quizzes.

The compound library follows the [Max Pharma compound tree](https://maxpharma.wiki/compound-tree) (family › group › compound). It includes only substances that are legal to buy OTC as dietary supplements in the US. Anabolic steroids, SARMs, research peptides, prescription drugs and scheduled substances are excluded. The app is for education only and is not medical advice.

## Run it

```bash
npm install
npx expo start        # press i / a, or scan the QR code with Expo Go
```

## Screens (12 pages + 3 modals)

| # | Screen | Navigator |
|---|--------|-----------|
| 1 | Home | Bottom tab |
| 2 | Compound Library | Bottom tab |
| 3 | Compound Detail | Stack |
| 4 | My Stack | Bottom tab |
| 5 | Journal | Stack |
| 6 | Settings | Stack |
| 7 | Quizzes | Bottom tab |
| 8 | Quiz Play | Stack |
| 9 | Quiz Result | Stack |
| 10 | My Gym (isometric 3D) | Bottom tab |
| M1 | Dose modal (add to stack / log dose) | Modal |
| M2 | Equipment shop | Modal |
| M3 | Gym design | Modal |

## Quizzes → virtual gym

* 11 quizzes are generated from the compound data: one per family, plus Dosing Master, Safety First, Evidence Check and The Grand Tree.
* Each grade (A–F) earns **cash** and **XP**. First attempts and new personal bests pay the most.
* XP raises your **level**. Levels unlock 15 machines (dumbbells up to a hyperbaric pod), floor and wall styles, and a bigger floor (5×5 up to 8×8).
* Machines attract **customers**. Customers pay hourly **membership revenue** that you collect, up to 8 hours' worth at a time.
* **Design the gym:** name it, pick floor and wall styles, tap tiles to place machines, then move, rotate or sell them. You can also rotate the camera around the room.

## Course requirements checklist

* **Navigation:** React Navigation native stack plus bottom tabs, inside a `NavigationContainer`, `SafeAreaProvider` and `StatusBar`.
* **Responsive:** `useWindowDimensions` (`src/hooks/useResponsive.js`) drives the column count, landscape layouts and scaled sizes. `app.json` sets `"orientation": "default"`.
* **Styling:** custom Poppins fonts, a splash screen (`expo-splash-screen`), and a theme constants file (`src/constants/theme.js`).
* **Concepts used:**
  1. TextInput with validation: search, dose, note, display name, gym name.
  2. Linking (Examine, PubMed, PubChem, the source tree, FDA) and web-loaded PubChem structure images.
  3. `useMemo` and `useLayoutEffect` (the detail and quiz headers).
  4. `useEffect`.
  5. `Alert`.
  6. Icons (`@expo/vector-icons`).
  7. Switches (Settings).
  8. Linear gradients (`expo-linear-gradient`).
  9. `<Modal>`.
  10. `FlatList` and `map`.
  11. Multiple orientations.
  12. Context API with `useReducer` (`src/context/BiohackerContext.js`).
  13. HTTP requests to the PubChem PUG REST API.
  14. Native device feature: internal storage (`@react-native-async-storage/async-storage`).
  15. Native device feature: haptics/vibration (`expo-haptics`).
  16. Native device feature: biometric lock (`expo-local-authentication`). Community component: `react-native-svg` for the 3D gym.

## Project structure

```
App.js                       providers, fonts, splash, lock screen
src/constants/theme.js       colors, gradients, fonts, sizes, links
src/data/compounds.js        legal compound tree
src/data/quizzes.js          quiz generator
src/data/gym.js              levels, equipment, styles, economy
src/context/                 Context + reducer + AsyncStorage persistence
src/navigation/              stack + tabs
src/screens/                 10 screens
src/components/              cards, modals, IsoGym 3D renderer, ...
docs/milestone1/             Milestone 1 paper + mock-up (PDF/DOCX) and generator
```

## Milestone 1

`docs/milestone1/livingston_CSCI343_milestone1.pdf` is the one-page paper (Calibri 12 pt, 1.5 spacing, 1" margins) with the labeled mock-up appended. To regenerate it with your own name:

```bash
cd docs/milestone1 && python3 make_milestone1.py "First Last" "October 27, 2026"
```
