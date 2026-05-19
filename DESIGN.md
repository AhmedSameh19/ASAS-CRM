---
name: Asas CRM
colors:
  surface: '#f9f9ff'
  surface-dim: '#d3daef'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container: '#e9edff'
  surface-container-high: '#e1e8fd'
  surface-container-highest: '#dce2f7'
  on-surface: '#141b2b'
  on-surface-variant: '#444651'
  inverse-surface: '#293040'
  inverse-on-surface: '#edf0ff'
  outline: '#757682'
  outline-variant: '#c5c5d3'
  surface-tint: '#4059aa'
  primary: '#00236f'
  on-primary: '#ffffff'
  primary-container: '#1e3a8a'
  on-primary-container: '#90a8ff'
  inverse-primary: '#b6c4ff'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#4b1c00'
  on-tertiary: '#ffffff'
  tertiary-container: '#6e2c00'
  on-tertiary-container: '#f39461'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dce1ff'
  primary-fixed-dim: '#b6c4ff'
  on-primary-fixed: '#00164e'
  on-primary-fixed-variant: '#264191'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#ffdbcb'
  tertiary-fixed-dim: '#ffb691'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#773205'
  background: '#f9f9ff'
  on-background: '#141b2b'
  surface-variant: '#dce2f7'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
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
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 20px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The design system is built for high-velocity startup founders who require a "source of truth" that feels both powerful and invisible. The brand personality is **utilitarian, reliable, and decisive**. 

The aesthetic follows a **Modern Corporate** approach with heavy influences from **Minimalism**. It prioritizes information density and functional clarity over decorative elements. The goal is to evoke a sense of organized calm within the chaotic environment of a growing startup, ensuring that data is scannable and actions are intuitive.

