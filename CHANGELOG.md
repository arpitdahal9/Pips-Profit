# Day Trading Journal - Changelog

## Version 17.0 - Feature Requests, Trade Setup Analytics & Fixes

### 🎯 Major Features

#### 1. **Request a Feature (Formspree)** 💬
- **In-app Feature Requests**: Added a Request a Feature flow in Settings that submits to Formspree.
- **Simple UX**: A dedicated button at the end of Settings opens a modal with email (optional) and request details.

#### 2. **Trade Setup Analytics Dashboard** 📊
- **Dashboard-style Cards**: Trade Setup items now show analytics as cards (Trades, Win Rate, Max Drawdown, Max Win).
- **Expandable Checklist**: Checklist toggles with a clean plus/minus control.

### 🔧 Improvements

- **Community Contributors**: Added CoffeeFX to the top of the list.
- **Cleaner Accounts Screen**: Removed the unused “Earn +75 XP” badge when no account is configured.
- **Smoother Attachments**: Screenshot uploads now compress/resize before saving to prevent freezing.

### 🐛 Fixes

- **Account Creation Modal**: Fixed “Add Account First” modal so Create Account actually works.

---

## Version 16.0 - Multiple Trade Logging & Community Appreciation

### 🎯 Major Features

#### 1. **Unified Trade Entry Experience** ✨
- **Consistent Entry Form**: The multiple trade log entry form now matches the single trade wizard exactly, providing a seamless and familiar experience.
- **Streamlined UI**: Removed duplicate Time & Date fields from the entry form (they remain accessible in the header).
- **Cleaner Layout**: Removed duplicate "Add More Positions" button for a cleaner, more intuitive interface.

#### 2. **Enhanced Multiple Trade Logging** 📊
- **Flexible Position Management**: When adding multiple trades, you can now add additional positions with just Lot Size & P&L fields.
- **Quick Add Positions**: The "+ Add More Positions" button allows you to quickly add more trade entries without duplicating all fields.
- **Skip Option**: Added "Skip remaining & Save Trade" button in the details step, allowing you to save trades without completing all detail steps (strategy, session, emotions, etc.).

#### 3. **Community Appreciation** ❤️
- **New Section in Profile**: Added "Thanks for Community Feedback" section at the bottom of the Profile tab in Settings.
- **Community Contributors**: Tap the section to view a modal showcasing our Reddit community contributors who helped improve the app:
  - Even_Competition2461
  - Mysterious_Drag_519
  - Few-Pepper858
  - Peppie79
- **Easy Access**: The modal can be closed using the X button in the header.

### 🔧 Improvements

- **Better UX Flow**: The multiple trade wizard now provides a more intuitive workflow with the ability to skip optional detail steps.
- **Consistent Design**: Both single and multiple trade entry forms now share the same design language and field structure.
- **Reduced Clutter**: Removed redundant UI elements to create a cleaner, more focused trading experience.

### 📝 Technical Notes

- Multiple trade entries now share common data (symbol, direction, date, time, account) while allowing individual Lot Size & P&L for each position.
- The "Skip remaining & Save Trade" feature saves trades with default values for any skipped detail steps.
- Community appreciation section is integrated into the Profile settings for easy discovery.

---

## Previous Versions

### Version 15.0 - Trade Setup Manager & Flexible Trade Logging

#### 1. **Trade Setup Manager** 📊
- **Dedicated Tab**: "Strategies" has been renamed to "Trade Setup" and moved to its own dedicated tab in the sidebar.
- **Advanced Analytics**: The new "Trade Setup Manager" page provides a comprehensive view of your strategies, including:
  - Strategy Name
  - Collapsible Checklist of trade setup items
  - Performance table: Trades, Win Rate, P&L, Risk:Reward
- **Dashboard Overview**: The Dashboard now features a "Trade Setup Analytics" section, replacing "Predict the Chart", showing a quick overview of your top strategies (name, trades, win rate).
- **Create/Edit/Delete**: Full CRUD functionality for your trading strategies and their checklist items.

#### 2. **Flexible Trade Logging** ➕
- **New Trade Type Selector**: When you click the '+' button to add a new trade, a small popup now appears, giving you two options:
  - **"Add a single trade log"**: Opens the familiar single trade entry wizard.
  - **"Add Multiple Trade log"**: Opens a new, streamlined interface for logging multiple trade entries at once.
- **Multiple Trade Log Interface**: This new wizard allows you to quickly add several trade entries with common details (Symbol, Direction, Date, Time, Account) and individual fields for:
  - Lot Size
  - P&L
  - Take Profit (TP)
  - Stop Loss (SL)
- **Dynamic Entry Rows**: Easily add or remove individual trade entry rows as needed.

#### 3. **UI/UX Improvements** 🎨
- **Journal FAB Position**: The floating action button (FAB) on the Journal tab has been adjusted to sit slightly higher, preventing it from being cut off on some devices.
- **Custom Time Input**: The time input field in the trade wizard no longer displays a clock icon. It now features custom auto-formatting (HH:MM) and validation for a cleaner, more consistent experience.
- **Trade Setup Page Formatting**: The "Trade Setup Manager" page has been refined to match the consistent styling and spacing of other sections in the app.

---

## How to Use New Features

### Adding Multiple Trades
1. Tap the '+' button on the Dashboard or Journal tab.
2. Select "Add Multiple Trade log" from the popup.
3. Fill in the common details (Symbol, Direction, Date, Time, Account).
4. Enter Lot Size and P&L for the first trade.
5. Tap "Add More Positions" to add additional trades with individual Lot Size & P&L.
6. Proceed through the detail steps or use "Skip remaining & Save Trade" to save quickly.

### Viewing Community Contributors
1. Go to Settings → Profile tab.
2. Scroll to the bottom to find "Thanks for Community Feedback".
3. Tap to view the list of contributors.
4. Close the modal using the X button.

---

*Thank you for using Day Trading Journal! Your feedback helps us improve the app.*
