const { GoogleGenerativeAI } = require('@google/generative-ai');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function analyzeExpenses({ groupName, expenses, totalAmount, perPersonShare, balances }) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Create a more detailed and structured prompt
        const prompt = `
        Expense Analysis Report for Group: ${groupName}

        Total Expenses: $${totalAmount.toFixed(2)}
        Average Per Person: $${perPersonShare.toFixed(2)}

        Expense Breakdown:
        ${expenses.map(exp => `- ${exp.userName}: $${exp.amount.toFixed(2)} (${exp.description || 'No description'})`).join('\n')}

        Individual Balances:
        ${balances.map(balance => `- ${balance.userName}: Paid $${balance.totalPaid.toFixed(2)}, Balance: $${balance.balance.toFixed(2)}`).join('\n')}

        Please provide:
        1. A concise summary of group spending
        2. Insights into spending patterns
        3. Recommendations for future expense management
        4. Any notable observations about group expenses
        `;

        const result = await model.generateContent(prompt);
        const analysis = result.response.text();

        return analysis || "No detailed analysis available.";
    } catch (error) {
        console.error('Gemini Analysis Error:', error);
        return "Unable to generate expense analysis.";
    }
}

// Add error handling and fallback
async function safeAnalyzeExpenses(expenseData) {
    try {
        return await analyzeExpenses(expenseData);
    } catch (error) {
        console.error('Safe Analysis Error:', error);
        return "Basic expense analysis could not be generated.";
    }
}

module.exports = { 
    analyzeExpenses: safeAnalyzeExpenses 
};