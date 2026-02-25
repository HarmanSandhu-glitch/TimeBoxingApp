const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = "";

async function detailedTest() {
  try {
    console.log("Testing API key...");
    console.log("Key:", apiKey.substring(0, 20) + "...");
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const result = await model.generateContent("Hello");
    console.log("Success:", result.response.text());
  } catch (error) {
    console.error("\n❌ FULL ERROR DETAILS:");
    console.error("Message:", error.message);
    console.error("Status:", error.status);
    console.error("Status Text:", error.statusText);
    
    if (error.status === 400) {
      console.error("\n⚠️  API key issue: The key might be invalid or not enabled for Gemini API");
      console.error("Please check:");
      console.error("1. Go to https://aistudio.google.com/app/apikey");
      console.error("2. Verify your API key");
      console.error("3. Make sure Gemini API is enabled in your Google Cloud Console");
    } else if (error.status === 404) {
      console.error("\n⚠️  Model not found - the model name might be wrong for this API version");
    }
  }
}

detailedTest();
