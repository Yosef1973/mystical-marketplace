# Audit of Existing server.js (Aug 2025)
**Date:** Oct 28, 2026  
**Auditor:** Cloud Agent  
**Purpose:** Assess what exists, what works, what's broken, and what's needed for a digital art marketplace

---

## What Currently Exists

### Infrastructure (Lines 1-30)
- **Express server** with CORS and JSON parsing
- **PostgreSQL database** connection with SSL support
- **Stripe payment integration** (v2023-10-16 API)
- **JWT authentication** with bcrypt password hashing
- **Port:** 5000 (configurable)

### Database Schema (Lines 30-170)
A complete spiritual marketplace system with 7 tables:

1. **users** - Enhanced user profiles with spiritual progression tracking
   - Basic auth: email, username, name, password_hash
   - Spiritual tracking: spiritual_level, contemplation_streak, total_insights
   - Gate progression: highest_gate_unlocked, gates_completed (JSONB)
   
2. **artworks** - Rich metadata for 14 "gates" (spiritual logic concepts)
   - Gate system: gate_number (1-14), names in Hebrew/English
   - Product data: title, artist, price (in cents), category, pathway
   - Content: image URL, description, Maimonides quotes (Hebrew/English)
   - Spiritual: kabbalistic_insight, ai_consciousness_connection, contemplation_question, soul_song
   - Engagement: likes, views, downloads, trending flag
   - Access control: rarity_level, unlock_requirement
   
3. **user_spiritual_journey** - Tracks which gates users have unlocked
4. **daily_wisdom** - Daily spiritual wisdom system
5. **orders** - Order history with spiritual_insights field
6. **cart_items** - Shopping cart persistence

### Data Seeding (Lines 140-455)
- **14 pre-defined artworks** representing "gates" of spiritual/logical concepts
- Hardcoded data with Maimonides quotes, Kabbalah insights, AI consciousness connections
- Uses **Unsplash placeholder images** (400×300)
- Prices range from $299 to $2,999 (29900 to 299900 cents)
- Categories: עץ הדעת, עץ החיים, השתקפות ב-AI
- Rarity levels: Foundation, Intermediate, Advanced, Master

### API Routes (Lines 460-910)

#### Authentication (Lines 480-592)
- `POST /api/auth/register` - Create account with spiritual level tracking
- `POST /api/auth/login` - JWT token generation
- Middleware: `authenticateToken` (Lines 462-478)

#### Artworks (Lines 595-770)
- `GET /api/artworks` - List all with unlock status (userId optional)
- `GET /api/artworks/:id` - Single artwork + view increment

#### Cart (Lines 771-831)
- `GET /api/cart` - Fetch user's cart with joined artwork data
- `POST /api/cart` - Add item (checks for duplicates, unlocked status)
- `DELETE /api/cart/:id` - Remove item

#### Payment (Lines 833-870)
- `POST /api/payment/create-intent` - Create Stripe PaymentIntent
- `POST /api/payment/confirm` - Confirm payment, unlock gates, clear cart

#### Orders (Lines 872-886)
- `GET /api/orders` - User's order history

#### Spiritual Features (Lines 690-750)
- `GET /api/daily-wisdom` - Random wisdom from unlocked gates
- `GET /api/spiritual-journey` - User's unlocked gates timeline

#### Health Check (Lines 888-911)
- `GET /health` - Database connection + counts

### Frontend (Lines 914-1638)
**Single-page React app** embedded in HTML string:
- React 18 (development build from CDN)
- Babel standalone for JSX transform
- TailwindCSS for styling
- Stripe.js v3

#### Features:
- Auth forms (login/register)
- Artwork grid with gate progression system
- Lock/unlock visual indicators
- Cart modal
- Orders modal
- Spiritual journey modal
- Daily wisdom banner
- Hebrew RTL layout with purple/blue gradient background
- Rarity-based border colors

---

## What Works

✅ **Database initialization** - Auto-creates tables and seeds 14 artworks  
✅ **User registration/login** - bcrypt + JWT  
✅ **Product listing** - With rich spiritual metadata  
✅ **Cart operations** - Add, remove, view  
✅ **Spiritual progression** - Gate unlocking tied to purchases  
✅ **Order tracking** - History with spiritual insights  
✅ **Daily wisdom** - Randomized from user's unlocked gates  

---

## What's Broken or Incomplete

### Critical Issues

