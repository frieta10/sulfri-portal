# Open Badges 3.0 Import Guide

## What is Open Badges 3.0?

Open Badges 3.0 (OB3) is the latest version of the Open Badges specification that uses JSON-LD format and Verifiable Credentials standards. It's a modern, standardized way to represent and exchange digital credentials.

**Key Benefits:**
- ✅ Standardized format (works across platforms)
- ✅ No OAuth setup required
- ✅ No API credentials needed
- ✅ Supports bulk import
- ✅ Future-proof standard

---

## How to Export from Credly

### Method 1: Individual Badge Export

1. **Go to your Credly profile**
   - Visit: `https://www.credly.com/users/YOUR_USERNAME/badges`

2. **Click on a badge**
   - Select the badge you want to export

3. **Find the download/export option**
   - Look for "Download" or "Export" button
   - Select "Open Badges 3.0" format

4. **Copy the JSON content**
   - The badge will be exported as a JSON file
   - Copy the entire JSON content

### Method 2: Bulk Export (if available)

Some Credly features may allow exporting all badges at once as a JSON array.

---

## How to Import to Your Portal

1. **Go to Admin Badges Page**
   - Navigate to: `/admin/badges`

2. **Click "Import OB3" Tab**
   - This is a new tab alongside "Manual" and "From Embed Code"

3. **Paste the JSON**
   - Copy your OB3 JSON content from Credly
   - Paste it into the text area

4. **Validate**
   - Click "Validate" to check the format
   - System will show how many badges were found

5. **Import**
   - Click "Import Badges" to add them to your database
   - Badges will be created with:
     - Title from OB3 `achievement.name`
     - Description from OB3 `achievement.description`
     - Issuer from OB3 `issuer.name`
     - Issue date from OB3 `validFrom`
     - Expiry date from OB3 `validUntil` (if present)
     - Image URL from OB3 `image` field

---

## OB3 JSON Format Example

```json
{
  "@context": [
    "https://www.w3.org/2018/credentials/v1",
    "https://purl.imsglobal.org/spec/ob/v3p0/context/ob_v3p0.jsonld"
  ],
  "id": "https://www.credly.com/badges/abc123",
  "type": ["VerifiableCredential"],
  "issuer": {
    "id": "https://www.credly.com/organizations/microsoft",
    "type": ["Profile"],
    "name": "Microsoft"
  },
  "validFrom": "2024-01-15T00:00:00Z",
  "credentialSubject": {
    "id": "did:example:123",
    "type": ["AchievementSubject"],
    "achievement": {
      "id": "https://www.credly.com/badges/abc123",
      "type": ["Achievement"],
      "name": "Azure Administrator Associate",
      "description": "Earners of this badge have demonstrated...",
      "criteria": {
        "narrative": "Skills: Azure, Cloud Computing, DevOps"
      },
      "image": {
        "id": "https://images.credly.com/size/340x340/images/abc123.png",
        "type": "Image"
      }
    }
  }
}
```

---

## Bulk Import

You can import multiple badges at once by pasting an array of OB3 credentials:

```json
[
  {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "type": ["VerifiableCredential"],
    ...
  },
  {
    "@context": ["https://www.w3.org/2018/credentials/v1"],
    "type": ["VerifiableCredential"],
    ...
  }
]
```

---

## Troubleshooting

### "Invalid OB3 format" error

**Cause:** The JSON doesn't match OB3 specification

**Solution:**
- Ensure the JSON includes `@context` with `"https://www.w3.org/2018/credentials/v1"`
- Ensure it has `type` array containing `"VerifiableCredential"`
- Ensure it has `credentialSubject.achievement.name`

### "No valid badges found" error

**Cause:** The file structure is incorrect

**Solution:**
- Make sure you're using the OB3 export format (not OB2 or other formats)
- Try exporting a single badge first to verify the format

### Skills not imported

**Cause:** Skills are extracted from the `criteria.narrative` field

**Solution:**
- The system tries to extract skills from narrative text
- You can manually add skills after import via the badge edit page

---

## Comparison: Import Methods

| Method | Setup Required | Bulk Import | Automatic Skills |
|--------|---------------|-------------|------------------|
| **Open Badges 3.0** | None | ✅ Yes | ✅ Yes |
| Embed Code | None | ❌ One at a time | ❌ No |
| OAuth Sync | Client ID/Secret | ✅ Yes | ✅ Yes |
| Public API | None (broken) | ❌ No | ❌ No |

**Recommendation:** Use **Open Badges 3.0** import for best results!

---

## Resources

- [Open Badges 3.0 Specification](https://www.imsglobal.org/spec/ob/v3p0/)
- [Credly Help Center](https://support.credly.com/)
- [Verifiable Credentials](https://www.w3.org/TR/vc-data-model/)
