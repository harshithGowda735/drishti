const axios = require('axios');

exports.analyzeReport = async (req, res) => {
  const { reportType, reportDetails } = req.body;
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ message: 'AI service not configured (API Key missing)' });
  }

  try {
    const prompt = `
      As a medical AI assistant, analyze the following ${reportType} report details:
      "${reportDetails || 'General checkup'}"

      Provide a structured analysis in JSON format with the following fields:
      - insights: A detailed medical summary of the report.
      - riskLevel: One of [low, moderate, high, critical].
      - foodRoutine: Specific dietary suggestions based on the report.
      - walkRoutine: Suggested physical activity/walking routine.
      - precautions: Any immediate precautions to take.

      Respond ONLY with the JSON object.
    `;

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'google/gemma-3-27b-it',
        messages: [{ role: 'user', content: prompt }],
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3000', // Optional
          'X-Title': 'HealthConnect AI', // Optional
        },
      }
    );

    const aiResponse = response.data.choices[0].message.content;
    
    // Clean up the response in case the model adds markdown code blocks
    const jsonString = aiResponse.replace(/```json|```/g, '').trim();
    const result = JSON.parse(jsonString);

    res.json(result);
  } catch (error) {
    console.error('AI Analysis Error:', error.response?.data || error.message);
    res.status(500).json({ message: 'AI Analysis failed', error: error.message });
  }
};
