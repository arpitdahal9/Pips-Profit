# Web Deployment Guide

This guide will help you deploy the Day Trading Journal app to your custom domain.

## Prerequisites

- Node.js 18+ installed
- A hosting provider account (Netlify, Vercel, GitHub Pages, or custom server)
- A custom domain (optional, but recommended)

## Build the Application

First, ensure all dependencies are installed:

```bash
npm install
```

Then build the application for production:

```bash
npm run build
```

This creates an optimized production build in the `dist` folder.

## Deployment Options

### Option 1: Netlify (Recommended for Easy Setup)

1. **Install Netlify CLI** (optional):
   ```bash
   npm install -g netlify-cli
   ```

2. **Deploy via CLI**:
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

3. **Deploy via Git** (Recommended):
   - Push your code to GitHub/GitLab/Bitbucket
   - Go to [Netlify](https://www.netlify.com/)
   - Click "New site from Git"
   - Connect your repository
   - Configure build settings:
     - **Build command:** `npm run build`
     - **Publish directory:** `dist`
   - Click "Deploy site"

4. **Configure Custom Domain**:
   - In Netlify dashboard, go to Site settings → Domain management
   - Click "Add custom domain"
   - Enter your domain name
   - Follow DNS configuration instructions
   - SSL certificate is automatically provisioned

### Option 2: Vercel (Great Performance)

1. **Install Vercel CLI** (optional):
   ```bash
   npm install -g vercel
   ```

2. **Deploy via CLI**:
   ```bash
   npm run build
   vercel --prod
   ```

3. **Deploy via Git** (Recommended):
   - Push your code to GitHub/GitLab/Bitbucket
   - Go to [Vercel](https://vercel.com/)
   - Click "Import Project"
   - Connect your repository
   - Vercel automatically detects the `vercel.json` configuration
   - Click "Deploy"

4. **Configure Custom Domain**:
   - In Vercel dashboard, go to Project Settings → Domains
   - Click "Add Domain"
   - Enter your domain name
   - Follow DNS configuration instructions
   - SSL certificate is automatically provisioned

### Option 3: GitHub Pages

1. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Update `package.json`**:
   Add this script (replace `your-username` and `repo-name`):
   ```json
   {
     "scripts": {
       "deploy": "npm run build && gh-pages -d dist"
     }
   }
   ```

3. **Update `vite.config.ts`**:
   Change the `base` option to your repository path:
   ```typescript
   base: '/your-repo-name/',
   ```

4. **Deploy**:
   ```bash
   npm run deploy
   ```

5. **Configure Custom Domain**:
   - Create a file named `CNAME` in the `public` folder
   - Add your domain name inside: `yourdomain.com`
   - The file will be copied to dist during build
   - Configure DNS with GitHub Pages instructions

### Option 4: Apache Server (Traditional Hosting)

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Upload to server**:
   - Upload all contents of the `dist` folder to your web server
   - Use FTP, SFTP, or your hosting provider's file manager

3. **Configure .htaccess**:
   - The `.htaccess` file is automatically included in the build
   - Ensure mod_rewrite is enabled on your Apache server
   - If not included, manually add the `.htaccess` file to your server root

4. **Configure DNS**:
   - Point your domain's A record or CNAME to your server IP/hostname
   - Set up SSL certificate (Let's Encrypt recommended)

5. **Test**:
   - Visit your domain in a browser
   - The app should load correctly

### Option 5: Nginx Server

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Upload to server**:
   - Upload all contents of the `dist` folder to your server (e.g., `/var/www/yourdomain.com`)

3. **Configure Nginx**:
   Create or update your Nginx configuration file:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com www.yourdomain.com;
       root /var/www/yourdomain.com;
       index index.html;

       # Handle client-side routing (HashRouter)
       location / {
           try_files $uri $uri/ /index.html;
       }

       # Cache static assets
       location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
           expires 1y;
           add_header Cache-Control "public, immutable";
       }

       # Security headers
       add_header X-Frame-Options "SAMEORIGIN" always;
       add_header X-Content-Type-Options "nosniff" always;
       add_header X-XSS-Protection "1; mode=block" always;
   }
   ```

4. **Enable HTTPS** (Let's Encrypt):
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

5. **Reload Nginx**:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

## Custom Domain Setup

### DNS Configuration

Regardless of your hosting provider, you'll need to configure DNS:

1. **A Record** (Point to IP):
   ```
   Type: A
   Name: @ (or yourdomain.com)
   Value: Your server IP address
   TTL: 3600 (or default)
   ```

2. **CNAME** (Point to hostname - for services like Netlify/Vercel):
   ```
   Type: CNAME
   Name: @ (or www)
   Value: your-app.netlify.app (or vercel.app URL)
   TTL: 3600 (or default)
   ```

3. **WWW Subdomain** (if needed):
   ```
   Type: CNAME
   Name: www
   Value: yourdomain.com
   TTL: 3600
   ```

### SSL Certificate

Most modern hosting platforms automatically provision SSL certificates:
- **Netlify**: Automatic via Let's Encrypt
- **Vercel**: Automatic via Let's Encrypt
- **GitHub Pages**: Automatic via Let's Encrypt
- **Custom Server**: Use Let's Encrypt/Certbot

## Post-Deployment Checklist

- [ ] Test the app loads at your domain
- [ ] Verify SSL certificate is active (HTTPS)
- [ ] Test all routes work correctly (HashRouter)
- [ ] Check that localStorage works (data persists)
- [ ] Test on mobile devices
- [ ] Verify analytics/tracking (if applicable)
- [ ] Test export/import functionality
- [ ] Check performance (use Lighthouse)

## Troubleshooting

### Routes Not Working (404 Errors)

- **Solution**: Ensure SPA routing configuration is correct:
  - Netlify: `_redirects` file should be in `public/`
  - Vercel: `vercel.json` should be in root
  - Apache: `.htaccess` should be in `public/`
  - Nginx: Configuration should include `try_files`

### Assets Not Loading

- **Solution**: Check that `base` in `vite.config.ts` matches your deployment path:
  - Root domain: `base: '/'`
  - Subdirectory: `base: '/subdirectory/'`

### Build Errors

- **Solution**: Ensure all dependencies are installed:
  ```bash
  rm -rf node_modules package-lock.json
  npm install
  npm run build
  ```

### Performance Issues

- **Solution**: 
  - Enable compression on your server
  - Verify build optimization is working (check dist folder size)
  - Use CDN for static assets (most hosting platforms provide this)

## Environment Variables

If you need environment variables (e.g., for Firebase), create a `.env` file:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-auth-domain
```

Then access them in your code as `import.meta.env.VITE_FIREBASE_API_KEY`.

## Continuous Deployment

For automatic deployments on code push:

1. **Netlify/Vercel**: Connect your Git repository and enable auto-deploy
2. **GitHub Pages**: Enable GitHub Actions in repository settings
3. **Custom Server**: Set up a CI/CD pipeline (GitHub Actions, GitLab CI, etc.)

## Support

For issues specific to deployment, check:
- Hosting provider documentation
- Vite deployment guide: https://vitejs.dev/guide/static-deploy.html
- React Router documentation: https://reactrouter.com/
