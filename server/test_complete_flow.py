#!/usr/bin/env python3
"""
Test complete interview creation and transcription workflow
"""

import requests
import json
import time

def test_interview_creation():
    print("Testing complete interview creation with transcription...")
    
    # First, login to get a token
    login_data = {
        "email": "admin@example.com",  # Update with actual credentials
        "password": "password123"      # Update with actual credentials
    }
    
    try:
        # Login
        login_response = requests.post("http://localhost:5000/api/auth/login", json=login_data)
        if login_response.status_code != 200:
            print("Login failed:", login_response.text)
            return
        
        token = login_response.json().get("token")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test interview creation with file upload
        files = {
            'interviewFile': ('test.mp3', open('uploads/interviewFile-1756989224485-376437798.mp3', 'rb'), 'audio/mpeg')
        }
        
        form_data = {
            'candidateName': 'Test Candidate',
            'candidateEmail': 'test@example.com',
            'interviewerName': 'Test Interviewer',
            'position': 'Software Developer',
            'department': 'Engineering'
        }
        
        # Create interview
        interview_response = requests.post(
            "http://localhost:5000/api/interviews",
            headers=headers,
            files=files,
            data=form_data
        )
        
        if interview_response.status_code != 201:
            print("Interview creation failed:", interview_response.text)
            return
        
        interview_data = interview_response.json()
        interview_id = interview_data["interview"]["_id"]
        print("Interview created successfully with ID:", interview_id)
        
        # Poll for transcription status
        print("Polling for transcription status...")
        for attempt in range(10):  # Try for up to 50 seconds
            status_response = requests.get(
                f"http://localhost:5000/api/interviews/{interview_id}/status",
                headers=headers
            )
            
            if status_response.status_code == 200:
                status_data = status_response.json()
                print(f"Attempt {attempt + 1}: Status = {status_data.get('analysisStatus')}")
                
                if status_data.get("analysisStatus") == "Analyzed":
                    print("✅ Transcription completed!")
                    print("Transcript preview:", status_data.get("transcript", "")[:100] + "...")
                    return
                elif status_data.get("analysisStatus") == "Failed":
                    print("❌ Transcription failed!")
                    return
            else:
                print(f"Status check failed: {status_response.status_code}")
            
            time.sleep(5)
        
        print("⏰ Transcription timed out")
        
    except Exception as e:
        print("Error:", str(e))

if __name__ == "__main__":
    test_interview_creation()
