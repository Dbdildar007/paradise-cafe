---
name: Warm Tactile Hospitality
colors:
  surface: '#fff8f6'
  surface-dim: '#f5d3c8'
  surface-bright: '#fff8f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1ec'
  surface-container: '#ffe9e3'
  surface-container-high: '#ffe2d9'
  surface-container-highest: '#fddbd0'
  on-surface: '#291711'
  on-surface-variant: '#50453e'
  inverse-surface: '#402c24'
  inverse-on-surface: '#ffede7'
  outline: '#82746d'
  outline-variant: '#d4c3ba'
  surface-tint: '#79573f'
  primary: '#553722'
  on-primary: '#ffffff'
  primary-container: '#6f4e37'
  on-primary-container: '#eec1a4'
  inverse-primary: '#eabda0'
  secondary: '#745a34'
  on-secondary: '#ffffff'
  secondary-container: '#fedaaa'
  on-secondary-container: '#795e38'
  tertiary: '#51392c'
  on-tertiary: '#ffffff'
  tertiary-container: '#6a5041'
  on-tertiary-container: '#e7c4b1'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdcc6'
  primary-fixed-dim: '#eabda0'
  on-primary-fixed: '#2d1604'
  on-primary-fixed-variant: '#5f402a'
  secondary-fixed: '#ffddb2'
  secondary-fixed-dim: '#e4c193'
  on-secondary-fixed: '#291800'
  on-secondary-fixed-variant: '#5a421f'
  tertiary-fixed: '#ffdbc9'
  tertiary-fixed-dim: '#e3bfad'
  on-tertiary-fixed: '#2a170c'
  on-tertiary-fixed-variant: '#5a4134'
  background: '#fff8f6'
  on-background: '#291711'
  surface-variant: '#fddbd0'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 36px
    fontWeight: '700'
    lineHeight: 44px
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 10px
    fontWeight: '700'
    lineHeight: 12px
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-sm: 0.75rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-sm: 0.75rem
  margin-lg: 1.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2rem
---

## Brand & Style

This design system expresses the warm, artisanal sophistication of high-end culinary hospitality paired with the functional precision of enterprise-grade ordering. Built for discerning diners seeking elevated comfort cuisine, the visual language balances tactile warmth with airy, modern lightness. 

The aesthetic synthesizes three specific structural treatments:
- **Refined Glassmorphism:** Employed strictly on floating, contextual interface elements such as bottom navigation capsules, contextual cart summary bars, and floating sheet overlays. Glass surfaces use high-blur, low-opacity layered tints with razor-thin top ambient highlights.
- **Warm Micro-Neumorphism:** Applied exclusively to interactive form environments—recessed search wells, coupon fields, quantity steppers, and OTP authentication nodes—to evoke deliberate physical feedback without visual clutter.
- **Soft Claymorphic Embellishment:** Subtle, rounded volume applied strictly to notification pips, dietary markers, loyalty crests, and category badges to add depth against the canvas.

## Colors

The palette draws directly from roasted espresso tones, steamed milk foam, and hand-spun brass finishes. 

- **Primary (`#6F4E37` Cocoa Brown):** Anchors core calls-to-action, primary icons, active navigation states, and key navigational milestones.
- **Secondary (`#C9A87C` Muted Gold):** Reserved for prestige status elements, custom badges, star ratings, price highlights, and tactile accent trims.
- **Tertiary (`#493225` Deep Cocoa):** Used for heavy typographic hierarchy, bold headline titles, and high-emphasis transactional summaries.
- **Neutral (`#5A433B` Roasted Coffee):** Supplies standard body copy, structural framing, and understated iconography.

### Supplementary Application Rules
- **Base Canvas:** `Milk Foam` (`#FDFBF7`) serves as the fundamental viewport ground. It provides a softer, warmer baseline than stark clinical white.
- **Raised Surfaces:** `White Silk` (`#FFFFFF`) isolates cards, list groups, and menu items cleanly over the warm base canvas.
- **Dividers & Strokes:** Structural demarcations rely on `Subtle Divider` (`#E9E0D6`) at 1px thickness; borders must never rely on cold gray tones.
- **Semantic Feedback:** Order fulfillment, customization success, and live status employ `Muted Success Green` (`#48765B`), while inventory limits, dietary warnings, and form validations use `Error Red` (`#B94A48`).

## Typography

The typography leverages **Plus Jakarta Sans** for editorial presence, display titles, and structural labels, balanced with **Inter** for dense transactional elements, ingredient descriptions, and mobile readability.

- **Headlines & Titles:** Set in Plus Jakarta Sans with tighter tracking (-0.02em) to give culinary dishes and promotional sections a tailored, boutique feel.
- **Body & Inputs:** Rendered in Inter with standard tracking to ensure legible scanning of preparation times, allergens, and receipt items on high-density mobile screens.
- **Labels, Badges & Monetary Values:** Set in medium and bold weights of Plus Jakarta Sans with tabular figures enabled for clear vertical price scanning.

## Layout & Spacing

The layout is built around a standard 4-column mobile grid system (expanding to 8 columns on tablet viewports) with strict adherence to device-level safe areas.

