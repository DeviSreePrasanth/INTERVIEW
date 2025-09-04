#!/usr/bin/env python3
"""
Test script to verify Whisper installation
"""

def test_whisper():
    try:
        import whisper
        print("✓ Whisper import successful")
        
        # Test loading a small model
        print("Loading tiny model...")
        model = whisper.load_model("tiny")
        print("✓ Model loaded successfully")
        
        print("Whisper setup is working correctly!")
        return True
        
    except ImportError as e:
        print("✗ Whisper not installed:", str(e))
        print("Run: pip install openai-whisper")
        return False
        
    except Exception as e:
        print("✗ Error testing Whisper:", str(e))
        return False

if __name__ == "__main__":
    test_whisper()
