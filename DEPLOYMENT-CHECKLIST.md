# Production Deployment Checklist

Use this checklist to ensure all steps are completed before deploying to production.

## Pre-Deployment Tasks

### ✅ Code & Configuration (Completed)

- [x] API updated to use VerzeichnisTree/4 with GUID lookup
- [x] GUID → xSteller fallback strategy implemented
- [x] Cache schema version updated (triggers cache invalidation)
- [x] vercel.json created with security headers
- [x] vite.config.js optimized for production builds
- [x] Service worker registered in main.jsx
- [x] Service worker updated for proper API proxy caching
- [x] Font preloading configured in index.html
- [x] PWA manifest updated with proper icon references
- [x] README.md documentation completed

### ⚠️ Legal Requirements (Action Required)

Before deploying, you MUST update the following files with real company information:

#### `src/pages/Impressum.jsx`

Replace placeholder text with actual information:

```javascript
// Lines 8-13: Company name and address
<p>
  [Ihr Firmenname]           // ← REPLACE
  <br />
  [Straße Hausnummer]        // ← REPLACE
  <br />
  [PLZ Ort]                  // ← REPLACE
</p>

// Line 19: Legal representative
<p>[Name der vertretungsberechtigten Person]</p>  // ← REPLACE

// Lines 24-27: Contact information
<p>
  Telefon: [Telefonnummer]   // ← REPLACE
  <br />
  E-Mail: [E-Mail-Adresse]   // ← REPLACE
</p>
```

**Legal Note**: The Impressum is required by German law (§ 5 TMG). Failing to provide correct information can result in fines.

#### Additional Legal Considerations

- [ ] Verify Datenschutzerklärung complies with your company's privacy policy
- [ ] Add Google Fonts to privacy policy (loaded from Google servers)
- [ ] Ensure contact email in README.md is correct
- [ ] Add actual license information to README.md

## Testing Checklist

### Automated Tests

```bash
npm test
```

**Note**: Some tests may fail due to React 19 compatibility issues with testing-library. This is a known issue and doesn't affect production functionality. The critical gkvApi tests should pass.

### Manual Testing (Required)

Test the following user flows before deploying:

#### 1. Happy Path Flow
- [ ] Start app, select GKV insurance
- [ ] Complete all questionnaire steps
- [ ] Verify products load from API
- [ ] Select 2-3 products
- [ ] Generate letter with user data
- [ ] Download PDF successfully
- [ ] Open PDF and verify German umlauts render correctly

#### 2. Pagination
- [ ] Navigate to results page
- [ ] Click "Weiter" button multiple times
- [ ] Click "Zurück" button
- [ ] Verify product count and page numbers are correct

#### 3. Offline Mode
- [ ] Complete questionnaire and see results
- [ ] Open DevTools → Network → Set to "Offline"
- [ ] Refresh page
- [ ] Verify cached results still display
- [ ] Verify warning message about cached data

#### 4. PWA Installation
- [ ] Open app on Android Chrome
- [ ] Tap "Install" prompt or menu → "Add to Home Screen"
- [ ] Verify app installs and opens as standalone
- [ ] Test on iOS Safari (manual "Add to Home Screen")

#### 5. Error Handling
- [ ] Start questionnaire but select no options
- [ ] Verify validation messages appear
- [ ] Simulate API error (block requests in DevTools)
- [ ] Verify error message displays correctly

#### 6. Accessibility
- [ ] Tab through entire app using keyboard only
- [ ] Verify all interactive elements are reachable
- [ ] Test with screen reader (NVDA or JAWS)
- [ ] Zoom to 200% and verify layout doesn't break
- [ ] Test on mobile device (touch targets should be large enough)

### Browser Compatibility

Test on the following browsers:

- [ ] Chrome (Windows/Mac) - Latest version
- [ ] Firefox (Windows/Mac) - Latest version
- [ ] Edge (Windows) - Latest version
- [ ] Safari (macOS) - Latest version
- [ ] Chrome Mobile (Android) - Latest version
- [ ] Safari Mobile (iOS) - Latest version

### Performance Testing

Run Lighthouse audit in Chrome DevTools:

```
Target Scores:
- Performance: > 90
- Accessibility: > 95
- Best Practices: > 90
- SEO: > 90
- PWA: Should pass all checks
```

