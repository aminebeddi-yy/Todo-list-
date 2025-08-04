const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const { GoogleGenerativeAI } = require('@google/generative-ai');
const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
    console.error("Error: GEMINI_API_KEY is not set in the .env file.");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


app.use(cors({
    origin: '*' 
}));
app.use(bodyParser.json());

app.post('/api/generate-ai-tasks', async (req, res) => {
    const userPrompt = req.body.userPrompt;

    if (!userPrompt || userPrompt.trim() === '') {
        return res.status(400).json({ message: "User prompt is required." });
    }

    try {
        const aiInstructionPrompt = `You are an expert task list generator. Based on the following user request, provide a concise list of actionable todo tasks.
        
        **Instructions:**
        1. List only the tasks. Do NOT include any introductory or concluding sentences, greetings, or numbering (like 1., -, *).
        2. Each task must be on a new line.
        3. Even if the request is a bit vague, try your best to provide a sensible list of generic tasks that fit the topic. Do NOT ask for more information unless the request is completely nonsensical or unrelated to tasks.
        4. If the request is truly incomprehensible or cannot be broken into tasks, respond with the exact phrase "I need more information to generate tasks for that."

        User Request: "${userPrompt}"

        Tasks:
        `;

        const result = await model.generateContent(aiInstructionPrompt);
        const response = await result.response;
        let aiGeneratedText = response.text();

        if (aiGeneratedText.trim() === "I need more information to generate tasks for that.") {
            return res.status(200).json({ tasks: [] });
        }

        const tasks = aiGeneratedText
            .split('\n')
            .map(task => task.trim())
            .filter(task => task.length > 0)
            .map(task => task.replace(/^[*-]?\s*\d*\.?\s*/, '').trim()) 
            .filter(task => task.length > 0); 

        res.json({ tasks });

    } catch (error) {
        console.error("Error generating content from AI model:", error);
        let errorMessage = "Failed to generate tasks from AI.";
        if (error.response && error.response.status) {
            errorMessage += ` Status: ${error.response.status}`;
        }
        if (error.response && error.response.text) {
             errorMessage += ` Details: ${await error.response.text()}`;
        } else if (error.message) {
            errorMessage += ` Error: ${error.message}`;
        }
        res.status(500).json({ message: errorMessage });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
    console.log(`API endpoint: http://localhost:${PORT}/api/generate-ai-tasks`);
});