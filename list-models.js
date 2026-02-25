const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = "AIzaSyDim896Xkm8XM-UEMAT_amQERKxbms0lfI";

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    console.log("Listing available Gemini models...\n");
    
    // Try common model names
    const modelsToTry = [
      "gemini-pro",
      "gemini-1.5-pro",
      "gemini-1.5-flash-latest", 
      "gemini-2.0-flash-exp"
    ];
    
    for (const modelName of modelsToTry) {
      try {
        console.log(`Testing model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Say hello!");
        const response = result.response.text();
        console.log(`✅ ${modelName} WORKS!`);
        console.log(`   Response: ${response.substring(0, 50)}...\n`);
      } catch (error) {
        console.log(`❌ ${modelName} failed: ${error.message.substring(0, 80)}...\n`);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

listModels();
