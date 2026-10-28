// App State
const state = {
    user: null,
    token: localStorage.getItem('token'),
    artworks: [],
    cart: [],
    isLogin: true
};

// API calls
const API = {
    baseURL: '',
    
    async fetch(url, options = {}) {
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (state.token) {
            headers['Authorization'] = `Bearer ${state.token}`;
        }
        
        const response = await fetch(this.baseURL + url, {
            ...options,
            headers
        });
        
        if (!response.ok) {
            throw new Error(await response.text());
        }
        
        return response.json();
    },
    
    async login(email, password) {
        const data = await this.fetch('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        return data;
    },
    
    async register(email, password, username, name) {
        const data = await this.fetch('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify({ email, password, username, name })
        });
        return data;
    },
    
    async getArtworks(collection = '') {
        const url = collection ? `/api/artworks?collection=${encodeURIComponent(collection)}` : '/api/artworks';
        return this.fetch(url);
    },
    
    async getArtwork(id) {
        return this.fetch(`/api/artworks/${id}`);
    },
    
    async getCart() {
        return this.fetch('/api/cart');
    },
    
    async addToCart(artworkId, licenseType = 'personal') {
        return this.fetch('/api/cart', {
            method: 'POST',
            body: JSON.stringify({ artworkId, licenseType })
        });
    },
    
    async updateCartLicense(cartId, licenseType) {
        return this.fetch(`/api/cart/${cartId}/license`, {
            method: 'PATCH',
            body: JSON.stringify({ licenseType })
        });
    },
    
    async removeFromCart(cartId) {
        return this.fetch(`/api/cart/${cartId}`, {
            method: 'DELETE'
        });
    }
};

// UI Helpers
const UI = {
    showAuthModal() {
        document.getElementById('auth-modal').classList.remove('hidden');
    },
    
    hideAuthModal() {
        document.getElementById('auth-modal').classList.add('hidden');
    },
    
    updateAuthMode(isLogin) {
        state.isLogin = isLogin;
        const title = document.getElementById('auth-modal-title');
        const toggle = document.getElementById('auth-toggle');
        const submit = document.getElementById('auth-submit');
        const registerFields = document.getElementById('register-fields');
        
        if (isLogin) {
            title.textContent = 'התחברות';
            toggle.textContent = 'אין לך חשבון? הירשם';
            submit.textContent = 'התחבר';
            registerFields.classList.add('hidden');
        } else {
            title.textContent = 'הרשמה';
            toggle.textContent = 'יש לך חשבון? התחבר';
            submit.textContent = 'הירשם';
            registerFields.classList.remove('hidden');
        }
    },
    
    updateUserUI() {
        const authBtn = document.getElementById('auth-btn');
        const navUserInfo = document.getElementById('nav-user-info');
        
        if (state.user) {
            authBtn.textContent = 'התנתק';
            navUserInfo.textContent = `שלום, ${state.user.name}`;
            navUserInfo.classList.remove('hidden');
        } else {
            authBtn.textContent = 'התחבר';
            navUserInfo.classList.add('hidden');
        }
    },
    
    updateCartCount() {
        const count = state.cart.length;
        document.querySelectorAll('#cart-count').forEach(el => {
            el.textContent = count;
        });
    },
    
    renderArtworks(artworks) {
        const grid = document.getElementById('artworks-grid');
        
        if (artworks.length === 0) {
            grid.innerHTML = '<p class="text-center" style="grid-column: 1/-1;">לא נמצאו יצירות באוסף זה</p>';
            return;
        }
        
        grid.innerHTML = artworks.map(artwork => {
            const sealLetter = artwork.category === 'עץ הדעת' ? 'פ' : 
                             artwork.category === 'עץ החיים' ? 'ש' : 'ג';
            const collectionName = artwork.category === 'עץ הדעת' ? 'PELEH' :
                                  artwork.category === 'עץ החיים' ? 'שני עצים בלב' : 'גן המבוכה';
            
            return `
                <a href="/product.html?id=${artwork.id}" class="card">
                    <div class="im">
                        <img src="${artwork.image}" alt="${artwork.title}" loading="lazy">
                    </div>
                    <div class="t">
                        <div class="brand">
                            <span class="seal">${sealLetter}</span>
                            ${collectionName}
                        </div>
                        <div class="title">${artwork.title}</div>
                        <div class="price">$${(artwork.price / 100).toFixed(0)}</div>
                    </div>
                </a>
            `;
        }).join('');
    }
};

// Event Handlers
async function handleAuth(e) {
    e.preventDefault();
    
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    const submit = document.getElementById('auth-submit');
    
    submit.disabled = true;
    submit.textContent = 'מעבד...';
    
    try {
        let data;
        if (state.isLogin) {
            data = await API.login(email, password);
        } else {
            const username = document.getElementById('auth-username').value;
            const name = document.getElementById('auth-name').value;
            data = await API.register(email, password, username, name);
        }
        
        state.user = data.user;
        state.token = data.accessToken;
        localStorage.setItem('token', data.accessToken);
        
        UI.hideAuthModal();
        UI.updateUserUI();
        await loadCart();
        
        alert(`${state.isLogin ? 'התחברת' : 'נרשמת'} בהצלחה!`);
    } catch (error) {
        alert('שגיאה: ' + error.message);
    } finally {
        submit.disabled = false;
        submit.textContent = state.isLogin ? 'התחבר' : 'הירשם';
    }
}

function handleAuthBtn() {
    if (state.user) {
        // Logout
        state.user = null;
        state.token = null;
        state.cart = [];
        localStorage.removeItem('token');
        UI.updateUserUI();
        UI.updateCartCount();
    } else {
        UI.showAuthModal();
    }
}

async function loadArtworks(collection = '') {
    try {
        state.artworks = await API.getArtworks(collection);
        UI.renderArtworks(state.artworks);
    } catch (error) {
        console.error('Failed to load artworks:', error);
    }
}

async function loadCart() {
    if (!state.token) return;
    
    try {
        state.cart = await API.getCart();
        UI.updateCartCount();
    } catch (error) {
        console.error('Failed to load cart:', error);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
    // Event listeners
    document.getElementById('auth-form').addEventListener('submit', handleAuth);
    document.getElementById('auth-toggle').addEventListener('click', () => {
        UI.updateAuthMode(!state.isLogin);
    });
    document.getElementById('auth-btn').addEventListener('click', handleAuthBtn);
    document.getElementById('collection-filter').addEventListener('change', (e) => {
        loadArtworks(e.target.value);
    });
    
    // Close modal on overlay click
    document.getElementById('auth-modal').addEventListener('click', (e) => {
        if (e.target.id === 'auth-modal') {
            UI.hideAuthModal();
        }
    });
    
    // Initial load
    UI.updateUserUI();
    await loadArtworks();
    await loadCart();
});
