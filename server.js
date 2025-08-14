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

// Helper function to read HTML files
function readHtmlFile(filename) {
    try {
        const filePath = path.join(__dirname, filename);
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, 'utf8');
        }
        return null;
    } catch (error) {
        console.error(`Error reading HTML file ${filename}:`, error);
        return null;
    }
}

// Helper function to write HTML files
function writeHtmlFile(filename, content) {
    try {
        const filePath = path.join(__dirname, filename);
        fs.writeFileSync(filePath, content, 'utf8');
        return true;
    } catch (error) {
        console.error(`Error writing HTML file ${filename}:`, error);
        return false;
    }
}

// Helper function to get list of HTML files
function getHtmlFiles() {
    try {
        const files = fs.readdirSync(__dirname);
        return files.filter(file => file.endsWith('.html') && file !== 'login.html' && file !== 'dashboard.html');
    } catch (error) {
        console.error('Error reading directory:', error);
        return [];
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

// Get list of HTML files (protected)
app.get('/html-files', requireAuth, (req, res) => {
    const htmlFiles = getHtmlFiles();
    res.json({ files: htmlFiles });
});

// Get HTML file content (protected)
app.get('/html-content/:filename', requireAuth, (req, res) => {
    const { filename } = req.params;
    const content = readHtmlFile(filename);
    
    if (content === null) {
        return res.status(404).json({ error: 'File not found' });
    }
    
    res.json({ content, filename });
});

// Update HTML file content (protected)
app.post('/html-content/:filename', requireAuth, (req, res) => {
    const { filename } = req.params;
    const { content } = req.body;
    
    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }
    
    const success = writeHtmlFile(filename, content);
    
    if (success) {
        res.json({ success: true, message: 'HTML file updated successfully' });
    } else {
        res.status(500).json({ error: 'Failed to update HTML file' });
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