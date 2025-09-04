const integratedMLService = require('../ml/services/integratedMLService');
const audioValidator = require('../ml/utils/audioValidator');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

class MLService {
  constructor() {
    this.useLocalML = process.env.USE_LOCAL_ML !== 'false'; // Default to true
    this.baseURL = process.env.ML_SERVICE_URL || 'http://localhost:5001';
    this.timeout = 300000; // 5 minutes timeout for processing
  }

  async healthCheck() {
    try {
      if (this.useLocalML) {
        return await integratedMLService.healthCheck();
      } else {
        // Fallback to external API if configured
        const response = await axios.get(`${this.baseURL}/health`, {
          timeout: 5000
        });
        return response.data;
      }
    } catch (error) {
      console.log('ML Service health check failed:', error.message);
      return { status: 'error', message: 'ML Service unavailable' };
    }
  }

  async processAudio(audioFilePath, interviewId) {
    try {
      // Check if file exists
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Audio file not found: ${audioFilePath}`);
      }

      if (this.useLocalML) {
        // Validate audio file first
        const validation = await audioValidator.validateAudioFile(audioFilePath);
        
        if (!validation.isValid) {
          throw new Error(`Audio validation failed: ${validation.errors.join(', ')}`);
        }

        // Log warnings if any
        if (validation.warnings.length > 0) {
          console.warn('Audio validation warnings:', validation.warnings);
        }

        // Process using local ML services
        console.log(`Processing audio locally for interview ${interviewId}`);
        const result = await integratedMLService.processInterviewAudio(audioFilePath, interviewId);
        
        if (!result.success) {
          throw new Error(result.error);
        }

        return {
          success: true,
          transcript: result.transcript,
          analysis: result.analysis,
          report: result.report,
          metadata: result.metadata,
          processing_method: 'local_ml'
        };
      } else {
        // Fallback to external API processing
        const formData = new FormData();
        formData.append('audio', fs.createReadStream(audioFilePath));
        formData.append('interviewId', interviewId);

        const response = await axios.post(`${this.baseURL}/process-audio`, formData, {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: this.timeout,
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        });

        return {
          ...response.data,
          processing_method: 'external_api'
        };
      }
    } catch (error) {
      console.error('ML Service processing error:', error.message);
      throw new Error(`Audio processing failed: ${error.message}`);
    }
  }

  async transcribeOnly(audioFilePath) {
    try {
      if (!fs.existsSync(audioFilePath)) {
        throw new Error(`Audio file not found: ${audioFilePath}`);
      }

      if (this.useLocalML) {
        // Validate audio file first
        const validation = await audioValidator.validateAudioFile(audioFilePath);
        
        if (!validation.isValid) {
          throw new Error(`Audio validation failed: ${validation.errors.join(', ')}`);
        }

        // Process using local Whisper
        console.log('Transcribing audio locally using Whisper');
        const result = await integratedMLService.transcribeOnly(audioFilePath);
        
        if (!result.success) {
          throw new Error(result.error);
        }

        return {
          success: true,
          transcript: result.transcript,
          confidence: result.confidence,
          chunks: result.chunks,
          metadata: result.metadata,
          processing_method: 'local_whisper'
        };
      } else {
        // Fallback to external API
        const formData = new FormData();
        formData.append('audio', fs.createReadStream(audioFilePath));

        const response = await axios.post(`${this.baseURL}/transcribe-only`, formData, {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: this.timeout,
          maxContentLength: Infinity,
          maxBodyLength: Infinity
        });

        return {
          ...response.data,
          processing_method: 'external_api'
        };
      }
    } catch (error) {
      console.error('ML Service transcription error:', error.message);
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }

  async analyzeText(text) {
    try {
      if (this.useLocalML) {
        console.log('Analyzing text locally');
        const result = await integratedMLService.analyzeTextOnly(text);
        
        if (!result.success) {
          throw new Error(result.error);
        }

        return {
          success: true,
          analysis: result,
          processing_method: 'local_ml'
        };
      } else {
        // Fallback to external API
        const response = await axios.post(`${this.baseURL}/analyze-text`, {
          text: text
        }, {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000
        });

        return {
          ...response.data,
          processing_method: 'external_api'
        };
      }
    } catch (error) {
      console.error('ML Service text analysis error:', error.message);
      throw new Error(`Text analysis failed: ${error.message}`);
    }
  }

  async getSupportedFormats() {
    try {
      if (this.useLocalML) {
        return {
          success: true,
          formats: integratedMLService.getSupportedFormats(),
          validation_rules: audioValidator.getValidationRules(),
          processing_method: 'local_ml'
        };
      } else {
        // Fallback to external API
        const response = await axios.get(`${this.baseURL}/formats`, {
          timeout: 5000
        });
        return {
          ...response.data,
          processing_method: 'external_api'
        };
      }
    } catch (error) {
      console.error('ML Service formats error:', error.message);
      return { 
        success: true,
        formats: ['mp3', 'wav', 'mp4', 'm4a'], // fallback
        processing_method: 'fallback'
      };
    }
  }

  // New method to validate audio files
  async validateAudioFile(filePath) {
    try {
      return await audioValidator.validateAudioFile(filePath);
    } catch (error) {
      console.error('Audio validation error:', error.message);
      return {
        isValid: false,
        errors: [error.message],
        warnings: [],
        metadata: null
      };
    }
  }

  // Method to check if using local ML
  isUsingLocalML() {
    return this.useLocalML;
  }
}

module.exports = new MLService();
