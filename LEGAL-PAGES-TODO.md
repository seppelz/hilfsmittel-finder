# Legal Pages - Company Information Required

⚠️ **IMPORTANT**: Before deploying to production, you MUST update the Impressum page with real company information.

## Required Updates

### File: `src/pages/Impressum.jsx`

The following placeholders must be replaced with actual company information:

#### Line 8-14: Company Name and Address
```javascript
<p>
  [Ihr Firmenname]           // ← REPLACE with your company name
  <br />
  [Straße Hausnummer]        // ← REPLACE with street and house number
  <br />
  [PLZ Ort]                  // ← REPLACE with postal code and city
</p>
```

**Example**:
```javascript
<p>
  Aboelo GmbH
  <br />
  Musterstraße 123
  <br />
  10115 Berlin
</p>
```

#### Line 19: Legal Representative
```javascript
<p>[Name der vertretungsberechtigten Person]</p>  // ← REPLACE with CEO/Managing Director name
```

**Example**:
```javascript
<p>Max Mustermann</p>
```

#### Line 24-27: Contact Information
```javascript
<p>
  Telefon: [Telefonnummer]   // ← REPLACE with phone number
  <br />
  E-Mail: [E-Mail-Adresse]   // ← REPLACE with email address
</p>
```

**Example**:
```javascript
<p>
  Telefon: +49 30 12345678
  <br />
  E-Mail: kontakt@aboelo.de
</p>
```

## Legal Requirements (Germany)

### Why is this required?

The **Impressum** (legal notice) is mandatory for all German commercial websites according to:
- **§ 5 TMG (Telemediengesetz)** - German Telemedia Act
- **§ 55 RStV (Rundfunkstaatsvertrag)** - German Interstate Broadcasting Agreement

### What information is required?

For a **GmbH (Limited Liability Company)**:
1. Company name
2. Legal form (e.g., "GmbH")
3. Full address
4. Managing directors (Geschäftsführer)
5. Contact details (phone, email)
6. Commercial register number (Handelsregisternummer)
7. VAT ID (if applicable)

### Penalties for Non-Compliance

Missing or incorrect Impressum information can result in:
- Fines up to €50,000
- Cease and desist letters (Abmahnungen)
- Legal action by competitors or consumer protection agencies

## Additional Legal Considerations

### 1. Privacy Policy (Datenschutzerklärung)

The current privacy policy in `src/pages/Datenschutz.jsx` is generic and should be reviewed by legal counsel to ensure it covers:

- ✅ Local storage usage (already covered)
- ✅ No server-side data storage (already covered)
- ✅ External API usage - GKV Spitzenverband (already covered)
- ⚠️ **Google Fonts** - Add information about loading fonts from Google servers
- ⚠️ **Vercel Hosting** - May need to mention hosting provider

### 2. Google Fonts GDPR Compliance

Since the app loads fonts from Google Fonts (see `index.html`), you should add this to the privacy policy:

```
### Schriftarten (Google Fonts)

Diese Website nutzt Google Fonts zur Darstellung von Schriftarten. Google Fonts ist ein Dienst der Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA.

Beim Aufruf dieser Website werden Schriftarten von Google-Servern geladen. Dabei wird Ihre IP-Adresse an Google übertragen.

Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einheitlicher Darstellung).

Weitere Informationen: https://policies.google.com/privacy
```

### 3. Cookie Consent

Currently, the app uses:
- ✅ No cookies
- ✅ Only localStorage (no consent required in Germany)

If you add analytics (Google Analytics, Matomo, etc.) in the future, you MUST implement a cookie consent banner.

## How to Update

1. Open `src/pages/Impressum.jsx` in your editor
2. Replace all placeholders with actual information
3. Save the file
4. Rebuild and redeploy:
   ```bash
   npm run build
   vercel --prod
   ```

## Testing Checklist

After updating, verify:

- [ ] All placeholders removed
- [ ] Information is accurate and up-to-date
- [ ] Phone number and email work
- [ ] Page displays correctly on mobile
- [ ] Links to Impressum work from all pages (header, footer)

## Resources

- **TMG Full Text**: https://www.gesetze-im-internet.de/tmg/
- **Impressum Generator**: https://www.e-recht24.de/impressum-generator.html
- **DSGVO Information**: https://www.datenschutz.org/

## Need Help?

Consult with:
- Your company's legal department
- A lawyer specializing in internet law (Medienrecht)
- German Chamber of Commerce (IHK)

---

**Status**: ❌ NOT READY FOR PRODUCTION  
**Blocker**: Impressum contains placeholders  
**Next Step**: Update Impressum with real company information

