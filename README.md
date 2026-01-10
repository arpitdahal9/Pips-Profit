# Pips&Profit - Forex Trading Journal

A modern, feature-rich trading journal application for forex traders to track and analyze their trades.

## Prerequisites

- **Node.js** (version 18 or higher recommended)
  - Download from [nodejs.org](https://nodejs.org/)
  - This includes npm (Node Package Manager)

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

## Running the Application

### Development Mode

Start the development server:

```bash
npm run dev
```

The app will be available at:
- **Local:** http://localhost:3000
- **Network:** http://0.0.0.0:3000 (accessible from other devices on your network)

### Build for Production

Create an optimized production build:

```bash
npm run build
```

### Preview Production Build

Preview the production build locally:

```bash
npm run preview
```

## Web Deployment

This app is ready for deployment to any static hosting service. The build output is in the `dist` folder.

### Quick Deploy to Popular Platforms

#### Netlify

1. **Via Netlify CLI:**
   ```bash
   npm install -g netlify-cli
   npm run build
   netlify deploy --prod --dir=dist
   ```

2. **Via Git (Automatic):**
   - Connect your repository to Netlify
   - Build command: `npm run build`
   - Publish directory: `dist`
   - The `public/_redirects` file is automatically used for SPA routing

#### Vercel

1. **Via Vercel CLI:**
   ```bash
   npm install -g vercel
   npm run build
   vercel --prod
   ```

2. **Via Git (Automatic):**
   - Connect your repository to Vercel
   - The `vercel.json` configuration is automatically detected
   - Build command and output directory are configured

#### GitHub Pages

1. Install gh-pages: `npm install --save-dev gh-pages`
2. Add to `package.json`:
   ```json
   {
     "scripts": {
       "deploy": "npm run build && gh-pages -d dist"
     }
   }
   ```
3. Update `vite.config.ts` base to `'/your-repo-name/'`
4. Deploy: `npm run deploy`

#### Apache Server

1. Build the app: `npm run build`
2. Upload the contents of the `dist` folder to your server
3. The `.htaccess` file is automatically included for SPA routing
4. Ensure mod_rewrite is enabled on your Apache server

#### Custom Domain Setup

1. After deploying, configure your custom domain in your hosting platform
2. Add a CNAME record pointing to your hosting provider
3. SSL certificate is usually provided automatically (Let's Encrypt)
4. Wait for DNS propagation (can take up to 24-48 hours)

### Build Optimization

The build is optimized with:
- Code splitting for vendor libraries
- Minification and compression
- Optimized asset bundling
- HashRouter for static hosting compatibility

### Important Notes

- The app uses **HashRouter** which works perfectly for static hosting
- All data is stored in **localStorage** (client-side only)
- Capacitor features are automatically disabled on web
- The app works entirely offline after initial load

## Features

- 📊 **Dashboard** - View trading statistics and performance metrics
- 📝 **Trade Journal** - Log and manage your trades
- 📈 **Live Terminal** - Detailed trade analysis with TradingView charts
- 🎯 **Strategy Manager** - Create and manage trading strategies
- 🔐 **Secure Authentication** - PIN-based access protection
- 💾 **Data Persistence** - All data saved to browser localStorage

## First Time Setup

1. When you first open the app, you'll be prompted to:
   - Enter your name
   - Create a 6-digit PIN
2. After setup, use your PIN to access the app
3. Start logging trades from the Dashboard or Trade Journal

## Tech Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Navigation
- **Recharts** - Data visualization
- **Tailwind CSS** - Styling
- **TradingView Widgets** - Chart integration

## Project Structure

```
├── components/          # React components
│   ├── AuthScreen.tsx
│   ├── Dashboard.tsx
│   ├── TradeLog.tsx
│   ├── TrackingView.tsx
│   └── ...
├── context/            # React context providers
│   └── StoreContext.tsx
├── types.ts            # TypeScript type definitions
├── constants.ts        # Mock data and constants
└── App.tsx            # Main application component
```

## Troubleshooting

### Port Already in Use

If port 3000 is already in use, you can:
1. Stop the other application using port 3000
2. Or modify `vite.config.ts` to use a different port

### Dependencies Not Installing

If you encounter issues installing dependencies:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Browser Compatibility

This app works best in modern browsers:
- Chrome/Edge (recommended)
- Firefox
- Safari

## License

Private project - All rights reserved
