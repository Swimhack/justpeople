#!/usr/bin/env python3
"""
IMMEDIATE FIX: Upload missing contact files to GitHub justpeople repository
This will fix the contacts display issue by uploading the contact data files.
"""

import os
import base64
import json
import requests

# GitHub token from credentials
GITHUB_TOKEN = "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"

def upload_file_to_github(token, file_path, github_path, commit_message):
    """Upload a file to GitHub using the API"""
    
    # Repository details
    owner = "Swimhack"
    repo = "justpeople"
    
    # API endpoint
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{github_path}"
    
    # Read and encode file content
    try:
        with open(file_path, 'rb') as f:
            content = base64.b64encode(f.read()).decode('utf-8')
    except Exception as e:
        print(f"Error reading file {file_path}: {e}")
        return False
    
    # First check if file exists to get SHA
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    check_response = requests.get(url, headers=headers)
    sha = None
    if check_response.status_code == 200:
        sha = check_response.json().get('sha')
        print(f"File {github_path} exists, updating...")
    else:
        print(f"Creating new file {github_path}...")
    
    # Prepare the request
    data = {
        "message": commit_message,
        "content": content
    }
    
    if sha:
        data["sha"] = sha
    
    # Make the request
    print(f"Uploading {file_path} to {github_path}...")
    response = requests.put(url, headers=headers, json=data)
    
    if response.status_code in [201, 200]:
        print(f"✓ Successfully uploaded {github_path}")
        return True
    else:
        print(f"✗ Failed to upload {github_path}")
        print(f"  Status code: {response.status_code}")
        print(f"  Response: {response.text}")
        return False

def main():
    # Base directory
    base_dir = r"C:\Users\james\Desktop\RANDOM\AI\JARVIS\justpeople"
    
    # Files to upload
    files_to_upload = [
        {
            "local_path": os.path.join(base_dir, "public", "JJP_CONTACTS_MONDAY_IMPORT.json"),
            "github_path": "public/JJP_CONTACTS_MONDAY_IMPORT.json",
            "message": "🔧 Fix: Add contact data JSON file - fixes CRM contacts display"
        },
        {
            "local_path": os.path.join(base_dir, "public", "JJP_CONTACTS_MONDAY_IMPORT.csv"),
            "github_path": "public/JJP_CONTACTS_MONDAY_IMPORT.csv", 
            "message": "🔧 Fix: Add contact data CSV file - fixes CRM contacts display"
        }
    ]
    
    print("🚀 JJP CONTACTS FIX - Uploading missing files to GitHub...")
    print("=" * 60)
    
    # Check files exist
    for file_info in files_to_upload:
        if not os.path.exists(file_info["local_path"]):
            print(f"❌ File not found: {file_info['local_path']}")
            return
        else:
            print(f"✅ Found file: {os.path.basename(file_info['local_path'])}")
    
    print(f"\n📤 Uploading {len(files_to_upload)} files to GitHub repository...")
    print("Repository: https://github.com/Swimhack/justpeople")
    
    # Upload each file
    success_count = 0
    for file_info in files_to_upload:
        print(f"\n{'-' * 40}")
        if upload_file_to_github(
            GITHUB_TOKEN,
            file_info["local_path"],
            file_info["github_path"],
            file_info["message"]
        ):
            success_count += 1
    
    print(f"\n{'=' * 60}")
    print(f"📊 Upload Result: {success_count}/{len(files_to_upload)} files uploaded successfully")
    
    if success_count > 0:
        print("\n🎉 SUCCESS! Files uploaded to GitHub!")
        print("⏱️  Netlify will auto-deploy in ~2-3 minutes")
        print("\n📱 Once deployed, your contacts will be visible at:")
        print("   🔗 https://justpeople1.netlify.app/dashboard/contacts")
        print("   🔗 https://justpeople1.netlify.app/dashboard/admin")
        print("\n📈 Expected Results:")
        print("   • Total Contacts: 27 (instead of 0)")
        print("   • Contact Names: Bobby LaPenna, Sarah Chen, Michael Rodriguez, etc.")
        print("   • CRM Dashboard: Real statistics and company data")
        print("   • Search/Filter: Fully functional with real data")
        
        print("\n🔔 You can monitor the deployment at:")
        print("   🔗 https://app.netlify.com/sites/justpeople1/deploys")
    else:
        print("\n❌ Upload failed! Please check the errors above.")

if __name__ == "__main__":
    main()