---
name: nativewind-linkingcontext-audit
description: Detect, audit, and fix NativeWind v4 and react-native-css-interop runtime upgrade collisions that trigger fatal "Render Error: Couldn't find a LinkingContext context" red screens in Expo Router mobile apps. Use whenever mobile buttons crash Expo on click, accordion cards fail on expansion, or dynamic Tailwind classes cause render-time exceptions.
compatibility: Requires Node.js >= 18, NativeWind v4+, react-native-css-interop, Expo Router / React Navigation
metadata:
  author: ant-agent
  version: "1.0.0"
---

# NativeWind LinkingContext Collision Audit & Remediation Skill

This skill provides the authoritative diagnosis, scanning rules, automated CLI audit tool, and deterministic code recipes for preventing and resolving the notorious **`Render Error: Couldn't find a LinkingContext context`** crash occurring in Expo Router applications built with NativeWind v4 (`react-native-css-interop`).

---

## 1. Anatomy of the Problem

### The Red Herring Error
When tapping a button or expanding an accordion on mobile Expo, developers see:
```text
Render Error
Couldn't find a LinkingContext context.

Call Stack:
  replace
  stringify (react-native-css-interop/dist/runtime/native/render-component.js:135)
  printUpgradeWarning (render-component.js:122)
  renderComponent (render-component.js:62)
```

### Why it happens
1. **Dynamic Upgrades**: In NativeWind v4, styling triggers like `active:*` pseudo-classes, dynamic/conditional `shadow-*` additions, or CSS combinators (`space-y-*`) cause `react-native-css-interop` to flag a component as `SHOULD_UPGRADE` after its initial render.
2. **Diagnostic Serialization**: To output a dev warning, `printUpgradeWarning()` calls `JSON.stringify(props, replacer)` which executes `Object.entries(value)` recursively on the component props and captured React fiber context references.
3. **Throwing Context Getter**: In `@react-navigation/native` / Expo Router, `LinkingContext` initializes with an unconfigured default object whose `get options()` explicitly throws:
   ```typescript
   get options() {
     throw new Error("Couldn't find a LinkingContext context.");
   }
   ```
   `Object.entries()` forces evaluation of all object property getters, tripping this error and crashing native mobile immediately.
4. **Why Web Works but Mobile Fails**: Expo Web delegates directly to the browser CSS engine (where `:active` and box-shadow classes are native CSS), so NativeWind's JS upgrade warning engine is completely bypassed. Mobile native requires the JS thread interop engine.

---

## 2. Trigger Patterns & Antipatterns

| Antipattern | Why it breaks mobile | Safe Replacement |
|---|---|---|
| `<TouchableOpacity className="active:bg-blue-600">` | Flags `state.pressable = SHOULD_UPGRADE` on press | `<TouchableOpacity activeOpacity={0.8} className="bg-blue-600">` |
| `className={isOpen ? 'bg-white shadow-sm' : ''}` | Injects shadow & elevation after mount, triggering upgrade warning | Use static inline `style={{ backgroundColor: '#fff', shadowColor: '#000', elevation: 1 }}` |
| `<View className="space-y-3.5">` | Compiles to sibling CSS combinators (`> * ~ *`), forcing interop wrapper layers | `<View className="gap-3.5">` |
| Conditional `active:text-*` / `active:border-*` | Forces component remount/upgrade on press | Use component state `onPressIn` / `onPressOut` or `activeOpacity` |

---

## 3. Automated Audit Script

Run the automated scanner included in this skill against your mobile source directory:

```bash
node .agents/skills/nativewind-linkingcontext-audit/scripts/audit.js apps/customer-mobile/src
```

### Scanner Output
The script identifies:
- Active pseudo-classes (`active:bg-*`, `active:text-*`, `active:border-*`) on touchable targets.
- Dynamic template literals interpolating `shadow-*` classes conditionally.
- Sibling combinator utilities (`space-y-*`, `space-x-*`).

---

## 4. Remediation Standard Recipes

### Recipe A: Buttons & Touchables
❌ **Broken**:
```tsx
<TouchableOpacity
  activeOpacity={0.8}
  onPress={handlePress}
  className="w-full h-11 bg-[#215cd4] active:bg-[#194cb5] shadow-sm rounded-lg items-center justify-center"
>
  <Text className="text-white font-semibold">Submit</Text>
</TouchableOpacity>
```

✅ **Fixed**:
```tsx
<TouchableOpacity
  activeOpacity={0.8}
  onPress={handlePress}
  className="w-full h-11 bg-[#215cd4] rounded-lg items-center justify-center"
  style={{
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  }}
>
  <Text className="text-white font-semibold">Submit</Text>
</TouchableOpacity>
```

---

### Recipe B: Accordions & Dynamic Tabs
❌ **Broken**:
```tsx
<TouchableOpacity
  onPress={onToggle}
  className={`p-3.5 rounded-2xl border ${
    isOpen ? 'border-[#dbe5f9] bg-white shadow-sm' : 'bg-[#f8f8f8] border-gray-200'
  }`}
>
  {/* Content */}
</TouchableOpacity>
```

✅ **Fixed**:
```tsx
<TouchableOpacity
  onPress={onToggle}
  className="p-3.5 rounded-2xl border"
  style={
    isOpen
      ? {
          borderColor: '#dbe5f9',
          backgroundColor: '#ffffff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 2,
          elevation: 1,
        }
      : {
          backgroundColor: '#f8f8f8',
          borderColor: '#e5e7eb',
        }
  }
>
  {/* Content */}
</TouchableOpacity>
```

---

### Recipe C: Layout Lists & Form Groups
❌ **Broken**:
```tsx
<View className="space-y-4">
  <TextInput className="h-12 border rounded-xl" />
  <TextInput className="h-12 border rounded-xl" />
</View>
```

✅ **Fixed**:
```tsx
<View className="gap-4">
  <TextInput className="h-12 border rounded-xl" />
  <TextInput className="h-12 border rounded-xl" />
</View>
```

---

## 5. Verification Checklist

Before releasing a build or commit:
1. Run `node .agents/skills/nativewind-linkingcontext-audit/scripts/audit.js <srcPath>`.
2. Ensure no interactive components dynamically toggle `shadow-*` or declare `active:bg-*`.
3. Restart Metro with a clean cache:
   ```bash
   npx expo start -c
   ```
4. Test on a native mobile client (Expo Go or Dev Client APK/IPA) by opening/closing accordion states and tapping action buttons.

