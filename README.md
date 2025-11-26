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
