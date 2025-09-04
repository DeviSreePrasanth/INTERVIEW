const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// Transcribe an audio/video file using local Whisper (Python)
async function transcribeFile(filePath, options = {}) {
  const start = Date.now();

  return new Promise((resolve, reject) => {
    try {
      console.log("Starting transcription for:", filePath);

      if (!fs.existsSync(filePath)) {
        reject(new Error("Audio file not found: " + filePath));
        return;
      }

      // Path to the Python Whisper service
      const pythonScript = path.join(__dirname, "whisperService.py");
      const modelSize =
        options.modelName || process.env.WHISPER_MODEL_SIZE || "base";

      console.log("Python script path:", pythonScript);
      console.log("Model size:", modelSize);
      console.log("Audio file path:", filePath);

      // Spawn Python process to run Whisper
      const pythonProcess = spawn("python", [
        pythonScript,
        filePath,
        modelSize,
      ]);

      let output = "";
      let errorOutput = "";

      pythonProcess.stdout.on("data", (data) => {
        output += data.toString();
      });

      pythonProcess.stderr.on("data", (data) => {
        const stderrText = data.toString();
        console.log("[Python stderr]:", stderrText);
        // Don't add stderr to output - it contains loading messages
      });

      pythonProcess.on("close", (code) => {
        if (code !== 0) {
          console.error("Python script exited with code:", code);
          reject(new Error(`Transcription failed with exit code ${code}`));
          return;
        }

        try {
          // Parse the JSON output from Python script
          console.log("Raw Python output:", output);
          const result = JSON.parse(output);

          if (result.success) {
            console.log("Transcription completed");
            const text = result.text || "";
            const totalWords = text.split(/\s+/).filter(Boolean).length;

            resolve({
              text,
              segments: result.segments || [],
              metrics: {
                wordsPerMinute: 0,
                totalWords,
                duration: result.duration || 0,
                durationSeconds: result.duration || 0,
              },
              metadata: {
                processingTimeMs: Date.now() - start,
                model: modelSize,
                language: result.language || options.language || "auto",
                createdAt: new Date(),
              },
            });
          } else {
            reject(new Error(result.error || "Transcription failed"));
          }
        } catch (parseError) {
          console.error("Failed to parse transcription result:", parseError);
          reject(new Error("Failed to parse transcription result"));
        }
      });

      pythonProcess.on("error", (error) => {
        console.error("Failed to start Python process:", error);
        reject(
          new Error(`Failed to start transcription service: ${error.message}`)
        );
      });
    } catch (error) {
      console.error("Transcription error:", error);
      reject(new Error(`Transcription failed: ${error.message}`));
    }
  });
}

module.exports = { transcribeFile };
