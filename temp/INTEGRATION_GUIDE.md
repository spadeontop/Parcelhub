# ParcelHub Help Center, FAQ & Counter Policies Staging

> **Staging Location**: Strictly isolated in `c:\Users\Juliet\Desktop\Spadeontop\Parcelhub\temp` per user instructions.  
> **Status**: Redesigned with a clean, natural mobile layout without AI clutter. Ready for review before merging into `mobile-web-prototype`.

---

## 1. What Has Been Updated in `/temp`

1. **`temp/index.html` & `temp/faq.html`** (Interactive Standalone Mobile Prototype):
   - Opens directly in any web browser without needing to run `npm` or Vite.
   - Clean, human-designed mobile interface matching ParcelHub's authentic aesthetic.
   - Smooth slide-down accordion with `>` chevron rotating down 90°.
   - Clean segmented control: `[ Frequently Asked ]` and `[ Counter Policies ]`.
   - Real-time search with instant clear (`✕`) button.

2. **`temp/FaqScreen.tsx`** (Modular React TSX Component):
   - Fully typed React component using ParcelHub's Tailwind CSS classes.
   - Matches the streamlined design of `temp/index.html` exactly.
   - Ready to be moved into `mobile-web-prototype/src/components/screens/FaqScreen.tsx` when instructed.

---

## 2. Redesign Highlights (Removing "AI-Generated" Clutter)

- **Removed AI Clutter**:
  - Eliminated green boxes, repetitive pill badges, checkmark checklists, and corporate jargon.
  - Simplified headers and segmented buttons into a natural native mobile feel (`#f0f3f8` container with active white pill).
- **Clean Accordion Pattern (`>` Chevron)**:
  - Each question or policy card displays `>` on the right.
  - Tapping slides open the answer smoothly while the `>` smoothly rotates 90° downward and turns ParcelHub primary blue (`#215cd4`).
- **Conversational, Direct Content**:
  - Direct, clear answers tailored to customers using Lily's Catering Hub in Yati, Liloan.
  - **No MPIN on Claiming**: Parcel claiming is verified via Alphanumeric Pickup Key (e.g. PH-402-5544) or QR code after initiating claim. MPIN is strictly for fast/secure account login.
  - **No "Forgot MPIN" Question**: Omitted since the feature is not yet implemented.
- **Relocated Counter Policies**:
  - Migrated policies previously tucked into the quick modal into full accordion cards alongside the FAQs.

---

## 3. How to Open & Test

Open the prototype directly in your browser:
```text
C:\Users\Juliet\Desktop\Spadeontop\Parcelhub\temp\index.html
```
or in your browser address bar:
```text
file:///C:/Users/Juliet/Desktop/Spadeontop/Parcelhub/temp/index.html
```

---

## 4. Future Merge Plan (When Ready)

Once you approve this interface, we will perform the following steps:
1. Copy `temp/FaqScreen.tsx` to `mobile-web-prototype/src/components/screens/FaqScreen.tsx`.
2. Add `'faq'` to `ScreenId` in `mobile-web-prototype/src/types/index.ts`.
3. In `mobile-web-prototype/src/components/layout/BottomNav.tsx`:
   Update the navbar `?` button from opening the old modal to calling `navigateTo('faq')`.
4. In `mobile-web-prototype/src/App.tsx`:
   Render `<FaqScreen onBack={() => navigateTo('home')} />`.
