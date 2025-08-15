interface AIResponse {
  success: boolean;
  message: string;
  error?: string;
}

interface SymptomAnalysisResponse extends AIResponse {
  analysis?: {
    possibleConditions: string[];
    urgency: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
  };
}

class AIService {
  private apiKey: string = '';
  private baseURL: string = 'https://api.openai.com/v1';

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    localStorage.setItem('heala_ai_api_key', apiKey);
  }

  getApiKey(): string {
    return this.apiKey || localStorage.getItem('heala_ai_api_key') || '';
  }

  async sendChatMessage(message: string, conversationHistory: Array<{role: string, content: string}> = []): Promise<AIResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { success: false, message: '', error: 'API key not configured' };
    }

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI health assistant. Provide general health information and guidance, but always remind users to consult healthcare professionals for medical advice. Keep responses concise and helpful.'
            },
            ...conversationHistory,
            {
              role: 'user',
              content: message
            }
          ],
          max_tokens: 500,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        message: data.choices[0]?.message?.content || 'No response received'
      };
    } catch (error) {
      return {
        success: false,
        message: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async analyzeSymptoms(symptoms: string, userHealthHistory?: string): Promise<SymptomAnalysisResponse> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { success: false, message: '', error: 'API key not configured' };
    }

    try {
      const systemPrompt = `You are a medical AI assistant specializing in symptom analysis for Nigerian healthcare context. 
      Analyze symptoms and provide:
      1. Possible conditions (list 2-3 most likely)
      2. Urgency level (low/medium/high/critical)
      3. Recommendations (what to do next)
      
      Consider common conditions in Nigeria. Always recommend consulting healthcare professionals.
      ${userHealthHistory ? `Patient's health history: ${userHealthHistory}` : ''}
      
      Respond in JSON format:
      {
        "possibleConditions": ["condition1", "condition2"],
        "urgency": "medium",
        "recommendations": ["recommendation1", "recommendation2"]
      }`;

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `Please analyze these symptoms: ${symptoms}`
            }
          ],
          max_tokens: 400,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      
      try {
        const analysis = JSON.parse(content);
        return {
          success: true,
          message: 'Analysis completed',
          analysis
        };
      } catch {
        // If JSON parsing fails, return the raw content
        return {
          success: true,
          message: content
        };
      }
    } catch (error) {
      return {
        success: false,
        message: '',
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export const aiService = new AIService();