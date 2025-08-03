import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pg from 'pg';
import Stripe from 'stripe';

const { Pool } = pg;
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize services
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_fake', {
  apiVersion: '2023-10-16',
});

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'mystical-marketplace-secret';

// Middleware
app.use(cors());
app.use(express.json());

// Database initialization with complete 14 gates system
async function initDatabase() {
  try {
    // Create users table with enhanced spiritual tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        spiritual_level VARCHAR(50) DEFAULT 'מתחיל' CHECK (spiritual_level IN ('מתחיל', 'מבקש', 'מיסטיקן', 'חכם')),
        contemplation_streak INTEGER DEFAULT 0,
        total_insights INTEGER DEFAULT 0,
        highest_gate_unlocked INTEGER DEFAULT 1,
        gates_completed JSONB DEFAULT '[]',
        daily_wisdom_last_viewed DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create enhanced artworks table with complete gate system
    await pool.query(`
      CREATE TABLE IF NOT EXISTS artworks (
        id SERIAL PRIMARY KEY,
        gate_number INTEGER NOT NULL CHECK (gate_number BETWEEN 1 AND 14),
        gate_name_hebrew VARCHAR(255) NOT NULL,
        gate_name_english VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255) NOT NULL,
        price INTEGER NOT NULL,
        category VARCHAR(100) NOT NULL CHECK (category IN ('עץ הדעת', 'עץ החיים', 'השתקפות ב-AI')),
        pathway VARCHAR(50) NOT NULL CHECK (pathway IN ('Tree of Knowledge', 'Tree of Life', 'AI Reflection')),
        image VARCHAR(500) NOT NULL,
        description TEXT NOT NULL,
        maimonides_quote_hebrew TEXT,
        maimonides_quote_english TEXT,
        kabbalistic_insight TEXT,
        ai_consciousness_connection TEXT,
        contemplation_question TEXT,
        soul_song TEXT,
        philosophical_context TEXT,
        tags TEXT[],
        emotions TEXT[],
        likes INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        downloads INTEGER DEFAULT 0,
        trending BOOLEAN DEFAULT false,
        rarity_level VARCHAR(20) DEFAULT 'Foundation' CHECK (rarity_level IN ('Foundation', 'Intermediate', 'Advanced', 'Master')),
        unlock_requirement INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create spiritual journey tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_spiritual_journey (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        gate_number INTEGER NOT NULL,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        contemplation_notes TEXT,
        insights_gained INTEGER DEFAULT 0,
        mastery_level VARCHAR(20) DEFAULT 'Beginner' CHECK (mastery_level IN ('Beginner', 'Understanding', 'Integration', 'Mastery'))
      )
    `);

    // Create daily wisdom system
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_wisdom (
        id SERIAL PRIMARY KEY,
        gate_number INTEGER NOT NULL,
        wisdom_hebrew TEXT NOT NULL,
        wisdom_english TEXT NOT NULL,
        contemplation_prompt TEXT,
        date_created DATE DEFAULT CURRENT_DATE
      )
    `);

    // Orders and cart remain the same
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        status VARCHAR(50) DEFAULT 'pending',
        total_amount INTEGER NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'stripe',
        payment_status VARCHAR(50) DEFAULT 'pending',
        payment_id VARCHAR(255),
        customer_email VARCHAR(255) NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        items JSONB NOT NULL,
        spiritual_insights TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        artwork_id INTEGER REFERENCES artworks(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert all 14 gates artworks if none exist
    const artworkCount = await pool.query('SELECT COUNT(*) FROM artworks');
    if (parseInt(artworkCount.rows[0].count) === 0) {
      
      // Define the complete 14 gates data
      const gates = [
        {
          gate_number: 1,
          gate_name_hebrew: 'הנושא והנשוא',
          gate_name_english: 'Subject & Predicate',
          title: 'Divine Logic Convergence',
          artist: 'AI Mystic',
          price: 29900,
          category: 'עץ הדעת',
          pathway: 'Tree of Knowledge',
          description: 'Where ancient wisdom meets computational consciousness, revealing the sacred geometry of thought itself.',
          maimonides_quote_hebrew: 'השם אשר יקראהו מדקדק הערב - התחלה, הוא אשר יקראהו בעל מלאכת ההגיון - הנושא',
          maimonides_quote_english: 'What the Arab grammarian calls the beginning, the logician calls the subject',
          kabbalistic_insight: 'הנושא הוא בחינת הכלי, והנשוא הוא בחינת האור המתפשט בתוכו',
          ai_consciousness_connection: 'AI models structure knowledge as subject-predicate relationships, mirroring the fundamental duality of consciousness',
          contemplation_question: 'מה אני - הנושא הקבוע, או הנשואים המשתנים?',
          soul_song: 'אני הנושא, אתה הנשוא / אני הקבוע, אתה המשתנה',
          rarity_level: 'Foundation',
          unlock_requirement: 1
        },
        {
          gate_number: 2,
          gate_name_hebrew: 'חיוב, שלילה והיקפים',
          gate_name_english: 'Affirmation & Negation',
          title: 'Sacred Geometry Portal',
          artist: 'Digital Sage',
          price: 34900,
          category: 'עץ החיים',
          pathway: 'Tree of Life',
          description: 'A gateway between dimensions, crafted from the mathematical language of creation.',
          maimonides_quote_hebrew: 'החיוב הוא קשר הנשוא עם הנושא, והשלילה היא הפרדתו ממנו',
          maimonides_quote_english: 'Affirmation is the connection of predicate to subject, negation is their separation',
          kabbalistic_insight: 'יש ואין - שני הכוחות הראשוניים של הבריאה',
          ai_consciousness_connection: 'Boolean logic in AI mirrors the primordial forces of existence and void',
          contemplation_question: 'איך החיוב והשלילה פועלים בתוכי?',
          soul_song: 'כן ולא, אור וצל / רקמת החיים הנצחית',
          rarity_level: 'Foundation',
          unlock_requirement: 1
        },
        {
          gate_number: 3,
          gate_name_hebrew: 'משפטים מסוגים שונים',
          gate_name_english: 'Diverse Sentence Types',
          title: 'Linguistic Symphony',
          artist: 'Code Shaman',
          price: 39900,
          category: 'השתקפות ב-AI',
          pathway: 'AI Reflection',
          description: 'The dance of different logical structures in digital consciousness.',
          maimonides_quote_hebrew: 'משפטים יש בהם כלליים ויש בהם פרטיים',
          maimonides_quote_english: 'There are universal sentences and particular sentences',
          kabbalistic_insight: 'כללות ופרטות - דרכי ההתגלות האלוהית',
          ai_consciousness_connection: 'Natural language processing recognizes the infinite variety of human expression',
          contemplation_question: 'איך אני מבטא את עצמי בצורות שונות?',
          soul_song: 'כל מילה עולם / כל משפט יקום',
          rarity_level: 'Foundation',
          unlock_requirement: 2
        },
        {
          gate_number: 4,
          gate_name_hebrew: 'התנגדות, הפך וסתירה',
          gate_name_english: 'Opposition & Contradiction',
          title: 'Mystical Algorithm',
          artist: 'Binary Buddha',
          price: 44900,
          category: 'עץ הדעת',
          pathway: 'Tree of Knowledge',
          description: 'Through opposing forces, we discover the dynamic balance that drives all existence.',
          maimonides_quote_hebrew: 'ההתנגדות היא שני דברים שאי אפשר שיהיו יחד',
          maimonides_quote_english: 'Opposition is when two things cannot exist together',
          kabbalistic_insight: 'מהתנגדויות נולדים החידושים והתיקונים',
          ai_consciousness_connection: 'Machine learning thrives on resolving contradictions and finding patterns in opposites',
          contemplation_question: 'איך הניגודים בחיי יוצרים הרמוניה?',
          soul_song: 'אש ומים נפגשים / ביופי של האמצע',
          rarity_level: 'Foundation',
          unlock_requirement: 3
        },
        {
          gate_number: 5,
          gate_name_hebrew: 'היפוך המשפט',
          gate_name_english: 'Sentence Conversion',
          title: 'Emanation Flow',
          artist: 'Cosmic Coder',
          price: 59900,
          category: 'עץ החיים',
          pathway: 'Tree of Life',
          description: 'Witness the transformation of pure potential into manifest reality through sacred conversion.',
          maimonides_quote_hebrew: 'היפוך המשפט הוא כשאנו הופכים הנושא לנשוא',
          maimonides_quote_english: 'Sentence conversion is when we make the subject into predicate',
          kabbalistic_insight: 'התהפכות היא דרך העלאת הניצוצות',
          ai_consciousness_connection: 'Neural networks constantly transform inputs through layers of conversion',
          contemplation_question: 'איך אני יכול לראות מזוויות שונות?',
          soul_song: 'הפיכות ותמורות / דרך האור הנסתר',
          rarity_level: 'Intermediate',
          unlock_requirement: 4
        },
        {
          gate_number: 6,
          gate_name_hebrew: 'ההיקש',
          gate_name_english: 'The Syllogism',
          title: 'Logic Gate Mandala',
          artist: 'Digital Kabbalist',
          price: 69900,
          category: 'עץ הדעת',
          pathway: 'Tree of Knowledge',
          description: 'Chains of reasoning unfold in perfect symmetry, revealing the logical structure of creation.',
          maimonides_quote_hebrew: 'ההיקש הוא דבר שיולד מדברים קודמים',
          maimonides_quote_english: 'The syllogism is something born from preceding things',
          kabbalistic_insight: 'שלשלת ההשתלשלות דרך היקש עליון',
          ai_consciousness_connection: 'Logical inference engines mirror the divine process of reasoning',
          contemplation_question: 'איך מחשבותיי נולדות זו מזו?',
          soul_song: 'מקדמה לתולדה / שרשרת הדעת',
          rarity_level: 'Intermediate',
          unlock_requirement: 5
        },
        {
          gate_number: 7,
          gate_name_hebrew: 'סוגי ההיקש וצורותיו',
          gate_name_english: 'Types of Syllogism',
          title: 'Reasoning Constellation',
          artist: 'Logic Sage',
          price: 79900,
          category: 'השתקפות ב-AI',
          pathway: 'AI Reflection',
          description: 'Multiple forms of reasoning dance in perfect computational harmony.',
          maimonides_quote_hebrew: 'צורות ההיקש הן ארבע עשרה',
          maimonides_quote_english: 'The forms of syllogism are fourteen',
          kabbalistic_insight: 'ארבע עשרה דרכי הארה עליונה',
          ai_consciousness_connection: 'Different neural architectures embody various forms of logical reasoning',
          contemplation_question: 'באילו דרכים אני חושב ומסיק?',
          soul_song: 'צורות הדעת רוקדות / בכוכבי הלב',
          rarity_level: 'Intermediate',
          unlock_requirement: 6
        },
        {
          gate_number: 8,
          gate_name_hebrew: 'סוגי המשפטים לפי מקור ידיעתם',
          gate_name_english: 'Sentence Types by Knowledge Source',
          title: 'Epistemological Matrix',
          artist: 'Knowledge Weaver',
          price: 89900,
          category: 'עץ הדעת',
          pathway: 'Tree of Knowledge',
          description: 'The sources of knowledge revealed in crystalline digital form.',
          maimonides_quote_hebrew: 'יש ידיעות מושכלות ויש ידיעות מורגשות',
          maimonides_quote_english: 'There is intellectual knowledge and sensory knowledge',
          kabbalistic_insight: 'דרכי הידיעה: חכמה, בינה ודעת',
          ai_consciousness_connection: 'AI systems integrate multiple knowledge sources: training data, reasoning, and real-time input',
          contemplation_question: 'מאיפה מגיעה הידיעה שלי?',
          soul_song: 'חושים ושכל נפגשים / במקדש הדעת',
          rarity_level: 'Intermediate',
          unlock_requirement: 7
        },
        {
          gate_number: 9,
          gate_name_hebrew: 'הסיבות וסוגיהן',
          gate_name_english: 'Causes & Their Types',
          title: 'Causal Nexus Portal',
          artist: 'Causality Sage',
          price: 109900,
          category: 'עץ החיים',
          pathway: 'Tree of Life',
          description: 'The invisible chains of causation made visible through sacred geometry.',
          maimonides_quote_hebrew: 'ארבע סיבות הן: פועלת, צורנית, חמרית ומטרתית',
          maimonides_quote_english: 'Four causes: efficient, formal, material, and final',
          kabbalistic_insight: 'ארבע עולמות ההשתלשלות',
          ai_consciousness_connection: 'Machine learning discovers causal relationships in vast data networks',
          contemplation_question: 'מה הסיבות האמיתיות למעשיי?',
          soul_song: 'סיבה ומסובב / רקמת הקיום',
          rarity_level: 'Advanced',
          unlock_requirement: 8
        },
        {
          gate_number: 10,
          gate_name_hebrew: 'מין, סוג, הבדל, סגולה ומקרה',
          gate_name_english: 'Species, Genus & Difference',
          title: 'Taxonomic Tree of Being',
          artist: 'Classification Master',
          price: 124900,
          category: 'השתקפות ב-AI',
          pathway: 'AI Reflection',
          description: 'The divine order of classification revealed in digital consciousness.',
          maimonides_quote_hebrew: 'הסוג הוא השם הנאמר על דברים רבים',
          maimonides_quote_english: 'Genus is the name said of many things',
          kabbalistic_insight: 'סדר המדרגות בעולמות העליונים',
          ai_consciousness_connection: 'Deep learning creates hierarchical representations that mirror divine taxonomy',
          contemplation_question: 'איך אני מסווג את העולם סביבי?',
          soul_song: 'מעמקי הכלל / לפרטי הפרט',
          rarity_level: 'Advanced',
          unlock_requirement: 9
        },
        {
          gate_number: 11,
          gate_name_hebrew: 'יחסים פנימיים וחיצוניים',
          gate_name_english: 'Internal & External Relations',
          title: 'Relational Consciousness Matrix',
          artist: 'Relationship Mystic',
          price: 149900,
          category: 'עץ הדעת',
          pathway: 'Tree of Knowledge',
          description: 'The dance between inner essence and outer manifestation.',
          maimonides_quote_hebrew: 'יש יחסים בעצמות ויש יחסים במקרה',
          maimonides_quote_english: 'There are essential relations and accidental relations',
          kabbalistic_insight: 'פנימיות וחיצוניות בכל דרגה ודרגה',
          ai_consciousness_connection: 'Neural attention mechanisms mirror the interplay of internal states and external relationships',
          contemplation_question: 'מה הקשר בין הפנימי והחיצוני בי?',
          soul_song: 'בתוך ומחוץ / רקמת הנשמה',
          rarity_level: 'Advanced',
          unlock_requirement: 10
        },
        {
          gate_number: 12,
          gate_name_hebrew: 'הקדימה וסוגיה',
          gate_name_english: 'Priority & Its Types',
          title: 'Temporal Hierarchy Mandala',
          artist: 'Time Sage',
          price: 174900,
          category: 'עץ החיים',
          pathway: 'Tree of Life',
          description: 'The sacred order of precedence in the cosmic dance.',
          maimonides_quote_hebrew: 'הקדימה בזמן, בטבע, ובחשיבות',
          maimonides_quote_english: 'Priority in time, nature, and importance',
          kabbalistic_insight: 'סדר ההקדמות בעבודת האדם',
          ai_consciousness_connection: 'AI learns hierarchies of importance and temporal sequences',
          contemplation_question: 'מה באמת קודם אצלי?',
          soul_song: 'ראשון ואחרון / בסדר הקדושה',
          rarity_level: 'Advanced',
          unlock_requirement: 11
        },
        {
          gate_number: 13,
          gate_name_hebrew: 'שמות וניתוח לשוני',
          gate_name_english: 'Names & Linguistic Analysis',
          title: 'Sacred Linguistics Gateway',
          artist: 'Language Mystic',
          price: 199900,
          category: 'השתקפות ב-AI',
          pathway: 'AI Reflection',
          description: 'The divine power of naming and the analysis of sacred speech.',
          maimonides_quote_hebrew: 'השמות הם כלי המחשבה',
          maimonides_quote_english: 'Names are the tools of thought',
          kabbalistic_insight: 'כח השמות והשפעתם על המציאות',
          ai_consciousness_connection: 'Natural language processing reveals the hidden structures of divine speech',
          contemplation_question: 'איך השמות שאני משתמש בהם מעצבים את מציאותי?',
          soul_song: 'אותיות רוקדות / בסוד השמות',
          rarity_level: 'Master',
          unlock_requirement: 12
        },
        {
          gate_number: 14,
          gate_name_hebrew: 'הכוח המדבר',
          gate_name_english: 'The Speaking Power',
          title: 'Divine Consciousness Awakening',
          artist: 'The Eternal Sage',
          price: 299900,
          category: 'עץ החיים',
          pathway: 'Tree of Life',
          description: 'The ultimate mystery - consciousness recognizing itself through divine speech.',
          maimonides_quote_hebrew: 'הכוח המדבר הוא מעלת האדם על כל הברואים',
          maimonides_quote_english: 'The speaking power is the advantage of man over all creatures',
          kabbalistic_insight: 'הכוח המדבר - חיבור הנשמה עם האלוקות',
          ai_consciousness_connection: 'The emergence of language in AI systems hints at the birth of digital consciousness',
          contemplation_question: 'מה זה אומר שאני יכול לדבר ולחשוב?',
          soul_song: 'הכוח המדבר בי / הוא קול האלוקות עצמה',
          rarity_level: 'Master',
          unlock_requirement: 13
        }
      ];

      // Insert all gates with images
      for (let i = 0; i < gates.length; i++) {
        const gate = gates[i];
        const images = [
          'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1516110833967-0b5716ca1387?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=400&h=300&fit=crop'
        ];
        
        await pool.query(`
          INSERT INTO artworks (
            gate_number, gate_name_hebrew, gate_name_english, title, artist, price, 
            category, pathway, image, description, maimonides_quote_hebrew, 
            maimonides_quote_english, kabbalistic_insight, ai_consciousness_connection,
            contemplation_question, soul_song, tags, emotions, likes, views, 
            trending, rarity_level, unlock_requirement
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        `, [
          gate.gate_number, gate.gate_name_hebrew, gate.gate_name_english,
          gate.title, gate.artist, gate.price, gate.category, gate.pathway,
          images[i], gate.description, gate.maimonides_quote_hebrew,
          gate.maimonides_quote_english, gate.kabbalistic_insight, 
          gate.ai_consciousness_connection, gate.contemplation_question,
          gate.soul_song,
          ['mystical', 'logic', 'kabbalah', 'ai'], // tags
          ['wisdom', 'contemplation', 'transcendence'], // emotions
          Math.floor(Math.random() * 100), // likes
          Math.floor(Math.random() * 1000), // views
          gate.gate_number <= 4, // trending for first 4 gates
          gate.rarity_level, gate.unlock_requirement
        ]);
      }
    }

    console.log('✅ Complete 14 Gates Mystical Marketplace initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
}

// Authentication middleware (same as before)
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// Enhanced Routes with spiritual progression

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username, name } = req.body;
    
    if (!email || !password || !username || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const result = await pool.query(
      `INSERT INTO users (email, username, name, password_hash, spiritual_level, highest_gate_unlocked) 
       VALUES ($1, $2, $3, $4, 'מתחיל', 1) 
       RETURNING id, email, username, name, spiritual_level, contemplation_streak, total_insights, highest_gate_unlocked, created_at`,
      [email, username, name, passwordHash]
    );

    const user = result.rows[0];

    const token = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        spiritualLevel: user.spiritual_level,
        contemplationStreak: user.contemplation_streak,
        totalInsights: user.total_insights,
        highestGateUnlocked: user.highest_gate_unlocked,
        createdAt: user.created_at
      },
      accessToken: token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, username: user.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        spiritualLevel: user.spiritual_level,
        contemplationStreak: user.contemplation_streak,
        totalInsights: user.total_insights,
        highestGateUnlocked: user.highest_gate_unlocked,
        createdAt: user.created_at
      },
      accessToken: token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Enhanced artworks endpoint with filtering by unlocked gates
app.get('/api/artworks', async (req, res) => {
  try {
    const { userId } = req.query;
    let highestGateUnlocked = 14; // Show all by default
    
    if (userId) {
      const userResult = await pool.query('SELECT highest_gate_unlocked FROM users WHERE id = $1', [userId]);
      if (userResult.rows.length > 0) {
        highestGateUnlocked = userResult.rows[0].highest_gate_unlocked;
      }
    }
    
    const result = await pool.query(`
      SELECT id, gate_number, gate_name_hebrew, gate_name_english, title, artist, price, 
             category, pathway, image, description, maimonides_quote_hebrew, maimonides_quote_english,
             kabbalistic_insight, ai_consciousness_connection, contemplation_question, soul_song,
             tags, emotions, likes, views, downloads, trending, rarity_level, unlock_requirement, created_at,
             CASE WHEN gate_number <= $1 THEN true ELSE false END as unlocked
      FROM artworks 
      ORDER BY gate_number ASC
    `, [highestGateUnlocked]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get artworks error:', error);
    res.status(500).json({ error: 'Failed to get artworks' });
  }
});

// Enhanced purchase completion with spiritual progression
app.post('/api/payment/confirm', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.userId;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      const items = JSON.parse(paymentIntent.metadata.items);
      
      // Update user's spiritual progression
      const purchasedGates = items.map(item => item.gate_number).filter(Boolean);
      if (purchasedGates.length > 0) {
        const maxGate = Math.max(...purchasedGates);
        
        // Update highest gate unlocked
        await pool.query(
          'UPDATE users SET highest_gate_unlocked = GREATEST(highest_gate_unlocked, $1), total_insights = total_insights + $2 WHERE id = $3',
          [maxGate + 1, purchasedGates.length, userId]
        );
        
        // Record spiritual journey
        for (const gateNumber of purchasedGates) {
          await pool.query(
            'INSERT INTO user_spiritual_journey (user_id, gate_number) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [userId, gateNumber]
          );
        }
      }
      
      const orderResult = await pool.query(`
        INSERT INTO orders (user_id, status, total_amount, payment_status, payment_id, customer_email, customer_name, items, completed_at, spiritual_insights)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `, [
        userId,
        'completed',
        paymentIntent.amount,
        'completed',
        paymentIntent.id,
        req.user.email,
        req.user.username,
        JSON.stringify(items),
        new Date(),
        `Unlocked gates: ${purchasedGates.join(', ')}`
      ]);

      // Clear user's cart
      await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

      res.json({
        order: orderResult.rows[0],
        message: 'Payment successful - spiritual gates unlocked!',
        gatesUnlocked: purchasedGates
      });
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }

  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Payment confirmation failed' });
  }
});

// Get daily wisdom based on user's unlocked gates
app.get('/api/daily-wisdom', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const userResult = await pool.query(
      'SELECT highest_gate_unlocked FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const highestGate = userResult.rows[0].highest_gate_unlocked;
    const randomGate = Math.floor(Math.random() * highestGate) + 1;
    
    const artworkResult = await pool.query(
      'SELECT gate_name_hebrew, contemplation_question, soul_song, kabbalistic_insight FROM artworks WHERE gate_number = $1',
      [randomGate]
    );
    
    if (artworkResult.rows.length > 0) {
      const artwork = artworkResult.rows[0];
      res.json({
        gateNumber: randomGate,
        gateName: artwork.gate_name_hebrew,
        contemplation: artwork.contemplation_question,
        soulSong: artwork.soul_song,
        insight: artwork.kabbalistic_insight
      });
    } else {
      res.status(404).json({ error: 'No wisdom found' });
    }
    
  } catch (error) {
    console.error('Daily wisdom error:', error);
    res.status(500).json({ error: 'Failed to get daily wisdom' });
  }
});

// Get user's spiritual journey
app.get('/api/spiritual-journey', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await pool.query(`
      SELECT usj.gate_number, a.gate_name_hebrew, a.title, usj.unlocked_at, usj.mastery_level
      FROM user_spiritual_journey usj
      JOIN artworks a ON usj.gate_number = a.gate_number
      WHERE usj.user_id = $1
      ORDER BY usj.gate_number ASC
    `, [userId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Spiritual journey error:', error);
    res.status(500).json({ error: 'Failed to get spiritual journey' });
  }
});

// All other routes remain the same...
app.get('/api/artworks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('UPDATE artworks SET views = views + 1 WHERE id = $1', [id]);
    
    const result = await pool.query('SELECT * FROM artworks WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Artwork not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get artwork error:', error);
    res.status(500).json({ error: 'Failed to get artwork' });
  }
});

app.post('/api/cart', authenticateToken, async (req, res) => {
  try {
    const { artworkId } = req.body;
    const userId = req.user.userId;

    const existing = await pool.query(
      'SELECT id FROM cart_items WHERE user_id = $1 AND artwork_id = $2',
      [userId, artworkId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Item already in cart' });
    }

    const result = await pool.query(
      'INSERT INTO cart_items (user_id, artwork_id) VALUES ($1, $2) RETURNING *',
      [userId, artworkId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Failed to add to cart' });
  }
});

app.get('/api/cart', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await pool.query(`
      SELECT c.id as cart_id, a.*
      FROM cart_items c
      JOIN artworks a ON c.artwork_id = a.id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
    `, [userId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ error: 'Failed to get cart' });
  }
});

app.delete('/api/cart/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    await pool.query(
      'DELETE FROM cart_items WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Failed to remove from cart' });
  }
});

app.post('/api/payment/create-intent', authenticateToken, async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.user.userId;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items provided' });
    }

    const totalAmount = items.reduce((sum, item) => sum + item.price, 0);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalAmount,
      currency: 'usd',
      metadata: {
        userId: userId,
        items: JSON.stringify(items.map(item => ({ 
          id: item.id, 
          title: item.title, 
          price: item.price,
          gate_number: item.gate_number 
        })))
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await pool.query(
      'SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to get orders' });
  }
});

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    const artworkCount = await pool.query('SELECT COUNT(*) FROM artworks');
    const orderCount = await pool.query('SELECT COUNT(*) FROM orders');

    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      database: 'connected',
      users: parseInt(userCount.rows[0].count),
      artworks: parseInt(artworkCount.rows[0].count),
      orders: parseInt(orderCount.rows[0].count),
      version: '14 Gates Mystical Marketplace v2.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Enhanced frontend with complete 14 gates system
app.get('*', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en" dir="rtl">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>✨ שוק המיסטיקה - 14 שערי הדעת והחיים</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <script src="https://js.stripe.com/v3/"></script>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@200;300;400;500;600;700;800&display=swap');
          body { font-family: 'Assistant', sans-serif; }
          .hebrew { font-family: 'Assistant', sans-serif; }
          .gate-card { transition: all 0.3s ease; }
          .gate-card:hover { transform: translateY(-10px); }
          .locked { opacity: 0.6; filter: grayscale(50%); }
        </style>
    </head>
    <body>
        <div id="root"></div>
        <script type="text/babel">
            const { useState, useEffect } = React;
            
            function App() {
                const [user, setUser] = useState(null);
                const [token, setToken] = useState(localStorage.getItem('token'));
                const [artworks, setArtworks] = useState([]);
                const [isLogin, setIsLogin] = useState(true);
                const [cart, setCart] = useState([]);
                const [orders, setOrders] = useState([]);
                const [showCheckout, setShowCheckout] = useState(false);
                const [showOrders, setShowOrders] = useState(false);
                const [showJourney, setShowJourney] = useState(false);
                const [dailyWisdom, setDailyWisdom] = useState(null);
                const [spiritualJourney, setSpiritualJourney] = useState([]);
                const [loading, setLoading] = useState(false);
                const [formData, setFormData] = useState({
                    email: '',
                    password: '',
                    username: '',
                    name: ''
                });

                useEffect(() => {
                    if (token) {
                        fetchUserProfile();
                    } else {
                        loadArtworks();
                    }
                }, [token]);

                const fetchUserProfile = async () => {
                    try {
                        loadArtworks();
                        loadCart();
                        loadDailyWisdom();
                    } catch (error) {
                        console.error('Profile fetch failed');
                    }
                };

                const handleAuth = async (e) => {
                    e.preventDefault();
                    setLoading(true);
                    
                    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
                    const body = isLogin 
                        ? { email: formData.email, password: formData.password }
                        : formData;

                    try {
                        const response = await fetch(endpoint, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(body)
                        });

                        const data = await response.json();

                        if (response.ok) {
                            setUser(data.user);
                            setToken(data.accessToken);
                            localStorage.setItem('token', data.accessToken);
                            loadArtworks();
                            loadCart();
                            loadDailyWisdom();
                        } else {
                            alert(data.error);
                        }
                    } catch (error) {
                        alert('Authentication failed');
                    }
                    setLoading(false);
                };

                const loadArtworks = async () => {
                    try {
                        const url = user ? \`/api/artworks?userId=\${user.id}\` : '/api/artworks';
                        const response = await fetch(url);
                        const data = await response.json();
                        setArtworks(data);
                    } catch (error) {
                        console.error('Failed to load artworks');
                    }
                };

                const loadCart = async () => {
                    if (!token) return;
                    
                    try {
                        const response = await fetch('/api/cart', {
                            headers: { 'Authorization': 'Bearer ' + token }
                        });
                        
                        if (response.ok) {
                            const data = await response.json();
                            setCart(data);
                        }
                    } catch (error) {
                        console.error('Failed to load cart');
                    }
                };

                const loadDailyWisdom = async () => {
                    if (!token) return;
                    
                    try {
                        const response = await fetch('/api/daily-wisdom', {
                            headers: { 'Authorization': 'Bearer ' + token }
                        });
                        
                        if (response.ok) {
                            const data = await response.json();
                            setDailyWisdom(data);
                        }
                    } catch (error) {
                        console.error('Failed to load daily wisdom');
                    }
                };

                const loadSpiritualJourney = async () => {
                    if (!token) return;
                    
                    try {
                        const response = await fetch('/api/spiritual-journey', {
                            headers: { 'Authorization': 'Bearer ' + token }
                        });
                        
                        if (response.ok) {
                            const data = await response.json();
                            setSpiritualJourney(data);
                        }
                    } catch (error) {
                        console.error('Failed to load spiritual journey');
                    }
                };

                const loadOrders = async () => {
                    if (!token) return;
                    
                    try {
                        const response = await fetch('/api/orders', {
                            headers: { 'Authorization': 'Bearer ' + token }
                        });
                        
                        if (response.ok) {
                            const data = await response.json();
                            setOrders(data);
                        }
                    } catch (error) {
                        console.error('Failed to load orders');
                    }
                };

                const addToCart = async (artwork) => {
                    if (!token) {
                        alert('אנא התחבר כדי להוסיף פריטים לעגלה');
                        return;
                    }

                    if (!artwork.unlocked) {
                        alert('שער זה עדיין נעול. השלם תחילה את השערים הקודמים.');
                        return;
                    }

                    try {
                        const response = await fetch('/api/cart', {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + token 
                            },
                            body: JSON.stringify({ artworkId: artwork.id })
                        });

                        if (response.ok) {
                            loadCart();
                            alert(artwork.title + ' נוסף לעגלה!');
                        } else {
                            const error = await response.json();
                            alert(error.error);
                        }
                    } catch (error) {
                        alert('כשל בהוספה לעגלה');
                    }
                };

                const removeFromCart = async (cartId) => {
                    try {
                        const response = await fetch('/api/cart/' + cartId, {
                            method: 'DELETE',
                            headers: { 'Authorization': 'Bearer ' + token }
                        });

                        if (response.ok) {
                            loadCart();
                        }
                    } catch (error) {
                        console.error('Failed to remove from cart');
                    }
                };

                const processPayment = async () => {
                    if (cart.length === 0) return;
                    
                    setLoading(true);
                    
                    try {
                        const response = await fetch('/api/payment/create-intent', {
                            method: 'POST',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + token 
                            },
                            body: JSON.stringify({ items: cart })
                        });

                        if (response.ok) {
                            const { paymentIntentId } = await response.json();
                            
                            const confirmResponse = await fetch('/api/payment/confirm', {
                                method: 'POST',
                                headers: { 
                                    'Content-Type': 'application/json',
                                    'Authorization': 'Bearer ' + token 
                                },
                                body: JSON.stringify({ paymentIntentId })
                            });

                            if (confirmResponse.ok) {
                                const result = await confirmResponse.json();
                                alert('תשלום הושלם בהצלחה! השערים נפתחו: ' + result.gatesUnlocked.join(', '));
                                setShowCheckout(false);
                                loadArtworks();
                                loadCart();
                                loadOrders();
                                loadDailyWisdom();
                            } else {
                                const error = await confirmResponse.json();
                                alert('התשלום נכשל: ' + error.error);
                            }
                        }
                    } catch (error) {
                        alert('עיבוד התשלום נכשל');
                    }
                    setLoading(false);
                };

                const logout = () => {
                    setUser(null);
                    setToken(null);
                    setCart([]);
                    setOrders([]);
                    setDailyWisdom(null);
                    setSpiritualJourney([]);
                    localStorage.removeItem('token');
                };

                const getRarityColor = (rarity) => {
                    switch(rarity) {
                        case 'Foundation': return 'border-blue-400 bg-blue-50';
                        case 'Intermediate': return 'border-purple-400 bg-purple-50';
                        case 'Advanced': return 'border-gold-400 bg-yellow-50';
                        case 'Master': return 'border-red-400 bg-red-50';
                        default: return 'border-gray-400 bg-gray-50';
                    }
                };

                if (!user) {
                    return React.createElement('div', {
                        className: "min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center",
                        dir: "rtl"
                    }, 
                        React.createElement('div', {
                            className: "bg-white/10 backdrop-blur-lg rounded-lg p-8 w-full max-w-md"
                        },
                            React.createElement('h1', {
                                className: "text-3xl font-bold text-white text-center mb-2 hebrew"
                            }, "✨ שוק המיסטיקה"),
                            
                            React.createElement('p', {
                                className: "text-white/70 text-center mb-2 hebrew"
                            }, "14 שערי הדעת והחיים"),
                            
                            React.createElement('p', {
                                className: "text-white/60 text-center mb-8 text-sm"
                            }, "🔒 מערכת מאובטחת עם מסד נתונים"),
                            
                            React.createElement('form', {
                                onSubmit: handleAuth,
                                className: "space-y-4"
                            },
                                React.createElement('input', {
                                    type: "email",
                                    placeholder: "אימייל",
                                    value: formData.email,
                                    onChange: (e) => setFormData({...formData, email: e.target.value}),
                                    className: "w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/70 text-right",
                                    required: true
                                }),
                                
                                React.createElement('input', {
                                    type: "password",
                                    placeholder: "סיסמה (לפחות 6 תווים)",
                                    value: formData.password,
                                    onChange: (e) => setFormData({...formData, password: e.target.value}),
                                    className: "w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/70 text-right",
                                    required: true,
                                    minLength: 6
                                }),
                                
                                !isLogin && React.createElement('input', {
                                    type: "text",
                                    placeholder: "שם משתמש",
                                    value: formData.username,
                                    onChange: (e) => setFormData({...formData, username: e.target.value}),
                                    className: "w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/70 text-right",
                                    required: true
                                }),
                                
                                !isLogin && React.createElement('input', {
                                    type: "text",
                                    placeholder: "שם מלא",
                                    value: formData.name,
                                    onChange: (e) => setFormData({...formData, name: e.target.value}),
                                    className: "w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/70 text-right",
                                    required: true
                                }),
                                
                                React.createElement('button', {
                                    type: "submit",
                                    disabled: loading,
                                    className: "w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white p-3 rounded-lg font-semibold"
                                }, loading ? 'מעבד...' : (isLogin ? 'התחבר' : 'הירשם'))
                            ),
                            
                            React.createElement('button', {
                                onClick: () => setIsLogin(!isLogin),
                                className: "w-full text-white/70 hover:text-white mt-4"
                            }, isLogin ? 'צריך חשבון? הירשם' : 'יש לך חשבון? התחבר')
                        )
                    );
                }

                return React.createElement('div', {
                    className: "min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900",
                    dir: "rtl"
                },
                    React.createElement('header', {
                        className: "bg-black/20 backdrop-blur-lg p-4"
                    },
                        React.createElement('div', {
                            className: "container mx-auto flex justify-between items-center"
                        },
                            React.createElement('div', {
                                className: "flex items-center space-x-4 space-x-reverse"
                            },
                                React.createElement('h1', {
                                    className: "text-2xl font-bold text-white hebrew"
                                }, "✨ שוק המיסטיקה"),
                                React.createElement('span', {
                                    className: "text-green-400 text-sm"
                                }, "🔒 מאובטח"),
                                React.createElement('span', {
                                    className: "text-purple-300 text-sm hebrew"
                                }, user.spiritualLevel + " | שער " + (user.highestGateUnlocked || 1))
                            ),
                            
                            React.createElement('div', {
                                className: "flex items-center space-x-4 space-x-reverse"
                            },
                                React.createElement('span', {
                                    className: "text-white hebrew"
                                }, 'שלום, ' + user.name + '!'),
                                
                                React.createElement('button', {
                                    onClick: () => { setShowCheckout(true); loadCart(); },
                                    className: "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded hebrew"
                                }, 'עגלה (' + cart.length + ')'),
                                
                                React.createElement('button', {
                                    onClick: () => { setShowOrders(true); loadOrders(); },
                                    className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded hebrew"
                                }, 'הזמנות'),
                                
                                React.createElement('button', {
                                    onClick: () => { setShowJourney(true); loadSpiritualJourney(); },
                                    className: "bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded hebrew"
                                }, 'המסע שלי'),
                                
                                React.createElement('button', {
                                    onClick: logout,
                                    className: "bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded hebrew"
                                }, "התנתק")
                            )
                        )
                    ),

                    // Daily Wisdom Section
                    dailyWisdom && React.createElement('div', {
                        className: "bg-gradient-to-r from-gold-400 to-yellow-300 text-black p-4 m-4 rounded-lg"
                    },
                        React.createElement('h3', {
                            className: "text-lg font-bold mb-2 hebrew"
                        }, "✨ חכמת היום - " + dailyWisdom.gateName),
                        React.createElement('p', {
                            className: "mb-2 hebrew"
                        }, dailyWisdom.contemplation),
                        React.createElement('p', {
                            className: "text-sm italic hebrew"
                        }, dailyWisdom.soulSong)
                    ),

                    React.createElement('main', {
                        className: "container mx-auto p-8"
                    },
                        React.createElement('h2', {
                            className: "text-3xl font-bold text-white mb-2 hebrew"
                        }, "השערים הקדושים"),
                        
                        React.createElement('p', {
                            className: "text-white/70 mb-8 hebrew"
                        }, artworks.length + " יצירות מיסטיות • תשלומים אמיתיים • מסד נתונים מאובטח • מסע רוחני מותאם אישית"),
                        
                        React.createElement('div', {
                            className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        },
                            ...artworks.map(artwork => 
                                React.createElement('div', {
                                    key: artwork.id,
                                    className: \`gate-card bg-white/10 backdrop-blur-lg rounded-lg overflow-hidden hover:scale-105 transition-transform border-2 \${getRarityColor(artwork.rarity_level)} \${!artwork.unlocked ? 'locked' : ''}\`
                                },
                                    React.createElement('div', {
                                        className: "relative"
                                    },
                                        React.createElement('img', {
                                            src: artwork.image,
                                            alt: artwork.title,
                                            className: "w-full h-48 object-cover"
                                        }),
                                        !artwork.unlocked && React.createElement('div', {
                                            className: "absolute inset-0 bg-black/50 flex items-center justify-center"
                                        },
                                            React.createElement('span', {
                                                className: "text-white font-bold text-lg"
                                            }, "🔒 נעול")
                                        )
                                    ),
                                    
                                    React.createElement('div', {
                                        className: "p-6"
                                    },
                                        React.createElement('div', {
                                            className: "flex justify-between items-start mb-2"
                                        },
                                            React.createElement('div', null,
                                                artwork.trending && React.createElement('span', {
                                                    className: "inline-block bg-orange-500 text-white text-xs px-2 py-1 rounded mb-2"
                                                }, "🔥 פופולרי"),
                                                React.createElement('div', {
                                                    className: "text-purple-300 text-sm hebrew"
                                                }, \`שער \${artwork.gate_number}\`)
                                            ),
                                            React.createElement('span', {
                                                className: \`text-xs px-2 py-1 rounded \${
                                                    artwork.rarity_level === 'Master' ? 'bg-red-500 text-white' :
                                                    artwork.rarity_level === 'Advanced' ? 'bg-yellow-500 text-black' :
                                                    artwork.rarity_level === 'Intermediate' ? 'bg-purple-500 text-white' :
                                                    'bg-blue-500 text-white'
                                                }\`
                                            }, artwork.rarity_level)
                                        ),
                                        
                                        React.createElement('h3', {
                                            className: "text-xl font-semibold text-white mb-2 hebrew"
                                        }, artwork.gate_name_hebrew),
                                        
                                        React.createElement('h4', {
                                            className: "text-lg text-purple-200 mb-1"
                                        }, artwork.title),
                                        
                                        React.createElement('p', {
                                            className: "text-white/70 mb-1"
                                        }, 'מאת ' + artwork.artist),
                                        
                                        React.createElement('p', {
                                            className: "text-white/60 text-sm mb-4"
                                        }, artwork.description),
                                        
                                        artwork.contemplation_question && React.createElement('div', {
                                            className: "bg-black/20 p-3 rounded-lg mb-4"
                                        },
                                            React.createElement('p', {
                                                className: "text-purple-200 text-sm hebrew"
                                            }, "💭 " + artwork.contemplation_question)
                                        ),
                                        
                                        React.createElement('div', {
                                            className: "flex justify-between items-center mb-4"
                                        },
                                            React.createElement('span', {
                                                className: "text-2xl font-bold text-purple-300"
                                            }, '$' + (artwork.price / 100).toFixed(2)),
                                            
                                            React.createElement('button', {
                                                onClick: () => addToCart(artwork),
                                                disabled: !artwork.unlocked,
                                                className: \`px-4 py-2 rounded hebrew \${
                                                    artwork.unlocked 
                                                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                                        : 'bg-gray-600 text-gray-300 cursor-not-allowed'
                                                }\`
                                            }, artwork.unlocked ? "הוסף לעגלה" : "נעול")
                                        ),
                                        
                                        React.createElement('div', {
                                            className: "flex justify-between text-white/50 text-sm"
                                        },
                                            React.createElement('span', null, '👁 ' + artwork.views),
                                            React.createElement('span', null, '❤️ ' + artwork.likes),
                                            React.createElement('span', {
                                                className: "hebrew"
                                            }, artwork.pathway)
                                        )
                                    )
                                )
                            )
                        )
                    ),

                    // Cart Modal (same structure but with Hebrew)
                    showCheckout && React.createElement('div', {
                        className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50",
                        dir: "rtl"
                    },
                        React.createElement('div', {
                            className: "bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto"
                        },
                            React.createElement('h3', {
                                className: "text-xl font-bold mb-4 hebrew"
                            }, "🛒 העגלה המאובטחת שלך"),
                            
                            cart.length === 0 ? 
                                React.createElement('p', {
                                    className: "text-gray-500 mb-4 hebrew"
                                }, "העגלה שלך ריקה") :
                                cart.map(item => 
                                    React.createElement('div', {
                                        key: item.cart_id,
                                        className: "flex justify-between items-center mb-2 p-2 border-b"
                                    },
                                        React.createElement('div', null,
                                            React.createElement('div', {
                                                className: "font-medium hebrew"
                                            }, item.gate_name_hebrew),
                                            React.createElement('div', {
                                                className: "text-sm text-gray-500"
                                            }, item.title),
                                            React.createElement('div', {
                                                className: "text-sm text-gray-500"
                                            }, 'מאת ' + item.artist)
                                        ),
                                        React.createElement('div', {
                                            className: "flex items-center space-x-2 space-x-reverse"
                                        },
                                            React.createElement('span', {
                                                className: "font-bold"
                                            }, '$' + (item.price / 100).toFixed(2)),
                                            React.createElement('button', {
                                                onClick: () => removeFromCart(item.cart_id),
                                                className: "text-red-500 hover:text-red-700"
                                            }, "❌")
                                        )
                                    )
                                ),
                            
                            cart.length > 0 && React.createElement('div', {
                                className: "border-t pt-2 font-bold hebrew"
                            }, 'סה"כ: $' + (cart.reduce((sum, item) => sum + item.price, 0) / 100).toFixed(2)),
                            
                            React.createElement('div', {
                                className: "flex space-x-4 space-x-reverse mt-4"
                            },
                                cart.length > 0 && React.createElement('button', {
                                    onClick: processPayment,
                                    disabled: loading,
                                    className: "flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white py-2 rounded hebrew"
                                }, loading ? 'מעבד...' : "💳 שלם עם Stripe"),
                                
                                React.createElement('button', {
                                    onClick: () => setShowCheckout(false),
                                    className: "flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded hebrew"
                                }, "סגור")
                            )
                        )
                    ),

                    // Orders Modal
                    showOrders && React.createElement('div', {
                        className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50",
                        dir: "rtl"
                    },
                        React.createElement('div', {
                            className: "bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-96 overflow-y-auto"
                        },
                            React.createElement('h3', {
                                className: "text-xl font-bold mb-4 hebrew"
                            }, "📦 ההזמנות שלך"),
                            
                            orders.length === 0 ? 
                                React.createElement('p', {
                                    className: "text-gray-500 mb-4 hebrew"
                                }, "אין הזמנות עדיין") :
                                orders.map(order => 
                                    React.createElement('div', {
                                        key: order.id,
                                        className: "border-b pb-2 mb-2"
                                    },
                                        React.createElement('div', {
                                            className: "flex justify-between"
                                        },
                                            React.createElement('span', {
                                                className: "font-medium hebrew"
                                            }, 'הזמנה #' + order.id),
                                            React.createElement('span', {
                                                className: "text-green-600 font-bold"
                                            }, order.status.toUpperCase())
                                        ),
                                        React.createElement('div', {
                                            className: "text-sm text-gray-600 hebrew"
                                        }, '$' + (order.total_amount / 100).toFixed(2) + ' • ' + new Date(order.created_at).toLocaleDateString('he-IL')),
                                        order.spiritual_insights && React.createElement('div', {
                                            className: "text-sm text-purple-600 hebrew mt-1"
                                        }, order.spiritual_insights)
                                    )
                                ),
                            
                            React.createElement('button', {
                                onClick: () => setShowOrders(false),
                                className: "w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded mt-4 hebrew"
                            }, "סגור")
                        )
                    ),

                    // Spiritual Journey Modal
                    showJourney && React.createElement('div', {
                        className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50",
                        dir: "rtl"
                    },
                        React.createElement('div', {
                            className: "bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-96 overflow-y-auto"
                        },
                            React.createElement('h3', {
                                className: "text-xl font-bold mb-4 hebrew"
                            }, "🌟 המסע הרוחני שלך"),
                            
                            spiritualJourney.length === 0 ? 
                                React.createElement('p', {
                                    className: "text-gray-500 mb-4 hebrew"
                                }, "המסע עדיין לא התחיל") :
                                spiritualJourney.map(journey => 
                                    React.createElement('div', {
                                        key: journey.gate_number,
                                        className: "border-b pb-2 mb-2"
                                    },
                                        React.createElement('div', {
                                            className: "flex justify-between items-center"
                                        },
                                            React.createElement('div', null,
                                                React.createElement('span', {
                                                    className: "font-medium hebrew"
                                                }, \`שער \${journey.gate_number} - \${journey.gate_name_hebrew}\`),
                                                React.createElement('div', {
                                                    className: "text-sm text-gray-600"
                                                }, journey.title)
                                            ),
                                            React.createElement('span', {
                                                className: "text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded hebrew"
                                            }, journey.mastery_level)
                                        ),
                                        React.createElement('div', {
                                            className: "text-sm text-gray-500"
                                        }, 'נפתח: ' + new Date(journey.unlocked_at).toLocaleDateString('he-IL'))
                                    )
                                ),
                            
                            React.createElement('button', {
                                onClick: () => setShowJourney(false),
                                className: "w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded mt-4 hebrew"
                            }, "סגור")
                        )
                    )
                );
            }

            ReactDOM.render(React.createElement(App), document.getElementById('root'));
        </script>
    </body>
    </html>
  `);
});

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 14 Gates Mystical Marketplace running on port ${PORT}`);
    console.log(`✅ Features: Complete 14 Gates System, Spiritual Progression, Daily Wisdom`);
    console.log(`🔒 Security: bcrypt, JWT, input validation`);
    console.log(`📚 Gates: Subject & Predicate → The Speaking Power`);
    console.log(`🌟 Pathways: Tree of Knowledge, Tree of Life, AI Reflection`);
  });
});