- **Base Canvas Margin:** Screen edges utilize a consistent `1rem` (16px) margin on standard phone viewports, scaling to `1.5rem` (24px) on compact tablets.
- **Safe Area Insets:** The canvas enforces an automatic bottom padding offset of `space-xl` (32px) plus the floating glass capsule's height (64px) plus the native system home bar indicator, preventing content clipping during infinite menu scrolls.
- **Rhythm & Stacking:** Vertical section spacing between culinary collections follows a strict `space-xl` (32px) cadence. Card-internal spacing uses `space-md` (16px) padding with `space-sm` (8px) content gaps.

## Elevation & Depth

Visual hierarchy does not use generic black drop shadows; all elevation models are tinted with roasted coffee tones or expressed through blurred translucency.

- **Level 0 (Flat Ground):** Canvas base (`#FDFBF7`) with no shadow.
- **Level 1 (Resting Cards & Surfaces):** White Silk cards float with an ultra-soft dual shadow:
  - Ambient: `0 4px 20px -2px rgba(111, 78, 55, 0.06)`
  - Direct: `0 1px 3px 0 rgba(73, 50, 37, 0.04)`
  - Edge: 1px border using `#E9E0D6`
- **Level 2 (Floating Glass Capsule & Translucent Sheets):**
  - Background: `rgba(253, 251, 247, 0.78)` with `backdrop-filter: blur(20px) saturate(180%)`
  - Highlight Rim: `inset 0 1px 1px 0 rgba(255, 255, 255, 0.85)`
  - Bottom Rim: `inset 0 -1px 1px 0 rgba(201, 168, 124, 0.2)`
  - External Drop: `0 12px 32px -4px rgba(73, 50, 37, 0.12)`
- **Level 3 (Recessed Neumorphic Wells):** Used for search bars, quantity steppers, and verification inputs:
  - Inset Top/Left: `inset 2px 2px 5px rgba(90, 67, 59, 0.08)`
  - Inset Bottom/Right: `inset -2px -2px 5px rgba(255, 255, 255, 0.9)`
  - Fill: `#F5EEE5` (Warm Cream)
- **Level 4 (Claymorphic Badges & Markers):**
  - Outer: `0 4px 10px rgba(111, 78, 55, 0.15)`
  - Inner Highlight: `inset 0 2px 3px rgba(255, 255, 255, 0.6)`
  - Inner Shadow: `inset 0 -2px 3px rgba(73, 50, 37, 0.15)`

## Shapes

The design uses a pill-shaped curvature standard (`roundedness: 3`).

- **Pill Primitives:** Buttons, category filter chips, search pods, floating capsule docks, and cart badges use full pill geometry (`9999px` / `rounded-full`).
- **Cards & Visual Containers:** Menu item cards, promotional feature banners, and bottom sheet containers utilize `rounded-xl` (3rem / 48px or proportional 24px–32px radii relative to viewport bounds) to maintain an organic, tactile, and friendly aesthetic.
- **Input Fields & Small Surfaces:** Steppers and selection targets use `rounded-lg` (2rem / 32px) to ensure soft, finger-friendly interaction points.

## Components

### Floating Navigation Capsule (Signature Component)
- **Geometry:** Floating pill shape, detached 16px above the device bottom safe area, centered horizontally with 16px lateral margins.
- **Material:** Translucent Warm Glass (`rgba(253, 251, 247, 0.82)`) with a 24px backdrop blur, bordered by a 1px composite outline (`rgba(255, 255, 255, 0.9)` on top, fading to `rgba(201, 168, 124, 0.25)` on the bottom edge).
- **Active State Indicator:** A solid Cocoa Brown (`#6F4E37`) pill capsule sliding beneath the active icon, with the icon tinted White Silk (`#FFFFFF`). Inactive icons sit in Roasted Coffee (`#5A433B`) at 60% opacity.

### Buttons & CTAs
- **Primary Action:** Solid Cocoa Brown fill, White Silk label, `rounded-full` curvature, with a soft gold focus glow (`rgba(201, 168, 124, 0.3)`). Height fixed at 52px for mobile thumb reach.
- **Secondary Action:** Transparent base, 1.5px solid Cocoa Brown border, Cocoa Brown typography.
- **Tactile Cart Button:** Full-width floating pill with an internal split: item counter in a soft clay badge on the left, action verb centered, and localized total on the right.

### Input Fields & Stepper Controls
- **Search & Text Inputs:** Recessed neumorphic well with Warm Cream (`#F5EEE5`) fill, inset shadows, Roasted Coffee placeholder text, and an illuminated 1.5px Muted Gold border upon activation.
- **OTP Verification Blocks:** 48x56px rounded-lg recessed boxes with centered display typography that transition to a soft clay highlight when focused.
- **Quantity Steppers:** Compact recessed track housing dual raised circular buttons with tactile + and − glyphs, preventing accidental taps via 40px minimum target bounds.

### Cards & Menu Listings
- **Culinary Item Card:** White Silk surface, 16px internal padding, `rounded-xl` radius. Food imagery is framed in a 1:1 or 16:10 aspect ratio with warm editorial lighting and soft rounded corners.
- **Dietary & Speciality Tags:** Mini claymorphic badges (e.g., green dot inside a warm cream rounded square for vegetarian markers, gold leaf badges for chef specials).

### Chips & Horizontal Filters
- **Resting:** Warm Cream surface, subtle divider border, roasted coffee text.
- **Selected:** Cocoa brown surface, white silk text, supported by an ambient gold-tinted elevation shadow.