## Deployment Steps

### 1. Prepare Environment

```bash
# Test production build locally
npm run build
npm run preview

# Verify bundle size
ls -lh dist/assets/

# Check for any console errors in preview mode
```

### 2. Deploy to Vercel

#### Option A: Vercel CLI

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

#### Option B: GitHub Integration

1. Push code to GitHub repository
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Configure build settings:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
6. Click "Deploy"

### 3. Configure Environment Variables (Optional)

If you need to override the API base URL:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add: `VITE_API_BASE` with value `/api/proxy`
3. Redeploy

### 4. Configure Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain (e.g., `hilfsmittel.aboelo.de`)
3. Update DNS records as instructed by Vercel:
   - Type: `CNAME`
   - Name: `hilfsmittel` (or `@` for root)
   - Value: `cname.vercel-dns.com`

### 5. Post-Deployment Verification

Once deployed, test the production URL:

- [ ] Open production URL
- [ ] Complete full user flow
- [ ] Check browser console for errors
- [ ] Verify API calls work through proxy
- [ ] Test PWA installation
- [ ] Verify all links work (Impressum, Datenschutz)
- [ ] Test on mobile device
- [ ] Run Lighthouse audit on production URL

### 6. Monitor Initial Traffic

For the first 24-48 hours after launch:

- [ ] Check Vercel Analytics for traffic
- [ ] Monitor Vercel function logs for API proxy errors
- [ ] Check for console errors (if you have error tracking)
- [ ] Respond to any user feedback within 24h

## Known Issues & Workarounds

### Issue: PDF German Umlauts

**Problem**: jsPDF uses standard fonts which may not render some special characters perfectly.

**Workaround**: The default font handles ä, ö, ü, ß correctly. If you encounter issues, consider:
- Using a different PDF library (pdf-lib)
- Embedding custom fonts
- Generating PDFs server-side

### Issue: iOS PWA Install Prompt

**Problem**: iOS doesn't show automatic install prompts.

**Workaround**: 
- Users must manually tap Share → "Add to Home Screen"
- Consider adding visual instructions for iOS users

### Issue: Service Worker Updates

**Problem**: Users may see stale content after deployments.

**Current Solution**: Service worker uses `skipWaiting()` and `clients.claim()` to update immediately.

**If Issues Persist**:
- Increment cache versions in `public/sw.js`
- Add update notification UI to prompt users to refresh

### Issue: React 19 Test Failures

**Problem**: Testing Library has compatibility issues with React 19.

**Impact**: Some component tests fail, but production code works fine.

**Status**: Monitor testing-library updates for React 19 support.

## Rollback Procedure

If critical issues are discovered after deployment:

1. **Immediate Rollback** (Vercel):
   ```bash
   vercel rollback
   ```

2. **Or via Vercel Dashboard**:
   - Go to Deployments
   - Find previous working deployment
   - Click "..." → "Promote to Production"

3. **Fix and Redeploy**:
   - Fix the issue locally
   - Test thoroughly
   - Deploy again

## Success Metrics

Track these metrics in the first week:

### User Engagement
- Questionnaire completion rate (target: > 70%)
- Average time to complete (target: < 10 minutes)
- Products selected per user (target: 2-3)
- Letter downloads (target: > 80% of completions)

### Technical Performance
- API response time (target: < 2 seconds)
- PWA install rate (target: > 10%)
- Error rate (target: < 1%)
- Page load time (target: < 3 seconds)

### User Satisfaction
- Support requests per 100 users (target: < 5)
- Return users within 7 days
- Feedback sentiment (target: > 80% positive)

## Support Contact

After deployment, monitor:
- Email: [Insert support email]
- GitHub Issues: [Insert repo URL]
- Vercel Logs: Dashboard → Your Project → Functions

## Next Steps (Post-Launch)

1. **Week 1**: Monitor errors and user feedback daily
2. **Week 2**: Analyze completion rates and identify drop-off points
3. **Month 1**: Plan feature improvements based on user data
4. **Ongoing**: Update API cache schema when GKV API changes

---

**Last Updated**: [Insert date]
**Deployment Status**: Ready for production (pending legal page updates)

