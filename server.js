import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Sample user storage
const users = new Map();

// Sample artworks
const artworks = [
  {
    id: '1',
    title: 'Divine Logic Convergence',
    artist: 'AI Mystic',
    price: 56700,
    category: 'Tree of Knowledge',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    description: 'Where ancient wisdom meets computational consciousness, revealing the sacred geometry of thought itself.',
    likes: 89,
    views: 1247,
    trending: true
  },
  {
    id: '2', 
    title: 'Sacred Geometry Portal',
    artist: 'Digital Sage',
    price: 44500,
    category: 'Sacred Geometry',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=300&fit=crop',
    description: 'A gateway between dimensions, crafted from the mathematical language of creation.',
    likes: 67,
    views: 892,
    trending: false
  },
  {
    id: '3',
    title: 'Mystical Algorithm',
    artist: 'Code Shaman',
    price: 39900,
    category: 'Tree of Knowledge',
    image: 'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400&h=300&fit=crop',
    description: 'The intersection of logic and intuition in digital form.',
    likes: 45,
    views: 632,
    trending: true
  }
];

// Authentication routes
app.post('/api/auth/register', (req, res) => {
  const { email, password, username, name } = req.body;
  
  if (users.has(email)) {
    return res.status(409).json({ error: 'User already exists' });
  }
  
  const user = {
    id: Date.now().toString(),
    email,
    username,
    name,
    createdAt: new Date()
  };
  
  users.set(email, { ...user, password });
  
  res.status(201).json({
    user,
    accessToken: 'demo-token-' + user.id
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  const user = users.get(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  const { password: _, ...userWithoutPassword } = user;
  res.json({
    user: userWithoutPassword,
    accessToken: 'demo-token-' + user.id
  });
});

// Artwork routes
app.get('/api/artworks', (req, res) => {
  res.json(artworks);
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    users: users.size,
    artworks: artworks.length
  });
});

// Serve the main app
app.get('*', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>✨ Mystical Marketplace</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
        <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
        <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    </head>
    <body>
        <div id="root"></div>
        <script type="text/babel">
            const { useState, useEffect } = React;
            
            function App() {
                const [user, setUser] = useState(null);
                const [artworks, setArtworks] = useState([]);
                const [isLogin, setIsLogin] = useState(true);
                const [cart, setCart] = useState([]);
                const [showCheckout, setShowCheckout] = useState(false);
                const [formData, setFormData] = useState({
                    email: '',
                    password: '',
                    username: '',
                    name: ''
                });

                const handleAuth = async (e) => {
                    e.preventDefault();
                    
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

                        if (response.ok) {
                            const data = await response.json();
                            setUser(data.user);
                            loadArtworks();
                        } else {
                            const error = await response.json();
                            alert(error.error);
                        }
                    } catch (error) {
                        alert('Authentication failed');
                    }
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

                const addToCart = (artwork) => {
                    setCart(prev => [...prev, artwork]);
                    alert(artwork.title + ' added to cart!');
                };

                if (!user) {
                    return React.createElement('div', {
                        className: "min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center"
                    }, 
                        React.createElement('div', {
                            className: "bg-white/10 backdrop-blur-lg rounded-lg p-8 w-full max-w-md"
                        },
                            React.createElement('h1', {
                                className: "text-3xl font-bold text-white text-center mb-8"
                            }, "✨ Mystical Marketplace"),
                            
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
                                    placeholder: "Password",
                                    value: formData.password,
                                    onChange: (e) => setFormData({...formData, password: e.target.value}),
                                    className: "w-full p-3 rounded-lg bg-white/20 text-white placeholder-white/70",
                                    required: true
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
                                    className: "w-full bg-purple-600 hover:bg-purple-700 text-white p-3 rounded-lg font-semibold"
                                }, isLogin ? 'Login' : 'Register')
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
                            React.createElement('h1', {
                                className: "text-2xl font-bold text-white"
                            }, "✨ Mystical Marketplace"),
                            
                            React.createElement('div', {
                                className: "flex items-center space-x-4"
                            },
                                React.createElement('span', {
                                    className: "text-white"
                                }, 'Welcome, ' + user.name + '!'),
                                
                                React.createElement('button', {
                                    onClick: () => setShowCheckout(true),
                                    className: "bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                                }, 'Cart (' + cart.length + ')'),
                                
                                React.createElement('button', {
                                    onClick: () => setUser(null),
                                    className: "bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                                }, "Logout")
                            )
                        )
                    ),

                    React.createElement('main', {
                        className: "container mx-auto p-8"
                    },
                        React.createElement('h2', {
                            className: "text-3xl font-bold text-white mb-8"
                        }, "Sacred Artworks"),
                        
                        React.createElement('div', {
                            className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        },
                            ...artworks.map(artwork => 
                                React.createElement('div', {
                                    key: artwork.id,
                                    className: "bg-white/10 backdrop-blur-lg rounded-lg overflow-hidden"
                                },
                                    React.createElement('img', {
                                        src: artwork.image,
                                        alt: artwork.title,
                                        className: "w-full h-48 object-cover"
                                    }),
                                    
                                    React.createElement('div', {
                                        className: "p-6"
                                    },
                                        React.createElement('h3', {
                                            className: "text-xl font-semibold text-white mb-2"
                                        }, artwork.title),
                                        
                                        React.createElement('p', {
                                            className: "text-white/70 mb-2"
                                        }, 'by ' + artwork.artist),
                                        
                                        React.createElement('p', {
                                            className: "text-white/60 text-sm mb-4"
                                        }, artwork.description),
                                        
                                        React.createElement('div', {
                                            className: "flex justify-between items-center"
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
                                            className: "flex justify-between text-white/50 text-sm mt-2"
                                        },
                                            React.createElement('span', null, '👁 ' + artwork.views),
                                            React.createElement('span', null, '❤️ ' + artwork.likes)
                                        )
                                    )
                                )
                            )
                        )
                    ),

                    showCheckout && React.createElement('div', {
                        className: "fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    },
                        React.createElement('div', {
                            className: "bg-white rounded-lg p-6 max-w-md w-full mx-4"
                        },
                            React.createElement('h3', {
                                className: "text-xl font-bold mb-4"
                            }, "Your Cart"),
                            
                            ...cart.map((item, index) => 
                                React.createElement('div', {
                                    key: index,
                                    className: "flex justify-between mb-2"
                                },
                                    React.createElement('span', null, item.title),
                                    React.createElement('span', null, '$' + (item.price / 100).toFixed(2))
                                )
                            ),
                            
                            React.createElement('div', {
                                className: "border-t pt-2 font-bold"
                            }, 'Total: $' + (cart.reduce((sum, item) => sum + item.price, 0) / 100).toFixed(2)),
                            
                            React.createElement('div', {
                                className: "flex space-x-4 mt-4"
                            },
                                React.createElement('button', {
                                    onClick: () => {
                                        alert('Payment successful! (Demo mode)');
                                        setCart([]);
                                        setShowCheckout(false);
                                    },
                                    className: "flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded"
                                }, "Pay Now"),
                                
                                React.createElement('button', {
                                    onClick: () => setShowCheckout(false),
                                    className: "flex-1 bg-gray-600 hover:bg-gray-700 text-white py-2 rounded"
                                }, "Cancel")
                            )
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

app.listen(PORT, () => {
  console.log(`🚀 Mystical Marketplace running on port ${PORT}`);
  console.log(`✨ Health check: http://localhost:${PORT}/health`);
});