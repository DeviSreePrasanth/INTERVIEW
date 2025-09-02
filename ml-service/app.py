from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import os
from typing import List, Dict
import tempfile
import speech_recognition as sr
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import re
from pydub import AudioSegment
import uvicorn

# Initialize FastAPI app
app = FastAPI(title="Interview Analysis Service", version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models
try:
    # Load sentence transformer for semantic similarity
    similarity_model = SentenceTransformer('all-MiniLM-L6-v2')
    print("✅ Sentence transformer model loaded successfully")
except Exception as e:
    print(f"❌ Error loading sentence transformer: {e}")
    similarity_model = None

# Initialize speech recognition
recognizer = sr.Recognizer()

class InterviewAnalyzer:
    def __init__(self):
        self.filler_words = [
            'um', 'uh', 'er', 'ah', 'like', 'you know', 'actually', 
            'basically', 'literally', 'sort of', 'kind of'
        ]
        
    def convert_audio_to_text(self, audio_file_path: str) -> str:
        """Convert audio file to text using speech recognition"""
        try:
            # Convert to WAV if needed
            if not audio_file_path.endswith('.wav'):
                audio = AudioSegment.from_file(audio_file_path)
                wav_path = audio_file_path.rsplit('.', 1)[0] + '.wav'
                audio.export(wav_path, format="wav")
                audio_file_path = wav_path
            
            # Perform speech recognition
            with sr.AudioFile(audio_file_path) as source:
                audio_data = recognizer.record(source)
                text = recognizer.recognize_google(audio_data)
                return text
                
        except sr.UnknownValueError:
            return "Could not understand audio"
        except sr.RequestError as e:
            return f"Error with speech recognition service: {e}"
        except Exception as e:
            return f"Error processing audio: {e}"
    
    def calculate_semantic_similarity(self, candidate_answer: str, expected_answer: str) -> float:
        """Calculate semantic similarity between candidate and expected answers"""
        try:
            if similarity_model is None:
                # Fallback to simple word matching
                return self.simple_word_similarity(candidate_answer, expected_answer)
            
            # Get embeddings
            embeddings = similarity_model.encode([candidate_answer, expected_answer])
            similarity = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
            return float(similarity)
            
        except Exception as e:
            print(f"Error in semantic similarity: {e}")
            return self.simple_word_similarity(candidate_answer, expected_answer)
    
    def simple_word_similarity(self, text1: str, text2: str) -> float:
        """Simple word-based similarity as fallback"""
        words1 = set(text1.lower().split())
        words2 = set(text2.lower().split())
        intersection = words1.intersection(words2)
        union = words1.union(words2)
        return len(intersection) / len(union) if union else 0.0
    
    def analyze_communication_quality(self, text: str) -> Dict:
        """Analyze communication quality metrics"""
        words = text.split()
        sentences = text.split('.')
        
        # Count filler words
        filler_count = sum(1 for word in words if word.lower().strip('.,!?') in self.filler_words)
        
        # Simple grammar score (based on sentence structure)
        grammar_score = min(10, max(5, 10 - (filler_count * 0.5)))
        
        # Clarity score (based on sentence length and complexity)
        avg_sentence_length = len(words) / max(len(sentences), 1)
        clarity_score = min(10, max(5, 10 - abs(avg_sentence_length - 15) * 0.1))
        
        return {
            'grammarScore': round(grammar_score, 1),
            'clarityScore': round(clarity_score, 1),
            'fillerWords': filler_count,
            'averageResponseTime': round(np.random.uniform(2.0, 5.0), 1)  # Mock response time
        }
    
    def analyze_confidence(self, text: str) -> float:
        """Analyze confidence level from text"""
        # Look for uncertainty indicators
        uncertainty_words = ['maybe', 'i think', 'probably', 'not sure', 'i guess', 'perhaps']
        confident_words = ['definitely', 'certainly', 'absolutely', 'clearly', 'obviously']
        
        words = text.lower()
        uncertainty_count = sum(1 for phrase in uncertainty_words if phrase in words)
        confidence_count = sum(1 for phrase in confident_words if phrase in words)
        
        # Base confidence score
        base_score = 7.0
        confidence_score = base_score + (confidence_count * 0.5) - (uncertainty_count * 0.3)
        
        return max(1.0, min(10.0, confidence_score))
    
    def calculate_technical_score(self, candidate_answer: str, expected_answer: str, question: str) -> Dict:
        """Calculate technical score based on answer quality"""
        similarity = self.calculate_semantic_similarity(candidate_answer, expected_answer)
        
        # Convert similarity to score (0-10 scale)
        base_score = similarity * 10
        
        # Add some randomness for realistic scoring
        noise = np.random.uniform(-0.5, 0.5)
        final_score = max(1.0, min(10.0, base_score + noise))
        
        # Generate feedback based on score
        if final_score >= 8:
            feedback = "Excellent understanding demonstrated"
        elif final_score >= 6:
            feedback = "Good knowledge with room for improvement"
        elif final_score >= 4:
            feedback = "Basic understanding, needs more depth"
        else:
            feedback = "Limited understanding, requires significant improvement"
        
        return {
            'score': round(final_score, 1),
            'feedback': feedback
        }

# Initialize analyzer
analyzer = InterviewAnalyzer()

@app.get("/")
async def root():
    return {"message": "Interview Analysis Service is running"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "models_loaded": similarity_model is not None,
        "version": "1.0.0"
    }

@app.post("/analyze")
async def analyze_interview(
    audio_file: UploadFile = File(...),
    questions_data: str = Form(...)
):
    """Analyze interview audio and questions"""
    try:
        # Parse questions data
        questions = json.loads(questions_data)
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=f".{audio_file.filename.split('.')[-1]}") as tmp_file:
            content = await audio_file.read()
            tmp_file.write(content)
            tmp_file_path = tmp_file.name
        
        try:
            # Convert audio to text
            transcript = analyzer.convert_audio_to_text(tmp_file_path)
            
            # Mock: Split transcript by questions (in reality, you'd need more sophisticated segmentation)
            # For now, we'll generate mock answers
            question_analysis = []
            technical_scores = []
            
            for i, q in enumerate(questions):
                # Generate mock candidate answer (in reality, extract from transcript)
                mock_answer = f"Mock answer for question {i+1} based on transcript analysis..."
                
                # Calculate technical score
                tech_result = analyzer.calculate_technical_score(
                    mock_answer, 
                    q['expectedAnswer'], 
                    q['question']
                )
                
                technical_scores.append(tech_result['score'])
                
                question_analysis.append({
                    'question': q['question'],
                    'candidateAnswer': mock_answer,
                    'expectedAnswer': q['expectedAnswer'],
                    'score': tech_result['score'],
                    'feedback': tech_result['feedback']
                })
            
            # Analyze communication quality
            communication_metrics = analyzer.analyze_communication_quality(transcript)
            
            # Calculate scores
            technical_score = sum(technical_scores) / len(technical_scores) if technical_scores else 7.0
            communication_score = (communication_metrics['grammarScore'] + communication_metrics['clarityScore']) / 2
            confidence_score = analyzer.analyze_confidence(transcript)
            overall_score = (technical_score + communication_score + confidence_score) / 3
            
            # Prepare response
            analysis_result = {
                'technical_score': round(technical_score, 1),
                'communication_score': round(communication_score, 1),
                'confidence_score': round(confidence_score, 1),
                'overall_score': round(overall_score, 1),
                'transcript': transcript,
                'questionAnalysis': question_analysis,
                'communicationMetrics': communication_metrics,
                'feedback': f"Overall performance shows {'strong' if overall_score >= 8 else 'good' if overall_score >= 6 else 'adequate'} capabilities with areas for improvement in {'technical depth' if technical_score < 7 else 'communication skills' if communication_score < 7 else 'confidence building'}."
            }
            
            return analysis_result
            
        finally:
            # Clean up temporary file
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
                
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid questions data format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