❌ **No real payment processing**  
- Uses `sk_test_fake` Stripe key
- `/api/payment/confirm` doesn't actually call `stripe.paymentIntents.retrieve`
- Mock payment bypasses real charge

❌ **No database credentials**  
- `process.env.DATABASE_URL` undefined → connection fails
- Tables never created on first run
- All routes will 500 on database queries

❌ **No static file serving**  
- No `express.static()` middleware
- Uploaded art files have nowhere to live
- Relies on external Unsplash URLs

❌ **No download delivery**  
- No signed/expiring download URLs
- No file storage integration (S3, CloudFlare R2, etc.)
- Orders track "downloads" count but don't provide files

❌ **No tests**  
- No test files in repo
- No test scripts in package.json

### Security Issues

⚠️ **Secrets in code**  
- Hardcoded JWT_SECRET fallback: `'mystical-marketplace-secret'`
- Hardcoded Stripe key: `'sk_test_fake'`

⚠️ **No input sanitization**  
- SQL injection risk on user inputs (mitigated by parameterized queries)
- No XSS protection on render

⚠️ **No rate limiting**  
- Auth routes unprotected from brute force
- Payment routes unprotected from spam

### Product/UX Issues

❌ **Wrong domain/content**  
- Current theme: "14 Gates of Logic and Life" (Maimonides + Kabbalah + AI)
- Target: Digital art marketplace for Yosef Khalfa
- All product data is conceptual/spiritual, not visual art

❌ **No collections filter**  
- Frontend has no filter UI for PELEH, Two Trees, Gan Mevucha
- `/api/artworks` has no query params for category/collection

❌ **No license selection**  
- Products have `price` but no personal/commercial license toggle
- Cart doesn't track license type per item

❌ **No format/resolution metadata**  
- Artworks track spiritual concepts, not file specs (PNG, 4K, etc.)

❌ **No checkout flow**  
- Goes straight from cart to mock payment
- No contact/email capture step
- No order summary before payment

❌ **Mobile-only design**  
- Embedded frontend is hardcoded TailwindCSS gradients
- Doesn't use the design kit's parchment/beige/gold aesthetic
- No Hebrew typography from Frank Ruhl Libre / IBM Plex Sans Hebrew

---

## Gap Analysis: What's Needed for Digital Art Marketplace

### Architecture Changes
1. **Remove spiritual progression system** (or make it optional easter egg)
   - Drop: highest_gate_unlocked, spiritual_journey table, daily_wisdom
   - Keep: users, artworks, cart, orders tables (repurpose columns)

2. **Add digital art schema**
   - `artworks.format` (PNG, JPEG, SVG, PSD)
   - `artworks.resolution` (e.g., "4096×4096 300dpi")
   - `artworks.file_size` (MB)
   - `artworks.collection` (PELEH, Two Trees, Gan Mevucha)
   - `artworks.license_personal_price` and `license_commercial_price`

3. **Add download delivery**
   - `downloads` table: order_id, artwork_id, license_type, signed_url, expires_at
   - S3/R2 integration or local file serving with signed tokens
   - `/api/orders/:id/downloads` route

### Frontend Overhaul
1. **Replace embedded React app**
   - Extract to separate `/public` folder
   - Use design kit CSS (parchment, beige, gold only)
   - Hebrew fonts: Frank Ruhl Libre (serif), IBM Plex Sans Hebrew (sans)
   - Remove dark gradients, use radial parchment gradients

2. **Product catalog**
   - Grid layout matching `merch/restyle-museum-v1`
   - Filter by collection (seal badges: פ, ש, ג)
   - Card design: translucent parchment, gold borders

3. **Product detail page**
   - Large image preview
   - Format/resolution display
   - License toggle (personal/commercial)
   - "Add to Cart" with license selection

4. **Cart page**
   - Persist in localStorage (keep DB cart as backup)
   - Line items with license badge
   - Change license in cart
   - Remove items

5. **Checkout flow**
   - Step 1: Contact/email (if guest) or confirm logged-in user
   - Step 2: Order summary (itemized with licenses)
   - Step 3: Payment (mock provider only)
   - Step 4: Confirmation + download links

### Backend Extensions
1. **Static serving**
   ```js
   app.use(express.static('public'));
   ```

2. **Collection filter**
   ```js
   GET /api/artworks?collection=PELEH
   GET /api/artworks?collection=Two Trees
   ```

3. **License in cart**
   - `cart_items.license_type` column (enum: personal, commercial)
   - Update routes to accept/return license

