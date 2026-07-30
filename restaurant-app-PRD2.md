# Product Requirements Document (PRD)
## QR-Based Self-Ordering Restaurant Platform

**Document version:** 1.1 (reviewed & refined)
**Prepared for:** Restaurant self-ordering system (Customer / Kitchen / Admin)
**Status:** Ready for build sign-off (companion to the Antigravity build prompt)
**Owner:** Product/Founder
**Reviewers:** Admin/Owner, Kitchen Lead, Engineering

> **Methodology note:** This PRD is built as a **chain** — each section (Chain) is a reasoning step that consumes the output of the one before it: Problem → Users → Scope → Requirements → Data → Constraints → Metrics → Risks → Rollout → Decisions. Nothing in a later Chain should contradict an earlier one; if it does, the earlier Chain wins and gets revised first. This traceability is the main value of the format over a flat feature list.

---

## Chain 1 — Problem Statement & Goals

**Problem:** Dine-in ordering today depends on waitstaff availability for taking orders, relaying kitchen requests, and handling payment — causing delays, order errors, and no real-time visibility for the kitchen or the customer.

**Goal:** Let a customer self-order by scanning a table QR code, let the kitchen manage preparation per item in real time, and let the owner run the full operation (menu, staff, inventory, billing, analytics) from one dashboard — with all three panels synced live.

**Primary objectives:**
1. Reduce order-taking time and human error by moving ordering to the customer's own device.
2. Give kitchen staff a clear, real-time, per-item queue instead of verbal/paper tickets.
3. Give the owner one dashboard for sales, inventory, staff, and compliance (GST invoicing).
4. Increase review volume/quality by converting in-app ratings into Google Maps reviews.

**Non-goals (explicitly not a goal of v1):** replacing waitstaff entirely, running delivery logistics, or managing multiple restaurant locations from one account. (Expanded in Chain 3.)

---

## Chain 2 — User Personas

| Persona | Description | Core need | Primary panel |
|---|---|---|---|
| **Diner (Customer)** | Sits at a table, scans QR, orders on their own phone | Fast, accurate ordering with no app install or login | Customer |
| **Chef / Kitchen Staff** | Manages food prep at the pass or on a kitchen tablet | Clear, real-time, prioritized order queue | Kitchen |
| **Owner / Admin** | Manages the restaurant's operations and finances | Full visibility & control: menu, staff, sales, compliance | Admin |
| **Cashier** | Front-of-house billing and payment reconciliation | Fast checkout, refund handling, invoice generation | Admin (restricted role) |

---

## Chain 3 — Scope

### In scope (v1)
- Three panels: Customer, Kitchen, Admin/Owner/Cashier (shared backend, role-based access)
- QR-based table session (no customer login)
- Full menu browsing, customization, cart, coupon, checkout (online + cash)
- Per-item order type (dine-in vs. packing) and per-item kitchen status/rejection
- Real-time sync across all panels via WebSockets
- Staff approval workflow for chef accounts
- Admin CRUD for menu/categories/tables/staff/coupons/inventory
- GST invoice generation, refunds, reports, analytics dashboard
- QR code generation per table
- Multi-language UI, dark mode
- Post-order rating flow with a guided path to Google Maps review

### Out of scope (v1 — candidate for v2)
- Multi-restaurant/franchise management from one login
- Delivery/pickup logistics beyond in-restaurant dine-in/packing
- Loyalty points / rewards program
- Fully automated (silent) posting of reviews to Google without customer action — **not permitted by Google's policies**, see Chain 6
- Native mobile apps (v1 is a responsive PWA)

---

## Chain 4 — Functional Requirements

*(Every requirement below implies: the resulting state change must sync in real time to the other two panels where relevant — this is not repeated per row.)*

### 4.1 Customer Panel
| # | Requirement | Priority |
|---|---|---|
| C1 | Scanning a table's QR code opens the menu with that table number pre-attached, no login required | Must |
| C2 | Menu is browsable by category and admin-defined subcategory (e.g., Starters → Momos) | Must |
| C3 | Live search filters menu items instantly | Must |
| C4 | Items support customization: size, toppings (multi-select), spice level, each affecting price | Must |
| C5 | Cart supports quantity edits, removal, and running total incl. tax | Must |
| C6 | Coupon codes validate in real time (expiry, usage cap, minimum order) | Should |
| C7 | **Each cart item independently** is flagged Dine-in or Packing before checkout | Must |
| C8 | Checkout supports online payment (gateway) or Cash | Must |
| C9 | Order tracking view shows live, per-item status | Must |
| C10 | Customer is notified the instant any individual item is marked Ready | Must |
| C11 | Order history is retrievable via session/phone number on return visits | Should |
| C12 | Post-order, customer can rate & review; flow guides them to leave the same review on Google Maps | Should |
| C13 | UI supports language switching and a persisted dark mode preference | Should |

### 4.2 Kitchen (Chef) Panel
| # | Requirement | Priority |
|---|---|---|
| K1 | Chef accounts require Admin approval before first login | Must |
| K2 | New orders appear instantly with a sound alert | Must |
| K3 | Chef can accept/reject **individual items** within one order, not just the whole order | Must |
| K4 | Rejecting an item requires a reason, and notifies the customer for that item only | Must |
| K5 | Each item has its own status pipeline: Accepted → Preparing → Ready → Served | Must |
| K6 | Prep timer runs per item/order with a visual warning if overdue | Should |
| K7 | Orders can be filtered/sorted by table, time, or status | Should |
| K8 | Kitchen tickets (KOT) can be printed per accepted order | Should |
| K9 | Pending / In-Progress / Completed views are separated | Must |
| K10 | Low-stock alert appears when an item crosses its threshold; item auto-disables at zero stock | Should |

