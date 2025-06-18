import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

export const analyzeDocument = async (documentText) => {
  try {
    // Get the model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });




    const prompt = `Please analyze this Terms & Conditions document and identify potential issues. Focus on:

1. Privacy concerns (data collection, sharing)
2. Data usage policies (how data is used, stored)
3. User rights limitations (account deletion, data access)
4. Liability issues (limitation of liability, indemnification)
5. Termination conditions (account closure, data retention)

For each category, count the number of concerning clauses and provide a brief summary.

Format your response like this:
PRIVACY ISSUES: [count] - [brief summary]
DATA USAGE ISSUES: [count] - [brief summary]
USER RIGHTS ISSUES: [count] - [brief summary]
LIABILITY ISSUES: [count] - [brief summary]
TERMINATION ISSUES: [count] - [brief summary]

Document text:
${documentText.substring(0, 10000)}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const analysisText = response.text();
    
    return {
      success: true,
      analysis: analysisText,
      issueCount: extractIssueCount(analysisText)
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Helper function to extract issue counts from the response
const extractIssueCount = (analysisText) => {
  const privacy = extractCountForCategory(analysisText, 'PRIVACY ISSUES');
  const data = extractCountForCategory(analysisText, 'DATA USAGE ISSUES');
  const rights = extractCountForCategory(analysisText, 'USER RIGHTS ISSUES');
  const liability = extractCountForCategory(analysisText, 'LIABILITY ISSUES');
  const termination = extractCountForCategory(analysisText, 'TERMINATION ISSUES');
  
  return {
    total: privacy + data + rights + liability + termination,
    privacy,
    data,
    rights,
    liability,
    termination
  };
};

const extractCountForCategory = (text, category) => {
  const regex = new RegExp(`${category}:\\s*(\\d+)`, 'i');
  const match = text.match(regex);
  return match ? parseInt(match[1]) : 0;
};