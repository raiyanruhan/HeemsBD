const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static('public'));

// In-memory session storage (simple implementation)
const activeTokens = new Set();
const ADMIN_PASSWORD = 'admin123';

// Helper function to read products
function readProducts() {
    try {
        const data = fs.readFileSync(path.join(__dirname, 'data', 'dress.json'), 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading products:', error);
        return [];
    }
}

// Helper function to write products
function writeProducts(products) {
    try {
        fs.writeFileSync(path.join(__dirname, 'data', 'dress.json'), JSON.stringify(products, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing products:', error);
        return false;
    }
}

// Authentication middleware
function requireAuth(req, res, next) {
    const token = req.headers.authorization;
    
    if (!token || !activeTokens.has(token)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    next();
}

// Routes
app.get('/', (req, res) => {
    res.redirect('/login.html');
});

// Login endpoint
app.post('/login', (req, res) => {
    const { password } = req.body;
    
    if (password === ADMIN_PASSWORD) {
        // Generate random token
        const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
        activeTokens.add(token);
        
        res.json({ success: true, token });
    } else {
        res.status(401).json({ error: 'Invalid password' });
    }
});

// Get products (protected)
app.get('/products', requireAuth, (req, res) => {
    const products = readProducts();
    res.json(products);
});

// Update products (protected)
app.post('/products', requireAuth, (req, res) => {
    const { products } = req.body;
    
    if (!Array.isArray(products)) {
        return res.status(400).json({ error: 'Products must be an array' });
    }
    
    const success = writeProducts(products);
    
    if (success) {
        res.json({ success: true, message: 'Products updated successfully' });
    } else {
        res.status(500).json({ error: 'Failed to update products' });
    }
});

// Logout endpoint (optional - removes token)
app.post('/logout', (req, res) => {
    const token = req.headers.authorization;
    if (token) {
        activeTokens.delete(token);
    }
    res.json({ success: true });
});

// Start server
app.listen(PORT, () => {
    console.log(`Dashboard server running on http://localhost:${PORT}`);
    console.log(`Admin password: ${ADMIN_PASSWORD}`);
}); 