#!/usr/bin/env python3
"""
Whisper Transcription Service
Provides speech-to-text transcription using OpenAI's Whisper model
"""

import whisper
import tempfile
import os
import sys
import json
from pathlib import Path

def transcribe_audio(audio_path: str, model_size: str = "base") -> dict:
    """
    Transcribe audio file using Whisper
    
    Args:
        audio_path (str): Path to the audio file
        model_size (str): Whisper model size ("tiny", "base", "small", "medium", "large")
    
    Returns:
        dict: Transcription result with text and metadata
    """
    try:
        # Load Whisper model
        print(f"Loading Whisper model: {model_size}", file=sys.stderr)
        model = whisper.load_model(model_size)
        
        # Transcribe audio
        print(f"Transcribing audio file: {audio_path}", file=sys.stderr)
        result = model.transcribe(audio_path)
        
        return {
            "success": True,
            "text": result["text"],
            "language": result.get("language", "unknown"),
            "segments": result.get("segments", []),
            "duration": result.get("duration", 0)
        }
        
    except Exception as e:
        print(f"Error transcribing audio: {str(e)}", file=sys.stderr)
        return {
            "success": False,
            "error": str(e),
            "text": "",
            "language": "unknown",
            "segments": [],
            "duration": 0
        }

def main():
    """
    Main function for command-line usage
    Expected arguments: python whisperService.py <audio_file_path> [model_size]
    """
    if len(sys.argv) < 2:
        print("Usage: python whisperService.py <audio_file_path> [model_size]")
        sys.exit(1)
    
    audio_path = sys.argv[1]
    model_size = sys.argv[2] if len(sys.argv) > 2 else "base"
    
    # Check if audio file exists
    if not os.path.exists(audio_path):
        result = {
            "success": False,
            "error": f"Audio file not found: {audio_path}",
            "text": "",
            "language": "unknown",
            "segments": [],
            "duration": 0
        }
    else:
        result = transcribe_audio(audio_path, model_size)
    
    # Output result as JSON
    print(json.dumps(result, indent=2))

if __name__ == "__main__":
    main()
