// Mock Speech-to-Text and NLP Analysis Service

// Simulate speech-to-text conversion
export const transcribeAudio = async (audioFile) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Mock transcription based on file name or random selection
  const mockTranscriptions = [
    {
      text: "Hello, my name is John. I have been working with React for about 3 years now. I started my journey with JavaScript and gradually moved to modern frameworks. React appealed to me because of its component-based architecture and the virtual DOM concept. I have built several projects using React, including e-commerce applications and dashboard interfaces. My experience includes working with Redux for state management, React Router for navigation, and various UI libraries like Material-UI and Ant Design. I am confident in my ability to create scalable and maintainable React applications.",
      duration: "2:45",
      words: 95,
    },
    {
      text: "Good morning. I am excited to discuss my background in data science. I have strong skills in Python programming, particularly with libraries like pandas, numpy, and scikit-learn. I have worked on machine learning projects involving classification and regression problems. My experience includes data preprocessing, feature engineering, and model evaluation. I am comfortable with statistical analysis and have used visualization tools like matplotlib and seaborn to present findings. I believe my analytical mindset and attention to detail make me a good fit for data-driven roles.",
      duration: "3:12",
      words: 87,
    },
    {
      text: "Thank you for this opportunity. I have been passionate about web development since my college days. I started with HTML and CSS, then learned JavaScript and server-side technologies. I am proficient in both frontend and backend development. On the frontend, I work with React and Vue.js, while on the backend, I use Node.js and Express. I have experience with databases like MongoDB and PostgreSQL. I enjoy solving complex problems and creating user-friendly interfaces. I am always eager to learn new technologies and stay updated with industry trends.",
      duration: "2:58",
      words: 92,
    },
  ];

  return mockTranscriptions[
    Math.floor(Math.random() * mockTranscriptions.length)
  ];
};

// Analyze transcript using NLP techniques
export const analyzeTranscript = async (transcript) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 3000));

  const text = transcript.text.toLowerCase();

  // Technical Depth Analysis (0-10)
  const technicalDepth = calculateTechnicalDepth(text);

  // Confidence Analysis (0-10)
  const confidence = calculateConfidence(text, transcript);

  // Communication Skills Analysis (0-10)
  const communication = calculateCommunication(text, transcript);

  // Calculate overall score
  const overallScore = (technicalDepth + confidence + communication) / 3;

  return {
    transcript: transcript,
    scores: {
      technical_depth: technicalDepth,
      confidence: confidence,
      communication: communication,
      overall_score: overallScore,
    },
    insights: generateInsights(technicalDepth, confidence, communication),
    keywords: extractKeywords(text),
    sentiment: analyzeSentiment(text),
    fluency_metrics: calculateFluencyMetrics(transcript),
    technical_terms: extractTechnicalTerms(text),
  };
};

// Calculate technical depth score
const calculateTechnicalDepth = (text) => {
  const technicalTerms = [
    "react",
    "javascript",
    "python",
    "node.js",
    "database",
    "api",
    "framework",
    "library",
    "algorithm",
    "data structure",
    "machine learning",
    "sql",
    "mongodb",
    "redux",
    "express",
    "css",
    "html",
    "typescript",
    "aws",
    "docker",
    "kubernetes",
    "microservices",
    "authentication",
    "optimization",
    "testing",
    "debugging",
    "architecture",
    "design pattern",
    "mvc",
    "rest",
    "graphql",
    "component",
    "state management",
    "virtual dom",
    "hooks",
    "async",
    "promise",
    "callback",
  ];

  const detailedExplanations = [
    "architecture",
    "implementation",
    "experience",
    "projects",
    "worked on",
    "built",
    "created",
    "developed",
    "designed",
    "optimized",
    "integrated",
    "scalable",
    "maintainable",
    "efficient",
    "performance",
    "best practices",
  ];

  let score = 0;

  // Count technical terms (max 5 points)
  const technicalCount = technicalTerms.filter((term) =>
    text.includes(term)
  ).length;
  score += Math.min(technicalCount * 0.2, 5);

  // Count detailed explanations (max 3 points)
  const explanationCount = detailedExplanations.filter((term) =>
    text.includes(term)
  ).length;
  score += Math.min(explanationCount * 0.3, 3);

  // Bonus for specific examples (max 2 points)
  if (
    text.includes("project") ||
    text.includes("application") ||
    text.includes("example")
  ) {
    score += 1;
  }
  if (
    text.includes("challenge") ||
    text.includes("problem") ||
    text.includes("solution")
  ) {
    score += 1;
  }

  return Math.min(Math.round(score * 10) / 10, 10);
};

// Calculate confidence score
const calculateConfidence = (text, transcript) => {
  let score = 5; // Base score

  // Positive indicators
  const confidenceWords = [
    "confident",
    "experienced",
    "skilled",
    "proficient",
    "expert",
    "strong",
    "comfortable",
    "capable",
    "successful",
    "achieved",
    "accomplished",
  ];

  // Negative indicators
  const uncertainWords = [
    "maybe",
    "perhaps",
    "not sure",
    "i think",
    "probably",
    "might",
    "kind of",
    "sort of",
    "i guess",
    "uncertain",
  ];

  // Count confidence indicators
  const confidenceCount = confidenceWords.filter((word) =>
    text.includes(word)
  ).length;
  score += confidenceCount * 0.5;

  // Subtract for uncertainty
  const uncertainCount = uncertainWords.filter((word) =>
    text.includes(word)
  ).length;
  score -= uncertainCount * 0.3;

  // Bonus for concrete statements
  if (
    text.includes("i have") ||
    text.includes("i am") ||
    text.includes("i can")
  ) {
    score += 1;
  }

  // Word count factor (longer, more detailed answers suggest confidence)
  if (transcript.words > 80) score += 1;
  if (transcript.words > 120) score += 0.5;

  return Math.min(Math.max(Math.round(score * 10) / 10, 0), 10);
};

