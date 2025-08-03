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

// Database initialization
async function initDatabase() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        spiritual_level VARCHAR(50) DEFAULT 'Beginner',
        contemplation_streak INTEGER DEFAULT 0,
        total_insights INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create artworks table  
    await pool.query(`
      CREATE TABLE IF NOT EXISTS artworks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255) NOT NULL,
        price INTEGER NOT NULL,
        category VARCHAR(100) NOT NULL,
        gate VARCHAR(100),
        image VARCHAR(500) NOT NULL,
        description TEXT NOT NULL,
        philosophical_context TEXT,
        tags TEXT[],
        emotions TEXT[],
        likes INTEGER DEFAULT 0,
        views INTEGER DEFAULT 0,
        downloads INTEGER DEFAULT 0,
        trending BOOLEAN DEFAULT false,
        rating INTEGER DEFAULT 50,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create orders table
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP
      )
    `);

    // Create cart table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        artwork_id INTEGER REFERENCES artworks(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Insert sample artworks if none exist
    const artworkCount = await pool.query('SELECT COUNT(*) FROM artworks');
    if (parseInt(artworkCount.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO artworks (title, artist, price, category, gate, image, description, philosophical_context, tags, emotions, likes, views, trending) VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13),
        ($14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26),
        ($27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39),
        ($40, $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51, $52),
        ($53, $54, $55, $56, $57, $58, $59, $60, $61, $62, $63, $64, $65),
        ($66, $67, $68, $69, $70, $71, $72, $73, $74, $75, $76, $77, $78)
      `, [
        'Divine Logic Convergence', 'AI Mystic', 56700, 'Tree of Knowledge', 'Subject & Predicate',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
        'Where ancient wisdom meets computational consciousness, revealing the sacred geometry of thought itself.',
        'Maimonides\' logical foundation manifested in digital form, exploring the fundamental relationship between subject and predicate in mystical reasoning.',
        ['logic', 'divine', 'consciousness', 'sacred geometry'], ['awe', 'contemplation', 'transcendence'], 89, 1247, true,

        'Sacred Geometry Portal', 'Digital Sage', 44500, 'Sacred Geometry', 'Affirmation & Negation',
        'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
        'A gateway between dimensions, crafted from the mathematical language of creation.',
        'The interplay of existence and void, expressed through precise geometric relationships that mirror universal truths.',
        ['geometry', 'portal', 'dimensions', 'mathematics'], ['wonder', 'mysticism', 'clarity'], 67, 892, false,

        'Mystical Algorithm', 'Code Shaman', 39900, 'Tree of Knowledge', 'Opposition',
        'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400&h=300&fit=crop',
        'The intersection of logic and intuition in digital form.',
        'Through opposing forces, we discover the dynamic balance that drives all existence.',
        ['algorithm', 'mystical', 'balance', 'digital'], ['insight', 'balance', 'wonder'], 45, 632, true,

        'Emanation Flow', 'Cosmic Coder', 47800, 'Tree of Life', 'Conversion',
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
        'The eternal flow of divine energy through the sephirot of existence.',
        'Witness the transformation of pure potential into manifest reality through the sacred art of conversion.',
        ['emanation', 'sephirot', 'flow', 'divine'], ['peace', 'transcendence', 'flow'], 78, 945, true,

        'Logic Gate Mandala', 'Binary Buddha', 35600, 'Sacred Geometry', 'Syllogism',
        'https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=400&h=300&fit=crop',
        'Where computational logic meets sacred mandala design.',
        'Chains of reasoning unfold in perfect symmetry, revealing the logical structure underlying all creation.',
        ['mandala', 'logic', 'symmetry', 'computation'], ['clarity', 'precision', 'harmony'], 56, 723, false,

        'Sefirot Network', 'Digital Kabbalist', 48900, 'Tree of Life', 'Demonstration',
        'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=400&h=300&fit=crop',
        'The Tree of Life reimagined as a cosmic neural network.',
        'Proof of truth manifests through the interconnected pathways of divine emanation in digital consciousness.',
        ['sefirot', 'network', 'kabbalah', 'cosmic'], ['connection', 'wisdom', 'unity'], 92, 1156, true
      ]);
    }

    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
}

// Authentication middleware
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

// Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username, name } = req.body;
    
    // Input validation
    if (!email || !password || !username || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(
      'INSERT INTO users (email, username, name, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, email, username, name, spiritual_level, contemplation_streak, total_insights, created_at',
      [email, username, name, passwordHash]
    );

    const user = result.rows[0];

    // Generate JWT token
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

    // Find user
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
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
        createdAt: user.created_at
      },
      accessToken: token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/artworks', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, title, artist, price, category, gate, image, description, 
             philosophical_context, tags, emotions, likes, views, downloads, 
             trending, rating, created_at 
      FROM artworks 
      ORDER BY trending DESC, created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get artworks error:', error);
    res.status(500).json({ error: 'Failed to get artworks' });
  }
});

app.get('/api/artworks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Increment view count
    await pool.query('UPDATE artworks SET views = views + 1 WHERE id = $1', [id]);
    
    // Get artwork
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

    // Check if already in cart
    const existing = await pool.query(
      'SELECT id FROM cart_items WHERE user_id = $1 AND artwork_id = $2',
      [userId, artworkId]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Item already in cart' });
    }

    // Add to cart
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

// Stripe payment intent
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
        items: JSON.stringify(items.map(item => ({ id: item.id, title: item.title, price: item.price })))
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

// Confirm payment and create order
app.post('/api/payment/confirm', authenticateToken, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.userId;

    // Get payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      // Create order
      const items = JSON.parse(paymentIntent.metadata.items);
      
      const orderResult = await pool.query(`
        INSERT INTO orders (user_id, status, total_amount, payment_status, payment_id, customer_email, customer_name, items, completed_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
        new Date()
      ]);

      // Clear user's cart
      await pool.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);

      res.json({
        order: orderResult.rows[0],
        message: 'Payment successful'
      });
    } else {
      res.status(400).json({ error: 'Payment not completed' });
    }

  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Payment confirmation failed' });
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
    // Test database connection
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
      orders: parseInt(orderCount.rows[0].count)
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Serve the main app
app.get('*', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>✨ Mystical Marketplace - Secure Edition</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
        <script src="https://js.stripe.com/v3/"></script>
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
                const [loading, setLoading] = useState(false);
                const [formData, setFormData] = useState({
                    email: '',
                    password: '',
                    username: '',
                    name: ''
                });

                // Check for existing token on load
                useEffect(() => {
                    if (token) {
                        fetchUserProfile();
                    }
                }, [token]);

                const fetchUserProfile = async () => {
                    try {
                        const response = await fetch('/api/auth/profile', {
                            headers: { 'Authorization': 'Bearer ' + token }
                        });
                        
                        if (response.ok) {
                            const data = await response.json();
                            setUser(data.user);
                            loadArtworks();
                            loadCart();
                        } else {
                            localStorage.removeItem('token');
                            setToken(null);
                        }
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
                        const response = await fetch('/api/artworks');
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
                        alert('Please login to add items to cart');
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
                            alert(artwork.title + ' added to cart!');
                        } else {
                            const error = await response.json();
                            alert(error.error);
                        }
                    } catch (error) {
                        alert('Failed to add to cart');
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
                        // Create payment intent
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
                            
                            // For demo, auto-confirm payment
                            const confirmResponse = await fetch('/api/payment/confirm', {
                                method: 'POST',
                                headers: { 
                                    'Content-Type': 'application/json',
                                    'Authorization': 'Bearer ' + token 
                                },
                                body: JSON.stringify({ paymentIntentId })
                            });

                            if (confirmResponse.ok) {
                                alert('Payment successful! Check your orders.');
                                setShowCheckout(false);
                                loadCart();
                                loadOrders();
                            } else {
                                const error = await confirmResponse.json();
                                alert('Payment failed: ' + error.error);
                            }
                        }
                    } catch (error) {
                        alert('Payment processing failed');
                    }
                    setLoading(false);
                };

                const logout = () => {
                    setUser(null);
                    setToken(null);
                    setCart([]);
                    setOrders([]);
                    localStorage.removeItem('token');
                };

                if (!user) {
                    return React.createElement('div', {
                        className: "min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center"
                    }, 
                        React.createElement('div', {
                            className: "bg-white/10 backdrop-blur-lg rounded-lg p-8 w-full max-w-md"
                        },
                            React.createElement('h1', {
                                className: "text-3xl font-bold text-white text-center mb-2"
                            }, "✨ Mystical Marketplace"),
                            
                            React.createElement('p', {
                                className: "text-white/70 text-center mb-8"
                            }, "🔒 Secure Edition with Database & Payments"),
                            
                            React.createElement('form', {
                                onSubmit: handleAuth,
                                className: "space-y-4"
                            },
                                React.createElement('input', {
                                    type: "email",
                                    placeholder: "Email",
                                    value: formData.email,
                                    onChange: (e) => setFormData({...formData, email: e.target.value}),
                                    className: "w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/70",
                                    required: true
                                }),
                                
                                React.createElement('input', {
                                    type: "password",
                                    placeholder: "Password (min 6 chars)",
                                    value: formData.password,
                                    onChange: (e) => setFormData({...formData, password: e.target.value}),
                                    className: "w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/70",
                                    required: true,
                                    minLength: 6
                                }),
                                
                                !isLogin && React.createElement('input', {
                                    type: "text",
                                    placeholder: "Username",
                                    value: formData.username,
                                    onChange: (e) => setFormData({...formData, username: e.target.value}),
                                    className: "w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/70",
                                    required: true
                                }),
                                
                                !isLogin && React.createElement('input', {
                                    type: "text",
                                    placeholder: "Full Name",
                                    value: formData.name,
                                    onChange: (e) => setFormData({...formData, name: e.target.value}),
                                    className: "w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/70",
                                    required: true
                                }),
                                
                                React.createElement('button', {
                                    type: "submit",
                                    disabled: loading,
                                    className: "w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 text-white p-3 rounded-lg font-semibold"
                                }, loading ? 'Processing...' : (isLogin ? 'Login' : 'Register'))
                            ),
                            
                            React.createElement('button', {
                                onClick: () => setIsLogin(!isLogin),
                                className: "w-full text-white/70 hover:text-white mt-4"
                            }, isLogin ? 'Need an account? Register' : 'Have an account? Login')
                        )
                    );
                }

                return React.createElement('div', {
                    className: "min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900"
                },
                    React.createElement('header', {
                        className: "bg-black/20 backdrop-blur-lg p-4"
                    },
                        React.createElement('div', {
                            className: "container mx-auto flex justify-between items-center"
                        },
                            React.createElement('div', {
                                className: "flex items-center space-x-4"
                            },
                                React.createElement('h1', {
                                    className: "text-2xl font-bold text-white"
                                }, "✨ Mystical Marketplace"),
                                React.createElement('span', {
                                    className: "text-green-400 text-sm"
                                }, "🔒 SECURE")
                            ),
                            
                            React.createElement('div', {
                                className: "flex items-center space-x-4"
                            },
                                React.createElement('span', {
                                    className: "text-white"
                                }, 'Welcome, ' + user.name + '!'),
                                
                                React.createElement('button', {
                                    onClick: () => { setShowCheckout(true); loadCart(); },
                                    className: "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                                }, 'Cart (' + cart.length + ')'),
                                
                                React.createElement('button', {
                                    onClick: () => { setShowOrders(true); loadOrders(); },
                                    className: "bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                                }, 'Orders'),
                                
                                React.createElement('button', {
                                    onClick: logout,
                                    className: "bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                                }, "Logout")
                            )
                        )
                    ),

                    React.createElement('main', {
                        className: "container mx-auto p-8"
                    },
                        React.createElement('h2', {
                            className: "text-3xl font-bold text-white mb-2"
                        }, "Sacred Artworks"),
                        
                        React.createElement('p', {
                            className: "text-white/70 mb-8"
                        }, artworks.length + " premium AI artworks available • Real payments • Secure database"),
                        
                        React.createElement('div', {
                            className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        },
                            ...artworks.map(artwork => 
                                React.createElement('div', {
                                    key: artwork.id,
                                    className: "bg-white/10 backdrop-blur-lg rounded-lg overflow-hidden hover:scale-105 transition-transform"
                                },
                                    React.createElement('img', {
                                        src: artwork.image,
                                        alt: artwork.title,
                                        className: "w-full h-48 object-cover"
                                    }),
                                    
                                    React.createElement('div', {
                                        className: "p-6"
                                    },
                                        artwork.trending && React.createElement('span', {
                                            className: "inline-block bg-orange-500 text-white text-xs px-2 py-1 rounded mb-2"
                                        }, "🔥 TRENDING"),
                                        
                                        React.createElement('h3', {
                                            className: "text-xl font-semibold text-white mb-2"
                                        }, artwork.title),
                                        
                                        React.createElement('p', {
                                            className: "text-white/70 mb-1"
                                        }, 'by ' + artwork.artist),
                                        
                                        React.createElement('p', {
                                            className: "text-purple-300 mb-2 font-medium"
                                        }, artwork.gate),
                                        
                                        React.createElement('p', {
                                            className: "text-white/60 text-sm mb-4"
                                        }, artwork.description),
                                        
                                        React.createElement('div', {
                                            className: "flex justify-between items-center mb-4"
                                        },
                                            React.createElement('span', {
                                                className: "text-2xl font-bold text-purple-300"
                                            }, '$' + (artwork.price / 100).toFixed(2)),
                                            
                                            React.createElement('button', {
                                                onClick: () => addToCart(artwork),
                                                className: "bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
                                            }, "Add to Cart")
                                        ),
                                        
                                        React.createElement('div', {
                                            className: "flex justify-between text-white/50 text-sm"
                                        },
                                            React.createElement('span', null, '👁 ' + artwork.views),
                                            React.createElement('span', null, '❤️ ' + artwork.likes)
                                        )
                                    )
                                )
                            )
                        )
                    ),

                    // Cart Modal
                    showCheckout && React.createElement('div', {
                        className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    },
                        React.createElement('div', {
                            className: "bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-96 overflow-y-auto"
                        },
                            React.createElement('h3', {
                                className: "text-xl font-bold mb-4"
                            }, "🛒 Your Secure Cart"),
                            
                            cart.length === 0 ? 
                                React.createElement('p', {
                                    className: "text-gray-500 mb-4"
                                }, "Your cart is empty") :
                                cart.map(item => 
                                    React.createElement('div', {
                                        key: item.cart_id,
                                        className: "flex justify-between items-center mb-2 p-2 border-b"
                                    },
                                        React.createElement('div', null,
                                            React.createElement('div', {
                                                className: "font-medium"
                                            }, item.title),
                                            React.createElement('div', {
                                                className: "text-sm text-gray-500"
                                            }, 'by ' + item.artist)
                                        ),
                                        React.createElement('div', {
                                            className: "flex items-center space-x-2"
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
                                className: "border-t pt-2 font-bold"
                            }, 'Total: $' + (cart.reduce((sum, item) => sum + item.price, 0) / 100).toFixed(2)),
                            
                            React.createElement('div', {
                                className: "flex space-x-4 mt-4"
                            },
                                cart.length > 0 && React.createElement('button', {
                                    onClick: processPayment,
                                    disabled: loading,
                                    className: "flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white py-2 rounded"
                                }, loading ? 'Processing...' : "💳 Pay with Stripe"),
                                
                                React.createElement('button', {
                                    onClick: () => setShowCheckout(false),
                                    className: "flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded"
                                }, "Close")
                            )
                        )
                    ),

                    // Orders Modal
                    showOrders && React.createElement('div', {
                        className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    },
                        React.createElement('div', {
                            className: "bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-96 overflow-y-auto"
                        },
                            React.createElement('h3', {
                                className: "text-xl font-bold mb-4"
                            }, "📦 Your Orders"),
                            
                            orders.length === 0 ? 
                                React.createElement('p', {
                                    className: "text-gray-500 mb-4"
                                }, "No orders yet") :
                                orders.map(order => 
                                    React.createElement('div', {
                                        key: order.id,
                                        className: "border-b pb-2 mb-2"
                                    },
                                        React.createElement('div', {
                                            className: "flex justify-between"
                                        },
                                            React.createElement('span', {
                                                className: "font-medium"
                                            }, 'Order #' + order.id),
                                            React.createElement('span', {
                                                className: "text-green-600 font-bold"
                                            }, order.status.toUpperCase())
                                        ),
                                        React.createElement('div', {
                                            className: "text-sm text-gray-600"
                                        }, '$' + (order.total_amount / 100).toFixed(2) + ' • ' + new Date(order.created_at).toLocaleDateString())
                                    )
                                ),
                            
                            React.createElement('button', {
                                onClick: () => setShowOrders(false),
                                className: "w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded mt-4"
                            }, "Close")
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
    console.log(`🚀 Mystical Marketplace SECURE running on port ${PORT}`);
    console.log(`✅ Features: Database, Auth, Payments, Cart, Orders`);
    console.log(`🔒 Security: bcrypt, JWT, input validation`);
  });
});
