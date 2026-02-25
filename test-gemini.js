const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = "AIzaSyDim896Xkm8XM-UEMAT_amQERKxbms0lfI";

async function testGemini() {
  try {
    console.log("Testing Gemini API with key:", apiKey.substring(0, 10) + "...");
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    console.log("Sending test message...");
    const result = await model.generateContent("Say hello!");
    const response = result.response.text();
    
    console.log("\n✅ SUCCESS! Gemini API is working!");
    console.log("Response:", response);
  } catch (error) {
    console.error("\n❌ ERROR:", error.message);
    if (error.message.includes("API_KEY_INVALID")) {
      console.error("The API key is invalid. Please check your GEMINI_API_KEY in .env");
    } else if (error.message.includes("quota")) {
      console.error("API quota exceeded or billing not enabled");
    } else {
      console.error("Full error:", error);
    }
  }
}

testGemini();