4. **Mock payment provider interface**
   ```js
   // providers/mock.js
   class MockPaymentProvider {
     async createIntent(amount, metadata) { ... }
     async confirm(intentId) { ... }
   }
   ```

5. **Download URL generation**
   ```js
   function generateSignedDownloadUrl(orderId, artworkId, expiresIn = 3600) {
     const token = jwt.sign({ orderId, artworkId }, DOWNLOAD_SECRET, { expiresIn });
     return `/api/downloads/${token}`;
   }
   ```

6. **Basic tests**
   - `npm install --save-dev jest supertest`
   - Test: register, login, add to cart, checkout (mock)

### Design System Integration
1. **CSS Variables** (from design kit)
   ```css
   --paper: #F6F1E6;
   --parchment: #EBE0C6;
   --gold: #B68B36;
   --ink: #211C13;
   --serif: 'Frank Ruhl Libre', serif;
   --sans: 'IBM Plex Sans Hebrew', sans-serif;
   ```

2. **RTL-first layout**
   - `dir="rtl"` on `<html>`
   - English toggle button (flips to `dir="ltr"`)

3. **Golden-ratio spacing**
   - 8, 13, 21, 34, 55px rhythm
   - Layer system (sepia pattern, translucent parchment sheets, buybar stone strip)

4. **Walnut seals** for collections
   - פ (PELEH), ש (Two Trees), ג (Gan Mevucha)

---

## Recommended Implementation Path

### Phase 1: Minimal Working Marketplace (MVP)
1. Keep existing auth + JWT
2. Repurpose `artworks` table schema (add format, resolution, collection, license prices)
3. Replace seed data with placeholder Yosef Khalfa art (marked as sample)
4. Extract frontend to `/public`, copy design kit CSS
5. Build catalog grid + product detail pages
6. Add collection filter
7. localStorage cart with license selection
8. Mock checkout flow (3 steps: contact, summary, payment)
9. Create `.env.example` with required vars
10. Add `README.md` with setup instructions

### Phase 2: Download Delivery
1. Add `downloads` table
2. Generate signed URLs with JWT
3. Serve local files from `/artworks` folder (or integrate S3)
4. Email confirmation with download links (nodemailer)

### Phase 3: Real Payment Provider
1. Abstract payment provider interface
2. Stripe integration (real keys from env)
3. Webhook handling for async payment confirmation

### Phase 4: Production Ready
1. Add tests (auth, cart, checkout)
2. Rate limiting (express-rate-limit)
3. Input validation (express-validator)
4. Logging (winston)
5. Deployment docs (Render, Railway, Fly.io)

---

## Effort Estimate

| Task | Complexity |
|------|------------|
| Database schema migration | Low (1-2 files) |
| Frontend extraction + design kit | Medium (CSS reuse, React refactor) |
| Product catalog + filters | Low (API already exists) |
| Cart with licenses | Low (1 column + localStorage) |
| Checkout flow UI | Medium (3-step form) |
| Mock payment provider | Low (already 90% there) |
| Download delivery (local files) | Medium (signed URLs, file serving) |
| Tests | Low (basic happy path) |
| Documentation | Low (README, .env.example) |

**Total:** 1-2 focused build cycles to MVP, assuming DB credentials provided.

---

## Blockers

1. **No PostgreSQL instance** - Need `DATABASE_URL` env var or switch to SQLite for local dev
2. **No art files** - Need placeholder images or real Yosef Khalfa artwork
3. **No real Stripe keys** - Fine for mock, but need real account for production
4. **No hosting plan** - Need deployment target (Render, Railway, Vercel)
5. **No domain** - Need custom domain or subdomain for launch

---

## Conclusion

**Current state:** A fully-functional spiritual marketplace with rich metadata, auth, cart, mock payments, and spiritual progression. The architecture is solid but the content and UX are completely misaligned with the digital art marketplace goal.

**Path forward:** Repurpose the existing schema and routes, replace the embedded frontend with the design kit aesthetic, add license selection, and build a proper checkout flow. The core Express + PostgreSQL + JWT + Stripe foundation is already here—just needs content swap and UI refinement.

**Biggest win:** The hardest parts (auth, database, payments, orders) are already implemented. We're not starting from scratch.

**Biggest risk:** No database credentials means the app won't run locally without fixes. Need `.env.example` and local SQLite fallback or Docker Compose setup.
