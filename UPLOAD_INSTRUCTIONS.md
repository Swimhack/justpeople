# Upload Instructions for JustPeople Repository Files

## Overview
These instructions will help you upload the three deployment fix files to the Swimhack/justpeople GitHub repository.

## Files to Upload
1. `public/JJP_CONTACTS_MONDAY_IMPORT.csv` - Contact data in CSV format
2. `public/JJP_CONTACTS_MONDAY_IMPORT.json` - Contact data in JSON format  
3. `public/_redirects` - Netlify configuration for SPA routing

## Method 1: Using the Python Script (Recommended)

1. First, you need a GitHub Personal Access Token:
   - Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
   - Click "Generate new token (classic)"
   - Give it a name like "justpeople-upload"
   - Select the "repo" scope (full control of private repositories)
   - Generate the token and copy it

2. Run the upload script:
   ```bash
   python upload_to_github.py YOUR_GITHUB_TOKEN
   ```

## Method 2: Using GitHub Web Interface

1. Go to https://github.com/Swimhack/justpeople
2. Navigate to the `public` folder (create it if it doesn't exist)
3. Click "Add file" → "Upload files"
4. Drag and drop or select the three files
5. Use commit message: "Add deployment files: contact data and Netlify redirects"

## Method 3: Using Git Command Line

If you have the repository cloned:

```bash
# Clone the repository if you haven't already
git clone https://github.com/Swimhack/justpeople.git
cd justpeople

# Copy the files to the public directory
mkdir -p public
cp /mnt/c/Users/james/Desktop/RANDOM/AI/JARVIS/justpeople/public/JJP_CONTACTS_MONDAY_IMPORT.csv public/
cp /mnt/c/Users/james/Desktop/RANDOM/AI/JARVIS/justpeople/public/JJP_CONTACTS_MONDAY_IMPORT.json public/
cp /mnt/c/Users/james/Desktop/RANDOM/AI/JARVIS/justpeople/public/_redirects public/

# Add and commit the files
git add public/JJP_CONTACTS_MONDAY_IMPORT.csv
git add public/JJP_CONTACTS_MONDAY_IMPORT.json
git add public/_redirects

git commit -m "Add deployment files: contact data and Netlify redirects

- Add contact data files (CSV and JSON) to public directory
- Add _redirects file for Netlify SPA routing support
- Fixes deployment issues and makes contact pages accessible"

# Push to GitHub
git push origin main
```

## Expected Results

After uploading these files:
1. The Netlify build should succeed
2. Contact data will be available at the deployed site
3. SPA routing will work correctly (no 404 errors on page refresh)

## File Contents Summary

- **CSV file**: Contains 27 contact records with fields for name, email, phone, company, title, location, notes, tags, and status
- **JSON file**: Same contact data in JSON format for easier JavaScript consumption
- **_redirects file**: Contains `/* /index.html 200` for SPA routing support