const { GoogleGenerativeAI } = require('@google/generative-ai');
const genAI = new GoogleGenerativeAI('AIzaSyBZzHOJLbbb--06g7F5LlmhEmzzEopa8CQ');

async function test() {
  try {
    // There is no listModels in the client side but let's try a common one
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent('hi');
    console.log('SUCCESS:', result.response.text());
  } catch (e) {
    console.log('ERROR:', e.message);
  }
}
test();
