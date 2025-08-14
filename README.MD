# HEEMS Product Dashboard

A minimal web dashboard to manage the `data/dress.json` file with password-protected access.

## Features

- 🔐 **Password Protection**: Simple authentication with hardcoded password
- 📝 **Full CRUD Operations**: Add, edit, delete, and view all products
- 💾 **Real-time Updates**: Changes are saved directly to `data/dress.json`
- 📱 **Responsive Design**: Works on desktop and mobile devices
- 🔄 **Session Management**: Token-based authentication with automatic logout

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Server
```bash
npm start
```

### 3. Access the Dashboard
- Open your browser and go to `http://localhost:3000`
- You'll be redirected to the login page
- Use the password: **`admin123`**

## File Structure

```
├── server.js              # Express server with authentication
├── package.json           # Node.js dependencies
├── data/
│   └── dress.json        # Your product data (must exist)
└── public/
    ├── login.html         # Login page
    ├── dashboard.html     # Product management dashboard
    └── style.css          # Styling for all pages
```

## API Endpoints

- `POST /login` - Authenticate with password
- `GET /products` - Get all products (requires auth)
- `POST /products` - Update products (requires auth)
- `POST /logout` - Logout and invalidate token

## Security Features

- **Password Protection**: Hardcoded password `admin123`
- **Token Authentication**: Random tokens generated on login
- **Session Management**: Tokens stored in memory (cleared on server restart)
- **Route Protection**: All product routes require valid authentication

## Usage

1. **Login**: Enter the password `admin123`
2. **View Products**: See all products in an editable table
3. **Add Products**: Click "Add New Product" to create new entries
4. **Edit Products**: Modify any field in the table
5. **Delete Products**: Click "Delete" button on any row to remove products
6. **Save Changes**: Click "Save Changes" to update the JSON file
7. **Logout**: Click "Logout" when finished

## Customization

### Change Password
Edit `server.js` and modify the `ADMIN_PASSWORD` constant:
```javascript
const ADMIN_PASSWORD = 'your-new-password';
```

### Change Port
Edit `server.js` and modify the `PORT` constant:
```javascript
const PORT = 3001; // or any port you prefer
```

## Troubleshooting

### "Cannot find module 'express'"
Run `npm install` to install dependencies.

### "Error reading products"
Make sure `data/dress.json` exists and contains valid JSON.

### "Unauthorized" errors
Your session may have expired. Try logging in again.

### Port already in use
Change the port in `server.js` or stop the service using port 3000.

## Development

For development with auto-restart, you can use:
```bash
npm install -g nodemon
nodemon server.js
```

## Notes

- This is a simple implementation for development/testing purposes
- Tokens are stored in memory and will be lost on server restart
- The dashboard directly modifies your `dress.json` file
- Always backup your data before making changes
- For production use, consider implementing proper user management and database storage