### 4.3 Admin / Owner / Cashier Panel
| # | Requirement | Priority |
|---|---|---|
| A1 | Dashboard shows today's revenue, order count, avg. prep time, top sellers | Must |
| A2 | Sales analytics filterable by date range, exportable | Should |
| A3 | Full CRUD on menu items, categories, and subcategories | Must |
| A4 | Table management with auto QR generation per table | Must |
| A5 | Staff management: approve/reject/deactivate chef and cashier accounts | Must |
| A6 | Coupon/discount builder | Should |
| A7 | Inventory management with configurable thresholds | Should |
| A8 | GST-compliant invoice generation, downloadable/printable | Must |
| A9 | Customer database with order history and repeat-visit tracking | Could |
| A10 | Refund processing with reason logging, tied to original payment method | Must |
| A11 | Exportable reports: sales, item performance, staff performance, refunds | Should |
| A12 | Restaurant settings: branding, GST number, hours, languages, tax rates | Must |

*(Priority key: Must = required for launch, Should = expected soon after, Could = nice-to-have/v2 candidate.)*

---

## Chain 5 — Data Model (summary)

Each order line item is the atomic unit for status, rejection, and fulfillment type — this single decision underpins C7, C9, K3–K5, and A9:

```
Restaurant → Table → QR Code
Restaurant → Category → Subcategory → MenuItem → Variant
Order → OrderItem (status, fulfillmentType, rejectionReason) → MenuItem + Variants
Staff (role, approvedByAdmin)
Coupon, InventoryLog, Review, Report/Invoice records
```
*(Full field-level schema lives in the companion Antigravity build prompt — keep both documents in sync if either changes.)*

---

## Chain 6 — Non-Functional Requirements & Constraints

- **Real-time sync:** cross-panel updates (new order, status change, rejection, low stock) must propagate in under ~1 second via WebSockets.
- **Security:** role-based auth for staff (JWT); customers remain unauthenticated, tied only to a QR-issued session; hashed credentials; HTTPS everywhere.
- **Compliance constraint:** Google does not permit silently auto-posting reviews on a user's behalf. The review flow must be "in-app rating → explicit customer action → prefilled Google review link," never a background auto-post.
- **Concurrency/reliability:** inventory decrements must be race-condition safe under simultaneous orders from multiple tables (e.g., last-item stock contention).
- **Availability:** the Customer menu should remain viewable (read-only, cached) even during brief backend interruptions.
- **Accessibility:** WCAG-reasonable contrast in both light/dark themes; readable type scale; alt text on menu images.
- **Data retention/privacy:** customer phone numbers (if collected for order history) must be stored securely and not shared with third parties beyond payment/review integrations.
- **Scalability:** architecture should handle a single restaurant's peak concurrent load (all tables ordering at once) without degrading real-time sync latency.

---

## Chain 7 — Success Metrics

| Metric | Baseline (pre-launch) | Target after launch |
|---|---|---|
| Avg. order placement time | Manual/staff-taken order time | Reduced vs. baseline (define baseline during pilot week) |
| Order error/rejection rate | N/A (new metric) | Trending down month over month as menu accuracy improves |
| Kitchen avg. prep-to-ready time | Current informal average | Meets or beats the restaurant's own target ticket time |
| Review submission rate | N/A | ≥ a defined % of completed orders (set after first month's data) |
| Google review conversion | N/A | ≥ a defined % of in-app ratings completing the redirect |
| Staff onboarding time | N/A | Chef approval same-day |

*(Numeric targets are intentionally left as "define after pilot" rather than invented — see Chain 9 for the decision needed before these can be finalized.)*

---

## Chain 8 — Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Customer confusion over per-item dine-in/packing split | Wrong fulfillment, kitchen rework | Clear UI grouping + confirmation step before checkout |
| Chef rejects items without adequate reason detail | Poor customer experience, disputes | Required reason field with short preset options + free text |
| Real-time sync failure under peak load | Orders stall, kitchen blind spots | Load-test WebSocket layer before launch; fallback polling if socket drops |
| Google policy changes around review redirects | Feature breaks or violates ToS | Keep redirect-only design (no auto-post) so it stays compliant by construction |
| Staff resistance to a new tablet-based workflow | Slow adoption, reverts to paper tickets | Kitchen UI prioritizes minimal taps; on-site training during rollout |

---

## Chain 9 — Rollout Plan / Milestones

1. **M1:** Core ordering loop — Customer places order → Kitchen sees & actions it per item → Customer sees live status. (No payments/analytics yet.)
2. **M2:** Payments (online + cash), coupons, order history, ratings/review flow.
3. **M3:** Admin dashboard — menu/category/table/staff CRUD, QR generation.
4. **M4:** Inventory management + low-stock automation, GST invoicing, refunds.
5. **M5:** Analytics/reports, multi-language, dark mode, PWA polish.

---

## Chain 10 — Decisions Needed Before Final Sign-off

These were open questions in the previous draft; each needs an explicit answer from the Owner/Admin before engineering treats them as final (recommended default noted where reasonable):

| # | Decision | Recommended default | Needs confirmation from |
|---|---|---|---|
| D1 | Payment gateway: Stripe, Razorpay, or both | Razorpay first (stronger UPI/India support), Stripe as v2 add-on | Owner |
| D2 | Order history keyed by phone number vs. session-only | Phone number (enables C11, A9) with clear consent at checkout | Owner |
| D3 | Which second language ships at launch | Match the restaurant's primary local language | Owner |
| D4 | Cashier permissions | View orders, process payments/refunds, print invoices — **no** menu or staff editing rights | Owner |

*Recommendation: resolve D1–D4 in a short kickoff call so Chain 4/6 requirements don't need revision mid-build.*
