# Python Whisper Setup Script
# Run this script to install all required dependencies for local Whisper transcription

Write-Host "Setting up Python Whisper environment..." -ForegroundColor Green

# Check if Python is installed
try {
    $pythonVersion = python --version 2>&1
    Write-Host "Found Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "Error: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python 3.8+ from https://python.org" -ForegroundColor Yellow
    exit 1
}

# Check if FFmpeg is available
try {
    $ffmpegVersion = ffmpeg -version 2>&1 | Select-String "ffmpeg version"
    Write-Host "Found FFmpeg: $($ffmpegVersion.Line)" -ForegroundColor Green
} catch {
    Write-Host "Warning: FFmpeg not found. Some audio formats may not work." -ForegroundColor Yellow
    Write-Host "Install FFmpeg from https://ffmpeg.org/download.html" -ForegroundColor Yellow
}

# Install Python dependencies
Write-Host "`nInstalling Python dependencies..." -ForegroundColor Green
pip install -r requirements.txt

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSetup completed successfully!" -ForegroundColor Green
    Write-Host "You can now use local Whisper transcription." -ForegroundColor Green
    
    # Test the installation
    Write-Host "`nTesting Whisper installation..." -ForegroundColor Green
    python -c "import whisper; print('Whisper installation successful!')"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Whisper is ready to use!" -ForegroundColor Green
    } else {
        Write-Host "✗ Whisper installation test failed" -ForegroundColor Red
    }
} else {
    Write-Host "Error: Failed to install dependencies" -ForegroundColor Red
    exit 1
}
