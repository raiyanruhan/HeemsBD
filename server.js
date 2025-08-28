const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const bcrypt = require('bcrypt');
const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, 'assets', 'uploads');
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept only image files
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Middleware
app.use(express.json());

// Serve static files from root directory (main website)
app.use((req, res, next) => {
	if (req.url.startsWith('/cart')) {
		return res.status(404).end();
	}
	next();
});

// Serve assets directory
app.use('/assets', express.static('assets'));

// Serve js directory
app.use('/js', express.static('js'));

// Serve data directory (for JSON files)
app.use('/data', express.static('data'));

// In-memory session storage (simple implementation)
const activeTokens = new Set();
const ADMIN_PASSWORD_HASH = '$2b$10$YourHashedPasswordHere'; // We'll generate this

// Generate password hash for the new password
async function generatePasswordHash() {
    const password = "h^i^Aoi$BlF0";
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Generated password hash:', hash);
    return hash;
}

// Initialize password hash
let ADMIN_PASSWORD_HASH_FINAL = null;
generatePasswordHash().then(hash => {
    ADMIN_PASSWORD_HASH_FINAL = hash;
    console.log('Password hash initialized');
});

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
        return files.filter(file => file.endsWith('.html') && 
            !file.includes('login') && 
            !file.includes('dashboard') &&
            file !== 'index.html');
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

// Main website routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Explicitly serve index.html if requested
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve only allowed HTML files from root (excludes login/dashboard/index)
app.get('/:page.html', (req, res) => {
    const requestedFile = `${req.params.page}.html`;
    const allowedFiles = getHtmlFiles();
    if (!allowedFiles.includes(requestedFile)) {
        return res.status(404).end();
    }
    return res.sendFile(path.join(__dirname, requestedFile));
});

// Dashboard/Console routes
app.get('/console', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/console/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Serve dashboard static files
app.use('/console', express.static(path.join(__dirname, 'public')));

// Login endpoint
app.post('/console/login', async (req, res) => {
    const { password } = req.body;
    
    if (!ADMIN_PASSWORD_HASH_FINAL) {
        return res.status(500).json({ error: 'Server not ready' });
    }
    
    try {
        const isValid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH_FINAL);
        
        if (isValid) {
            // Generate random token
            const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
            activeTokens.add(token);
            
            res.json({ success: true, token });
        } else {
            res.status(401).json({ error: 'Invalid password' });
        }
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get products (protected)
app.get('/console/products', requireAuth, (req, res) => {
    const products = readProducts();
    res.json(products);
});

// Update products (protected)
app.post('/console/products', requireAuth, (req, res) => {
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

// Upload image endpoint (protected)
app.post('/console/upload-image', requireAuth, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        
        // Return the file path relative to the assets directory
        const relativePath = `/assets/uploads/${req.file.filename}`;
        res.json({ 
            success: true, 
            imageUrl: relativePath,
            filename: req.file.filename 
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Upload multiple images endpoint (protected)
app.post('/console/upload-multiple-images', requireAuth, upload.array('images', 10), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }
        
        const uploadedImages = req.files.map(file => ({
            imageUrl: `/assets/uploads/${file.filename}`,
            filename: file.filename
        }));
        
        res.json({ 
            success: true, 
            images: uploadedImages
        });
    } catch (error) {
        console.error('Multiple upload error:', error);
        res.status(500).json({ error: 'Upload failed' });
    }
});

// Get list of HTML files (protected)
app.get('/console/html-files', requireAuth, (req, res) => {
    const htmlFiles = getHtmlFiles();
    res.json({ files: htmlFiles });
});

// Get HTML file content (protected)
app.get('/console/html-content/:filename', requireAuth, (req, res) => {
    const { filename } = req.params;
    const content = readHtmlFile(filename);
    
    if (content === null) {
        return res.status(404).json({ error: 'File not found' });
    }
    
    res.json({ content, filename });
});

// Update HTML file content (protected)
app.post('/console/html-content/:filename', requireAuth, (req, res) => {
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
app.post('/console/logout', (req, res) => {
    const token = req.headers.authorization;
    if (token) {
        activeTokens.delete(token);
    }
    res.json({ success: true });
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
        }
    }
    console.error('Server error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server with automatic fallback if port is busy
function startServer(port, maxAttempts = 10, attempt = 1) {
    const server = app.listen(port, () => {
        console.log(`HEEMS website running on http://localhost:${port}`);
        console.log(`Dashboard available at http://localhost:${port}/console`);
        console.log(`Admin password: h^i^Aoi$BlF0`);
    });

    server.on('error', (error) => {
        if (error && error.code === 'EADDRINUSE' && attempt < maxAttempts) {
            const nextPort = port + 1;
            console.warn(`Port ${port} in use. Trying port ${nextPort}...`);
            startServer(nextPort, maxAttempts, attempt + 1);
        } else {
            console.error('Failed to start server:', error);
            process.exit(1);
        }
    });
}

startServer(PORT);