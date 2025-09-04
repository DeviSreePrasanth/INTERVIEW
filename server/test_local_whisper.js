const localWhisperService = require("./src/services/localWhisperService");
const path = require("path");

async function testLocalWhisper() {
  console.log("🧪 Testing local Whisper service integration...");
  
  // Create a dummy file for testing (you'll need to provide a real audio file)
  const testAudioPath = path.join(__dirname, "uploads", "test-audio.wav");
  
  console.log(`📁 Testing with file path: ${testAudioPath}`);
  
  try {
    const result = await localWhisperService.speechToText(testAudioPath);
    console.log("✅ Result:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.log("❌ Error:", error.message);
    console.log("🔍 Full error:", error);
  }
}

testLocalWhisper();
