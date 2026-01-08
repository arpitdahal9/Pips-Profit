# How to Update App Icon and Splash Screen

## Method 1: Using Android Studio Image Asset Studio (Recommended)

### For App Icon (Launcher Icon):

1. **Open Android Studio**
   - Open your project in Android Studio
   - Navigate to the `android` folder in the project

2. **Open Image Asset Studio**
   - In the Project view, right-click on `android/app/src/main/res`
   - Select **New** → **Image Asset**
   - Or go to **File** → **New** → **Image Asset**

3. **Configure the Icon**
   - In the **Asset Studio** window:
     - **Icon Type**: Select "Launcher Icons (Adaptive and Legacy)"
     - **Name**: Keep as `ic_launcher` (or your preferred name)
     - **Foreground Layer**:
       - Select **Image** tab
       - Click the folder icon to browse and select your icon image
       - Recommended size: **512x512 px** or larger (square image)
       - Adjust scaling/positioning as needed
     - **Background Layer**:
       - Select **Color** tab
       - Set color to `#8b5cf6` (your brand purple) or choose a solid color
       - Or select **Image** if you want a background image
     - **Legacy Icon**: Check this to generate old-style icons too

4. **Preview and Generate**
   - Check the preview on the right side
   - Click **Next**
   - Review the files that will be generated
   - Click **Finish**

5. **Files Generated**
   - The tool will automatically create icons in all required sizes:
     - `mipmap-mdpi/ic_launcher.png` (48x48)
     - `mipmap-hdpi/ic_launcher.png` (72x72)
     - `mipmap-xhdpi/ic_launcher.png` (96x96)
     - `mipmap-xxhdpi/ic_launcher.png` (144x144)
     - `mipmap-xxxhdpi/ic_launcher.png` (192x192)
     - And round versions: `ic_launcher_round.png`
     - Foreground: `ic_launcher_foreground.png` (vector and PNG versions)

### For Splash Screen:

1. **Prepare Your Splash Image**
   - Create a splash screen image
   - Recommended size: **1080x1920 px** (portrait) or **1920x1080 px** (landscape)
   - Or use a square image: **1024x1024 px**
   - Format: PNG with transparency (if needed)

2. **Update Splash Screen Drawable**
   - Option A: Replace the vector drawable
     - Go to `android/app/src/main/res/drawable/splash_icon.xml`
     - You can edit this XML file directly, or
     - Replace it with a bitmap reference
   
   - Option B: Use a bitmap image
     - Place your splash image in `android/app/src/main/res/drawable/` as `splash_image.png`
     - Update `splash.xml`:
     ```xml
     <?xml version="1.0" encoding="utf-8"?>
     <layer-list xmlns:android="http://schemas.android.com/apk/res/android">
         <!-- Background color -->
         <item>
             <shape android:shape="rectangle">
                 <solid android:color="#0f172a" />
             </shape>
         </item>
         
         <!-- Splash image in center -->
         <item android:drawable="@drawable/splash_image" android:gravity="center" />
     </layer-list>
     ```

3. **For Different Screen Densities (Optional)**
   - Create different sizes for different screen densities:
     - `drawable-mdpi/splash_image.png` (320x480)
     - `drawable-hdpi/splash_image.png` (480x800)
     - `drawable-xhdpi/splash_image.png` (720x1280)
     - `drawable-xxhdpi/splash_image.png` (1080x1920)
     - `drawable-xxxhdpi/splash_image.png` (1440x2560)

## Method 2: Manual File Replacement

### For App Icon:

1. **Prepare Your Icons**
   - Create your icon in these sizes:
     - 48x48 px (mdpi)
     - 72x72 px (hdpi)
     - 96x96 px (xhdpi)
     - 144x144 px (xxhdpi)
     - 192x192 px (xxxhdpi)

2. **Replace Files**
   - Navigate to `android/app/src/main/res/`
   - Replace the PNG files in each `mipmap-*` folder:
     - `mipmap-mdpi/ic_launcher.png`
     - `mipmap-mdpi/ic_launcher_round.png`
     - `mipmap-mdpi/ic_launcher_foreground.png`
     - Repeat for hdpi, xhdpi, xxhdpi, xxxhdpi

3. **Update Vector Drawable (Optional)**
   - Edit `drawable-v24/ic_launcher_foreground.xml` if you want a vector version

### For Splash Screen:

1. **Replace Splash Images**
   - Place your splash images in:
     - `drawable-port-mdpi/splash.png`
     - `drawable-port-hdpi/splash.png`
     - `drawable-port-xhdpi/splash.png`
     - `drawable-port-xxhdpi/splash.png`
     - `drawable-port-xxxhdpi/splash.png`
   - And landscape versions in `drawable-land-*` folders

2. **Or Update splash.xml**
   - Edit `drawable/splash.xml` to reference your new image

## Method 3: Using Online Tools

1. **Android Asset Studio (Online)**
   - Go to: https://romannurik.github.io/AndroidAssetStudio/icons-launcher.html
   - Upload your icon image (512x512 px recommended)
   - Configure colors and settings
   - Download the generated zip
   - Extract and copy files to `android/app/src/main/res/`

2. **Favicon.io or Similar Tools**
   - Use online tools to generate Android icons
   - Download and manually place in the correct folders

## After Updating Icons:

1. **Clean Build**
   - In Android Studio: **Build** → **Clean Project**
   - Then: **Build** → **Rebuild Project**

2. **Sync with Capacitor (if using)**
   ```bash
   npx cap sync android
   ```

3. **Test on Device/Emulator**
   - Uninstall the old app first (if testing)
   - Install the new build
   - Check the launcher icon
   - Check the splash screen on app launch

## Quick Reference - File Locations:

### App Icons:
- `android/app/src/main/res/mipmap-*/ic_launcher.png`
- `android/app/src/main/res/mipmap-*/ic_launcher_round.png`
- `android/app/src/main/res/mipmap-*/ic_launcher_foreground.png`
- `android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml` (vector)
- `android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml` (adaptive icon config)

### Splash Screen:
- `android/app/src/main/res/drawable/splash.xml` (main splash config)
- `android/app/src/main/res/drawable/splash_icon.xml` (splash icon vector)
- `android/app/src/main/res/drawable-port-*/splash.png` (portrait images)
- `android/app/src/main/res/drawable-land-*/splash.png` (landscape images)

## Tips:

1. **Icon Best Practices:**
   - Use simple, recognizable designs
   - Ensure it looks good at small sizes (48x48)
   - Test on different backgrounds
   - Use high contrast colors
   - Keep important elements in the center (safe zone)

2. **Splash Screen Best Practices:**
   - Keep it simple and fast-loading
   - Use your app's brand colors
   - Don't include too much detail
   - Match your app's theme
   - Consider animation (advanced)

3. **Testing:**
   - Always test on a real device
   - Check different Android versions
   - Test on different screen sizes
   - Verify both light and dark themes (if applicable)

