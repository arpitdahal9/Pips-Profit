# Icon Update Instructions

## Favicon (Web)
✅ **Completed**: Created `favicon.svg` with a candlestick and notebook icon design. The favicon is now linked in `index.html`.

## Android Launcher Icons

The Android launcher icons need to be generated as PNG files in multiple sizes. The vector drawable has been updated (`ic_launcher_foreground.xml`), but you'll need to generate PNG versions for each density.

### Required Sizes:
- **mipmap-mdpi**: 48x48 px
- **mipmap-hdpi**: 72x72 px
- **mipmap-xhdpi**: 96x96 px
- **mipmap-xxhdpi**: 144x144 px
- **mipmap-xxxhdpi**: 192x192 px

### How to Generate Icons:

1. **Using Android Studio:**
   - Right-click on `res` folder → New → Image Asset
   - Select "Launcher Icons (Adaptive and Legacy)"
   - Choose "Foreground Layer" → Image
   - Upload or use the vector drawable
   - Set background color to `#8b5cf6` (purple)
   - Generate all sizes

2. **Using Online Tools:**
   - Use [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html)
   - Upload the `favicon.svg` or create a 512x512px PNG version
   - Set background color to `#8b5cf6`
   - Download and extract to respective mipmap folders

3. **Using Command Line (ImageMagick):**
   ```bash
   # Convert SVG to PNG at different sizes
   convert favicon.svg -resize 48x48 mipmap-mdpi/ic_launcher_foreground.png
   convert favicon.svg -resize 72x72 mipmap-hdpi/ic_launcher_foreground.png
   convert favicon.svg -resize 96x96 mipmap-xhdpi/ic_launcher_foreground.png
   convert favicon.svg -resize 144x144 mipmap-xxhdpi/ic_launcher_foreground.png
   convert favicon.svg -resize 192x192 mipmap-xxxhdpi/ic_launcher_foreground.png
   ```

### Files to Update:
- `android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png`
- `android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png`
- `android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png`
- `android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png`
- `android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png`
- `android/app/src/main/res/mipmap-*/ic_launcher.png` (full icon with background)
- `android/app/src/main/res/mipmap-*/ic_launcher_round.png` (round version)

## Splash Screen
✅ **Completed**: Updated `splash.xml` to show the candlestick icon on a dark background. The splash screen will display the icon when the app launches.

## Current Status:
- ✅ Web favicon (SVG) created and linked
- ✅ Android vector drawable updated
- ✅ Splash screen updated with icon
- ⚠️ PNG launcher icons need to be generated (see instructions above)