// Calculate communication score
const calculateCommunication = (text, transcript) => {
  let score = 5; // Base score

  // Clear structure indicators
  const structureWords = [
    "first",
    "second",
    "then",
    "finally",
    "additionally",
    "furthermore",
    "however",
    "therefore",
    "because",
    "since",
    "as a result",
  ];

  // Professional language
  const professionalWords = [
    "experience",
    "skills",
    "background",
    "expertise",
    "knowledge",
    "responsible",
    "developed",
    "implemented",
    "managed",
    "coordinated",
  ];

  // Count structure indicators
  const structureCount = structureWords.filter((word) =>
    text.includes(word)
  ).length;
  score += structureCount * 0.3;

  // Count professional language
  const professionalCount = professionalWords.filter((word) =>
    text.includes(word)
  ).length;
  score += Math.min(professionalCount * 0.2, 2);

  // Grammar and flow (simulated)
  const sentences = text.split(".").filter((s) => s.trim().length > 0);
  if (sentences.length >= 3) score += 1; // Multiple sentences
  if (sentences.length >= 5) score += 0.5; // Well-developed response

  // Clarity bonus (avoid repetition)
  const words = text.split(" ");
  const uniqueWords = new Set(words);
  const vocabularyRatio = uniqueWords.size / words.length;
  if (vocabularyRatio > 0.7) score += 1; // Good vocabulary diversity

  return Math.min(Math.max(Math.round(score * 10) / 10, 0), 10);
};

// Generate insights based on scores
const generateInsights = (technical, confidence, communication) => {
  const insights = [];

  if (technical >= 8) {
    insights.push("Demonstrates strong technical knowledge and expertise");
  } else if (technical >= 6) {
    insights.push(
      "Shows good technical understanding with room for deeper insights"
    );
  } else {
    insights.push(
      "Technical knowledge needs improvement - consider more detailed examples"
    );
  }

  if (confidence >= 8) {
    insights.push("Displays excellent confidence and self-assurance");
  } else if (confidence >= 6) {
    insights.push(
      "Shows reasonable confidence with some areas for improvement"
    );
  } else {
    insights.push("Could benefit from increased confidence and assertiveness");
  }

  if (communication >= 8) {
    insights.push(
      "Excellent communication skills with clear, structured responses"
    );
  } else if (communication >= 6) {
    insights.push("Good communication skills with minor areas for improvement");
  } else {
    insights.push(
      "Communication skills need development - work on clarity and structure"
    );
  }

  return insights;
};

// Extract keywords from text
const extractKeywords = (text) => {
  const keywords = text.match(
    /\b(react|javascript|python|node|database|api|framework|library|algorithm|data|structure|machine|learning|sql|mongodb|redux|express|css|html|typescript|aws|docker|kubernetes|testing|debugging|architecture|component|state|management|optimization|performance|scalable|maintainable)\b/gi
  );
  return [...new Set(keywords || [])].slice(0, 10);
};

// Analyze sentiment
const analyzeSentiment = (text) => {
  const positiveWords = [
    "good",
    "great",
    "excellent",
    "excited",
    "passionate",
    "enjoy",
    "love",
    "successful",
    "achieved",
    "accomplished",
  ];
  const negativeWords = [
    "difficult",
    "challenging",
    "problem",
    "issue",
    "struggle",
    "hard",
    "complex",
  ];

  const positiveCount = positiveWords.filter((word) =>
    text.includes(word)
  ).length;
  const negativeCount = negativeWords.filter((word) =>
    text.includes(word)
  ).length;

  if (positiveCount > negativeCount) return "Positive";
  if (negativeCount > positiveCount) return "Negative";
  return "Neutral";
};

// Calculate fluency metrics
const calculateFluencyMetrics = (transcript) => {
  const words = transcript.text.split(" ").length;
  const duration = transcript.duration.split(":");
  const totalSeconds = parseInt(duration[0]) * 60 + parseInt(duration[1]);
  const wordsPerMinute = Math.round((words / totalSeconds) * 60);

  return {
    words_per_minute: wordsPerMinute,
    total_words: words,
    speaking_duration: transcript.duration,
    fluency_rating:
      wordsPerMinute > 150 ? "High" : wordsPerMinute > 120 ? "Medium" : "Low",
  };
};

// Extract technical terms
const extractTechnicalTerms = (text) => {
  const technicalTerms = text.match(
    /\b(react|javascript|python|node\.js|mongodb|redux|express|css|html|typescript|aws|docker|kubernetes|microservices|authentication|optimization|testing|debugging|architecture|design pattern|mvc|rest|graphql|component|state management|virtual dom|hooks|async|promise|callback|api|framework|library|algorithm|data structure|machine learning|sql)\b/gi
  );
  return [...new Set(technicalTerms || [])];
};

// Main function to process interview audio
export const processInterviewAudio = async (audioFile) => {
  try {
    // Step 1: Transcribe audio
    const transcript = await transcribeAudio(audioFile);

    // Step 2: Analyze transcript
    const analysis = await analyzeTranscript(transcript);

    return {
      success: true,
      data: analysis,
    };
  } catch (error) {
    console.error("Error processing interview audio:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
