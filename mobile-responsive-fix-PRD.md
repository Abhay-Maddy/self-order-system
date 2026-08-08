# Product Requirements Document (PRD)
## Mobile-Responsive Fix — Amantran Self-Ordering Platform

**Document version:** 1.0
**Prepared for:** Engineering fix on existing production app (`Abhay-Maddy/self-order-system`)
**Status:** Ready for build sign-off (source: code audit + build prompt for Antigravity)
**Owner:** Product/Founder
**Reviewers:** Engineering

> **Methodology note:** Built using the same **prompt-chaining** technique as the platform PRD — each Chain reasons from the output of the one before it (Problem → Users → Scope → Requirements → Technical Approach → Constraints → Metrics → Risks → Rollout → Sign-off), so every fix traces back to a confirmed root cause instead of being a loose bug list.

---

## Chain 1 — Problem Statement & Goals

**Problem:** The live app (desktop UI) works correctly, but the same app is broken for phone users — the primary target audience. A source-level audit confirmed the root cause: **there is no responsive JavaScript logic anywhere in the codebase** (no `window.innerWidth`, `matchMedia`, or `isMobile` checks across ~40 components). Layout is done almost entirely with fixed inline styles written for a laptop viewport, with only two shallow CSS `@media` blocks handling fonts/buttons — nothing structural.

**Goal:** Make every panel (Customer, Kitchen, Waiter, Admin/Cashier) fully usable on phone-width screens, **without changing anything about the desktop experience** — this is a scoped responsive-layout fix, not a redesign or feature change.

**Primary objectives:**
1. Fix the confirmed structural layout bugs (sidebar grid, fixed-width dropdowns, rigid multi-column grids) that break phone usability.
2. Reflow data-dense views (Kitchen/Waiter ticket boards, Admin tables) into mobile-appropriate patterns without losing any functionality.
3. Guarantee zero visual or behavioral regression on desktop (≥1024px).

**Non-goals:** redesigning the visual identity, changing desktop layout in any way, adding new features, or migrating to a CSS framework.

---

## Chain 2 — User Personas (mobile context)

| Persona | Mobile context | Core need |
|---|---|---|
| **Diner (Customer)** | Ordering from their own phone at the table | Thumb-reachable cart/checkout, no off-screen elements |
| **Chef / Kitchen Staff** | Glancing at a phone or mounted tablet mid-shift | Large tap targets, no horizontal-scroll-only tables |
| **Waiter** | Moving between tables with a phone in hand | Same card-based reflow as Kitchen, legible status badges |
| **Owner / Admin / Cashier** | Checking the dashboard from a phone away from the counter | Sidebar must not permanently eat the content width |

