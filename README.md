# Digital Art Marketplace · Yosef Khalfa

A marketplace for digital art featuring three collections: PELEH, Two Trees in the Heart (שני עצים בלב), and Gan Mevucha (גן המבוכה).

## Features

### Built
- ✅ Product catalog with grid layout
- ✅ Collection filtering (PELEH, Two Trees, Gan Mevucha)
- ✅ Product detail pages with format/resolution display
- ✅ License selection (personal/commercial) with pricing
- ✅ Shopping cart persisted in localStorage + database
- ✅ Checkout flow: contact → summary → mock payment
- ✅ User authentication (JWT + bcrypt)
- ✅ RTL-first design with Hebrew typography
- ✅ Parchment/beige/gold design system (from design kit)
- ✅ Golden-ratio layout and spacing
- ✅ Mobile-first responsive design
- ✅ Express API with PostgreSQL
- ✅ Mock payment provider (no real charges)

### What's Left
- ⏳ Real payment provider integration (Stripe with real keys)
- ⏳ Real art files and signed download URLs
- ⏳ File storage (S3/R2) integration
- ⏳ Email confirmation system
- ⏳ Tests (unit + integration)
- ⏳ Hosting & deployment
- ⏳ Custom domain
- ⏳ Legal pages (Terms, Privacy, Refund Policy)
- ⏳ Admin panel for managing products
- ⏳ Order history with actual download links

## Setup

### Prerequisites
- Node.js 18+
- PostgreSQL database

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd <repo-name>
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your database credentials and secrets
```

4. Start the server:
```bash
npm start
```

The server will run on `http://localhost:5000`.

### Database

The app will automatically create tables and seed sample data on first run. Make sure your `DATABASE_URL` is correctly configured in `.env`.

## Structure

```
/
├── server.js           # Express API server (extended from original)
├── package.json        # Dependencies
├── .env.example        # Environment template
├── AUDIT.md           # Technical audit of original code
├── public/            # Static frontend files
│   ├── index.html     # Home/gallery page
│   ├── product.html   # Product detail page
│   ├── cart.html      # Shopping cart
│   ├── checkout.html  # Checkout flow
│   ├── style.css      # Design kit styles
│   ├── js/
│   │   └── app.js     # Main application JS
│   └── museum/        # Design assets (seals, patterns, etc.)
```

## Collections

### פלא (PELEH)
The flagship collection exploring wonder and revelation through digital art.

### שני עצים בלב (Two Trees in the Heart)
Artworks inspired by the duality of knowledge and life, inner conflict and harmony.

### גן המבוכה (Gan Mevucha)
A labyrinthine garden collection of meditative and introspective pieces.

## License Types

- **Personal License**: For personal, non-commercial use
- **Commercial License**: Full commercial rights (3x personal price)

## Design System

Based on the PELEH museum shop design kit:
- **Palette**: Parchment (#EBE0C6), beige, gold (#B68B36) — NO dark surfaces
- **Fonts**: Frank Ruhl Libre (serif), IBM Plex Sans Hebrew (sans)
- **Layout**: Golden-ratio rhythm (8, 13, 21, 34, 55px)
- **Layers**: Sepia pattern, translucent parchment sheets, raised stone strips
- **Seals**: Walnut medallions for collection badges (פ, ש, ג)
- **Direction**: RTL-first with English toggle option

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create account
- `POST /api/auth/login` - Login

### Products
- `GET /api/artworks` - List all artworks (optional: `?collection=...`)
- `GET /api/artworks/:id` - Get single artwork

### Cart
- `GET /api/cart` - Get user's cart
- `POST /api/cart` - Add item with license type
- `PATCH /api/cart/:id/license` - Update license
- `DELETE /api/cart/:id` - Remove item

### Orders (original spiritual features still available)
- `GET /api/orders` - Order history
- `POST /api/payment/create-intent` - Create payment
- `POST /api/payment/confirm` - Confirm payment (mock)

### Spiritual Features (legacy from original Aug 2025 code)
- `GET /api/daily-wisdom` - Daily wisdom
- `GET /api/spiritual-journey` - User's unlocked gates

## Sample Data

All products and prices are marked as samples. Images are placeholders from Unsplash. For production:
1. Replace seed data in `server.js` (lines 140-455) with real Yosef Khalfa artwork
2. Upload actual art files to storage
3. Update prices, descriptions, and metadata
4. Add real format/resolution specifications

## Payment

Current setup uses a **mock payment provider** for demonstration. No real charges occur. To integrate real payments:

1. Uncomment Stripe integration in `server.js`
2. Add your Stripe keys to `.env`
3. Implement webhook handling for async payment confirmation
4. Test with Stripe test cards before going live

## Notes

- The original spiritual marketplace system (14 Gates of Logic) is preserved but not exposed in the new UI
- Database schema was extended, not replaced
- Existing routes were kept and enhanced with new features
- Design follows the museum shop aesthetic exactly
- All text is RTL Hebrew with English translations

## Support

For questions or issues, contact Yosef Khalfa.

---

**Built incrementally on top of the existing Aug 2025 codebase.**
