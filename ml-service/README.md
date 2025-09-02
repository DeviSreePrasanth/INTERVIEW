# Interview Performance Evaluation ML Service

This service handles:

- Speech-to-text conversion
- NLP analysis for semantic similarity
- Communication quality assessment
- Confidence analysis
- Score generation

## Setup

1. Install Python 3.8+
2. Create virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the service:
   ```bash
   python app.py
   ```

## API Endpoints

- `POST /analyze` - Analyze interview recording
- `GET /health` - Health check

## Dependencies

- FastAPI/Flask for API
- SpeechRecognition for audio processing
- NLTK/spaCy for NLP
- scikit-learn for similarity analysis
- torch/transformers for BERT embeddings