## Colors
This design system utilizes a structured palette designed for professional data environments.
- **Primary (Deep Blue):** Used for core navigation, primary actions, and brand identification. It represents stability and professional rigor.
- **Secondary (Warm Amber):** Reserved for high-attention alerts, pending states, or secondary calls-to-action that need to stand out from the blue-heavy UI.
- **Accent (Teal):** Used for success states, growth indicators, and "active" status markers to provide a refreshing contrast.
- **Neutral & Background:** The background uses a soft light gray (#F3F4F6) to reduce eye strain, while pure white (#FFFFFF) is reserved for "Surface" containers like cards and panels to create clear visual separation.

## Typography
The typography system relies exclusively on **Inter** to maintain a clean, systematic, and highly legible interface. 

- **Headlines:** Use tighter letter-spacing and heavier weights to anchor sections of the dashboard.
- **Body Text:** Optimized for readability at 14px (Body-MD) for dense data tables and 16px (Body-LG) for standard prose or descriptions.
- **Labels:** Small caps or medium weights are used for table headers and form labels to distinguish them from user-generated content.

## Layout & Spacing
The design system employs a **Fluid Grid** model optimized for dashboard layouts. The layout is structured around a 12-column system on desktop and a single column on mobile.

- **Dashboard Scaffolding:** Uses a fixed-width sidebar (240px) with a fluid main content area.
- **Spacing Rhythm:** A 4px baseline grid ensures consistent vertical rhythm. Content-heavy areas like data tables use 'sm' (8px) padding for density, while 'lg' (24px) padding is used for container margins to provide breathing room.
- **Breakpoints:**
  - Mobile: < 640px (Margins: 16px)
  - Tablet: 640px - 1024px (Margins: 24px)
  - Desktop: > 1024px (Margins: 32px)

## Elevation & Depth
Depth is conveyed through **Tonal Layering** and **Low-Contrast Outlines**. Rather than aggressive shadows, this design system uses a "Stack" metaphor:

1.  **Level 0 (Background):** #F3F4F6 — The canvas.
2.  **Level 1 (Surface):** #FFFFFF with a 1px border (#E5E7EB) — Used for cards, tables, and the main workspace.
3.  **Level 2 (Popovers/Modals):** #FFFFFF with a subtle ambient shadow (0px 4px 12px rgba(0,0,0,0.05)) and a 1px border.

Shadows should be neutral, diffused, and used sparingly only to indicate temporary or floating elements (like dropdowns or tooltips).

## Shapes
The design system uses a **Rounded** shape language (0.5rem base) to soften the "industrial" feel of the CRM and make it feel modern and accessible.

- **Buttons & Inputs:** 0.5rem (rounded-md)
- **Cards & Large Containers:** 1rem (rounded-lg)
- **Status Tags/Chips:** Full pill-shape (999px) to distinguish them from interactive buttons.
- **Selection Rings:** A 2px offset ring is used for focus states to ensure accessibility without breaking the element's silhouette.

## Components
- **Buttons:** 
  - *Primary:* Solid Deep Blue with white text. 
  - *Secondary:* Outline (1px border) with Deep Blue text. 
  - *Ghost:* No border/background, used for utility actions in tables.
- **Input Fields:** 1px border (#D1D5DB), transitions to a 2px Deep Blue ring on focus. Background is pure white.
- **Cards:** White background, 1px neutral border, subtle 0.5rem corner radius. No shadow unless hovering in interactive states.
- **Data Tables:** High density. 12px padding on cells. Subtle horizontal dividers only (no vertical lines). Header row uses Gray-50 background and Label-SM typography.
- **Chips/Badges:** Small, uppercase text. Success (Teal background, 10% opacity), Warning (Amber background, 10% opacity).
- **Sidebar:** Dark neutral or very light gray, using "Active" states with a 2px vertical primary color bar on the left edge of the active menu item.

## Mobile & Responsive
The mobile and responsive strategy ensures the CRM tool remains robust, visually cohesive, and fully functional on smaller viewports.

### Breakpoints & Layout Adapting
The design system dynamically adjusts across three principal breakpoints:
- **Mobile Viewport (< 640px):** Single-column layout. Main container margins are reduced to `16px`. Left fixed sidebar collapses entirely. Font sizes scale down, using the custom `headline-lg-mobile` token (`24px` instead of `30px`).
- **Tablet Viewport (640px - 1024px):** Dual-column grid layouts for dashboard tiles. Grid container margins are `24px`. The left sidebar collapses to an icon-only "rail" layout to prioritize primary workspace area.
- **Desktop Viewport (> 1024px):** Standard 12-column layout. Margins are `32px`. Left sidebar is fully expanded to a fixed width of `240px`.

### Mobile Navigation Behavior
On viewports `< 1024px`, the desktop sidebar navigation is replaced by touch-friendly mobile navigation controls:
- **Hamburger Menu Header:** A persistent slim header (`#ffffff` or `#0b1120` in dark mode) appears at the top of the viewport. It contains a left-aligned hamburger menu icon, the center-aligned brand logo, and right-aligned quick user actions. Tapping the hamburger icon triggers a slide-out navigation drawer.
- **Thumb-Friendly Bottom Tab Bar:** For maximum utility, the active mobile views feature a sticky bottom navigation bar with four high-priority tabs: **Dashboard, Prospects, Pipeline, and Analytics**. The tabs use prominent centered icons with small, high-contrast text labels.
- **Floating Action Button (FAB):** Crucial viewport-specific actions (such as adding a new prospect or logging a phone call) are promoted to a fixed floating button (`FAB`) at the bottom-right corner of the viewport, styled in vibrant deep blue (`#00236f`) or high-contrast amber.

### Touch Target & Interactive Sizes
To support thumb-driven interaction and comply with WCAG 2.1 AAA accessibility standards:
- **Minimum Target Size:** All buttons, input boxes, select dropdown triggers, and interactive elements have a minimum physical size/tappable area of **48px x 48px** to prevent misclicks.
- **Form Inputs:** Input heights are enlarged to a minimum of **44px** with generous text-indent and internal padding.
- **Increased Padding:** List rows, data chips, and table cells expand cell heights with `16px` vertical padding on mobile, providing breathing room for touch gestures.

### Desktop-to-Mobile Screen Transitions
The 7 desktop views transition to their corresponding mobile layouts as follows:

1. **Login Page:**
   - *Desktop:* Split-screen layout. The left side displays a premium brand hero illustration, and the right side hosts the login credentials panel.
   - *Mobile:* The left graphic is hidden. The login panel occupies 100% viewport width, scaling form elements up for fluid touch interaction.
2. **Dashboard View:**
   - *Desktop:* 4-column metric card grid, side-by-side Pipeline Funnel and Industry Pie Chart, and side-by-side recent activities panel.
   - *Mobile:* Grid elements stack vertically. The 4 KPI cards flow sequentially, followed by the charts (scaled to full width with wrapped legend lists underneath). Manual refresh action is easily reachable at the top right.
3. **Prospects List View:**
   - *Desktop:* Dense 12-column table displaying Company, Contact, Status, Industry, Source, Date Created, and Action controls.
   - *Mobile:* Table collapses to show only the `Company Name`, `Contact Person`, and `Status` badge. Tap actions are made easier by expanding the entire row as a link to `ProspectDetailView`. Filter elements stack into full-width selectors at the top of the list view.
4. **Pipeline Kanban Board View:**
   - *Desktop:* Multi-column board layout with sticky columns for horizontal drag-and-drop of prospects.
   - *Mobile:* Horizontal scroll is restricted. Instead, the screen adapts to a swipeable multi-tab layout where users click stage tabs (e.g. `New`, `Scheduled`, `Completed`) at the top of the page, viewing a single high-density vertical list per tab.
5. **Analytics View:**
   - *Desktop:* Complex side-by-side charts, comprehensive stats, and advanced table reports.
   - *Mobile:* Layout stacks completely vertically. Grid charts are scaled down, tooltips are optimized for single-touch toggle, and legend lists are converted to scrollable wraps.
6. **Prospect Detail View:**
   - *Desktop:* Split three-panel canvas containing profile details (left), activity timeline (center), and documents/actions (right).
   - *Mobile:* Panels stack vertically (Info -> Actions -> Activity Feed) or are segmented under mobile tab selectors at the top of the detail screen (e.g. `Details`, `Activity`, `Documents`) to keep information easily digestible.
7. **Asas CRM Flow View:**
   - *Desktop:* Full-bleed diagram canvas illustrating pipeline stages, automation nodes, and connectors.
   - *Mobile:* Statically adapted into an interactive linear vertical step-by-step progress timeline list, detailing pipeline stages and automation rules in a readable card format.