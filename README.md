# Interview Evaluation System with Speech-to-Text

A comprehensive interview management system with AI-powered speech-to-text transcription using OpenAI's Whisper model.

## Features

- **Multi-step Interview Creation**: 3-step form with Basic Details → Audio Upload → Transcript Processing
- **Local Speech-to-Text**: Uses OpenAI Whisper model running locally (no API costs)
- **Drag & Drop Audio Upload**: Support for multiple audio formats
- **Real-time Transcription**: Async transcription with status polling
- **Keyboard Navigation**: Full keyboard support with Enter/Esc shortcuts
- **Interview Management**: Create, view, edit, and delete interviews
- **Interview Groups**: Organize interviews by position, department, and college

## Prerequisites

### Required Software

- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **MongoDB** (running locally or cloud)
- **FFmpeg** (recommended for better audio format support)

### Environment Setup

1. Install Python dependencies for Whisper:

   ```powershell
   cd server
   .\setup_whisper.ps1
   ```

2. Or manually install Python packages:
   ```bash
   pip install -r requirements.txt
   ```

## Installation

### 1. Clone and Setup Backend

```bash
cd server
npm install
```

### 2. Environment Configuration

Create `server/.env` file:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/interview-evaluation
JWT_SECRET=your-jwt-secret-key
WHISPER_MODEL_SIZE=base
```

### 3. Setup Frontend

```bash
cd client
npm install
```

### 4. Test Whisper Installation

```bash
cd server
python test_whisper.py
```

## Usage

### Starting the Application

1. **Start Backend Server**:

   ```bash
   cd server
   npm run dev
   ```

2. **Start Frontend**:

   ```bash
   cd client
   npm run dev
   ```

3. **Access Application**: http://localhost:5173

### Creating an Interview with Audio Transcription

1. **Step 1 - Basic Details**:

   - Fill in candidate name, email, and interviewer name
   - Select interview group
   - Press `Enter` to continue or `Esc` to cancel

2. **Step 2 - Audio Upload**:

   - Drag & drop audio file or click to browse
   - Supported formats: MP3, WAV, M4A, OGG
   - Audio preview available
   - Press `Enter` to continue or `Esc` to go back

3. **Step 3 - Transcript Processing**:
   - Automatic transcription using local Whisper
   - Real-time status updates
   - View completed transcript
   - Press `Enter` to finish

## API Endpoints

### Interviews

- `POST /api/interviews` - Create interview with audio upload
- `GET /api/interviews` - Get all interviews
- `GET /api/interviews/:id` - Get specific interview
- `DELETE /api/interviews/:id` - Delete interview

### Transcription

- `POST /api/interviews/:id/transcribe` - Start transcription
- `GET /api/interviews/:id/transcript-status` - Check transcription status

## Architecture

### Backend (Node.js/Express)

- **Models**: MongoDB schemas for Interview, User, InterviewGroup, Candidate
- **Services**:
  - `transcriptionService.js` - Handles audio transcription using Python Whisper
  - `whisperService.py` - Python script for Whisper processing
- **Routes**: RESTful API endpoints
- **Middleware**: Authentication, file upload (multer)

### Frontend (React)

- **Components**: Reusable UI components
- **Pages**: Interview management interface
- **Context**: Authentication state management
- **Services**: API communication

### Transcription Flow

1. User uploads audio file in Step 2
2. File saved to `server/uploads/`
3. Interview created in database
4. Python Whisper service processes audio
5. Transcript saved to interview record
6. Real-time status updates via polling

## Whisper Models

Available model sizes (trade-off between speed and accuracy):

- `tiny` - Fastest, least accurate
- `base` - Default, good balance
- `small` - Better accuracy
- `medium` - High accuracy
- `large` - Best accuracy, slowest

Configure in `.env`:

```env
WHISPER_MODEL_SIZE=base
```

## Troubleshooting

### Common Issues

1. **Python/Whisper not found**:

   - Ensure Python is in PATH
   - Run `python --version` to verify
   - Install Whisper: `pip install openai-whisper`

2. **FFmpeg errors**:

   - Install FFmpeg from https://ffmpeg.org/
   - Add to system PATH

3. **Audio upload fails**:

   - Check file format (MP3, WAV, M4A, OGG supported)
   - Verify file size limits
   - Ensure `uploads/` directory exists

4. **Transcription fails**:
   - Check Python service logs
   - Verify Whisper model installation
   - Test with: `python test_whisper.py`

### Debug Mode

Enable detailed logging by setting:

```env
NODE_ENV=development
```

## Development

### File Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   └── context/        # State management
├── server/                 # Node.js backend
│   ├── src/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── middleware/     # Express middleware
│   ├── uploads/            # File uploads
│   ├── requirements.txt    # Python dependencies
│   └── whisperService.py   # Whisper integration
```

### Adding New Features

1. Update database models if needed
2. Add API routes in `server/src/routes/`
3. Update frontend services in `client/src/services/`
4. Add UI components as needed

## License

This project is licensed under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes and test thoroughly
4. Submit a pull request

---

For support or questions, please create an issue in the repository.