*(Note: the Waiter role/panel was discovered during the code audit and was not in the original platform PRD's panel list — included here as it shares the same underlying bug pattern.)*

---

## Chain 3 — Scope

### In scope (v1 of this fix)
- Structural layout fixes scoped strictly behind mobile breakpoints (`max-width: 768px` / `480px`, reusing the app's existing breakpoints)
- `AdminPanel.jsx` sidebar → hamburger/drawer collapse on mobile
- `TableSessionHeader.jsx` fixed-width dropdown/input overflow fixes
- `DashboardOverview.jsx` rigid 4-column grid → stacking behavior
- `CheckoutModal.jsx` multi-column form grids → single column on mobile
- `KitchenPanel.jsx` / `WaiterPanel.jsx` ticket tables → stacked card layout on mobile
- Mobile UX patterns: bottom-sheet modals, bottom-pinned cart bar, larger tap targets

### Out of scope (this fix)
- **Any change to desktop (≥1024px) rendering — hard constraint, not a trade-off**
- New features or functional changes of any kind
- Introducing a CSS framework (Tailwind/Bootstrap) — must stay within the existing CSS-variable design system
- Changes to shared `--` CSS variables (colors/spacing tokens), since those apply to both breakpoints
- Folder restructuring or file renames

---

## Chain 4 — Functional Requirements

*(Each requirement traces to a confirmed file/line from the code audit — see the companion Antigravity build prompt for exact references.)*

| # | Requirement | File | Priority |
|---|---|---|---|
| M1 | Collapse Admin sidebar into a hamburger-triggered drawer/bottom sheet below 768px; content becomes full-width | `Admin/AdminPanel.jsx` | Must |
| M2 | Clamp fixed-width dropdown panels (240px/290px) and the 130px input so nothing renders off-screen at 360–390px | `Customer/TableSessionHeader.jsx` | Must |
| M3 | Stack the rigid 4-column stat grid to 2 columns (≤768px) and 1 column (≤480px) | `Admin/DashboardOverview.jsx` | Must |
| M4 | Collapse all multi-column checkout form grids to a single column below 480px | `Customer/CheckoutModal.jsx` | Must |
| M5 | Replace horizontal-scroll ticket tables with a stacked card-per-order layout below 768px, preserving all actions (accept/reject/status/print) | `Kitchen/KitchenPanel.jsx`, `Waiter/WaiterPanel.jsx` | Must |
| M6 | Use `MenuGrid.jsx`'s existing `auto-fill, minmax(280px, 1fr)` pattern as the reference for any other grid touched but not explicitly listed | `Customer/MenuGrid.jsx` | Should (reference only, no change needed) |
| M7 | Bottom-sheet behavior (slide up, full-width) for Customer modals (`CheckoutModal`, `ItemCustomizationModal`, `CartDrawer`) on mobile | `Customer/*Modal.jsx`, `CartDrawer.jsx` | Should |
| M8 | Minimum ~44px touch targets for Kitchen Accept/Reject/status-update buttons | `Kitchen/*` | Should |
| M9 | Admin's internal data tables (reports, customer DB, inventory) scroll horizontally within their own card rather than breaking page layout | `Admin/ReportsView.jsx`, `Admin/CustomerDatabaseView.jsx`, `Admin/InventoryManager.jsx` | Could |

*(Priority key: Must = blocking for this fix to be considered done, Should = expected in the same pass, Could = acceptable to defer if time-constrained.)*

---

## Chain 5 — Technical Approach

Derived directly from Chain 4 — the implementation must satisfy every requirement above while respecting the non-negotiable desktop constraint:

- **Visual/spacing-only fixes** (grid columns, widths, font sizes): extend the existing `@media (max-width: 768px)` / `@media (max-width: 480px)` blocks in `src/index.css`, or add scoped utility classes components can conditionally apply.
- **Structural/JS fixes** (sidebar collapse, card-vs-table switching): introduce a small shared `useIsMobile()` hook (`window.innerWidth`/`matchMedia` + resize listener) rather than duplicating breakpoint logic per component.
- No new dependencies, no CSS framework, no changes to shared CSS variables.
- All fixes live in existing files/folders — no restructuring.

---

## Chain 6 — Non-Functional Requirements & Constraints

- **Zero desktop regression (hard constraint):** every change gated behind a mobile condition; nothing unconditional touches shared inline styles used at ≥1024px.
- **No functional loss:** every action available on desktop (accept/reject, status updates, cart, coupon, payment, staff approval, etc.) must remain fully reachable on mobile — this is a layout fix, not a feature change.
- **Consistency:** new mobile patterns (drawer, bottom sheet, card layout) must use the existing design tokens (`--brand-primary`, `--border-radius`, etc.) so they look native to the app, not bolted on.
- **Performance:** resize-listener-based mobile detection must not cause layout thrashing or noticeable jank when resizing/rotating.

---

## Chain 7 — Success Metrics

| Metric | Target |
|---|---|
| Desktop visual diff (≥1024px) | Zero detectable change, pre- vs. post-fix |
| Elements rendering outside viewport at 360px | Zero (dropdowns, modals, fixed-width panels) |
| Admin dashboard usability at 375px | Sidebar reachable via drawer; content never squeezed |
| Kitchen/Waiter ticket usability at 375px | No horizontal-scroll-only interaction required |
| Functional parity | 100% of desktop actions remain reachable on mobile |

---

## Chain 8 — Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| A shared inline style gets edited without a breakpoint guard | Unintended desktop regression | Explicit acceptance criterion + manual pixel-diff check at ≥1024px before sign-off |
| Card-layout reflow for Kitchen/Waiter hides an action that was previously visible | Chef/waiter can't complete a task on mobile | Requirement M5 explicitly requires all existing actions to remain reachable, just reflowed |
| `useIsMobile()` resize listener causes re-render thrashing | Janky UI, battery drain | Debounce the resize handler; test on an actual device, not just DevTools emulation |
| Scope creep into visual redesign | Delays fix, invites new regressions | Chain 3 explicitly excludes redesign/new features from this PRD |

---

## Chain 9 — Rollout Plan / Milestones

1. **M1:** Admin sidebar drawer collapse (highest-impact fix — this is the most broken screen on mobile today).
2. **M2:** TableSessionHeader dropdown/input overflow fix + DashboardOverview grid stacking.
3. **M3:** CheckoutModal single-column form fix.
4. **M4:** Kitchen/Waiter card-layout reflow.
5. **M5:** Polish pass — bottom-sheet modals, tap-target sizing, Admin table scroll containment.

---

## Chain 10 — Acceptance Criteria (sign-off checklist)

- [ ] Desktop (≥1024px) is pixel-identical to current production — verified by side-by-side comparison.
- [ ] Admin/Cashier dashboard fully usable at 375px width, sidebar via drawer.
- [ ] No dropdown, modal, or fixed-width element renders outside viewport bounds at 360px.
- [ ] Checkout form fields are single-column and legible at 375px.
- [ ] Kitchen and Waiter ticket views usable without horizontal-scroll dependency at 375px.
- [ ] All existing functionality remains reachable and working on mobile across all four panels.
