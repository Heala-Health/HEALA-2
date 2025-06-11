
export class AIBot {
  private static symptoms = {
    fever: ['fever', 'temperature', 'hot', 'chills', 'burning up'],
    headache: ['headache', 'head pain', 'migraine', 'head hurt'],
    cough: ['cough', 'coughing', 'hack', 'phlegm'],
    sore_throat: ['sore throat', 'throat pain', 'swallow hurt', 'throat ache'],
    nausea: ['nausea', 'sick', 'vomit', 'throw up', 'queasy'],
    fatigue: ['tired', 'fatigue', 'exhausted', 'weak', 'no energy'],
    chest_pain: ['chest pain', 'chest hurt', 'chest tight', 'heart pain'],
    shortness_of_breath: ['shortness of breath', 'hard to breathe', 'breathing difficult', 'cant breathe'],
    stomach_pain: ['stomach pain', 'belly hurt', 'abdominal pain', 'tummy ache'],
  };

  private static conditions = {
    common_cold: {
      symptoms: ['cough', 'sore_throat', 'fatigue'],
      advice: 'This sounds like a common cold. Rest, stay hydrated, and consider over-the-counter medications. If symptoms persist beyond 7-10 days, consult a doctor.',
      urgency: 'low'
    },
    flu: {
      symptoms: ['fever', 'headache', 'fatigue', 'cough'],
      advice: 'These symptoms suggest flu. Rest, drink plenty of fluids, and consider antiviral medication if seen within 48 hours. Seek medical attention if symptoms worsen.',
      urgency: 'medium'
    },
    gastroenteritis: {
      symptoms: ['nausea', 'stomach_pain', 'fatigue'],
      advice: 'This could be gastroenteritis (stomach flu). Stay hydrated with clear fluids, rest, and eat bland foods when able. Contact a doctor if symptoms are severe.',
      urgency: 'medium'
    },
    heart_emergency: {
      symptoms: ['chest_pain', 'shortness_of_breath'],
      advice: 'URGENT: These symptoms could indicate a heart condition. Seek immediate medical attention or call emergency services.',
      urgency: 'high'
    },
    respiratory_emergency: {
      symptoms: ['shortness_of_breath', 'chest_pain', 'fever'],
      advice: 'These symptoms require immediate medical attention. Please visit an emergency room or urgent care center.',
      urgency: 'high'
    }
  };

  static getDiagnosisResponse(userMessage: string): string {
    const message = userMessage.toLowerCase();
    const detectedSymptoms: string[] = [];

    // Detect symptoms from user message
    Object.entries(this.symptoms).forEach(([symptom, keywords]) => {
      if (keywords.some(keyword => message.includes(keyword))) {
        detectedSymptoms.push(symptom);
      }
    });

    if (detectedSymptoms.length === 0) {
      return "I understand you're not feeling well. Could you describe your symptoms in more detail? For example, are you experiencing fever, pain, nausea, or any other specific symptoms?";
    }

    // Find matching conditions
    const possibleConditions = Object.entries(this.conditions).filter(([_, condition]) => {
      const matchingSymptoms = condition.symptoms.filter(symptom => 
        detectedSymptoms.includes(symptom)
      );
      return matchingSymptoms.length >= Math.min(2, condition.symptoms.length);
    });

    if (possibleConditions.length === 0) {
      return `I noticed you mentioned symptoms like ${detectedSymptoms.join(', ')}. While I can provide general information, I recommend consulting with a healthcare professional for proper diagnosis and treatment. Would you like to chat with one of our physicians?`;
    }

    // Sort by urgency and number of matching symptoms
    possibleConditions.sort((a, b) => {
      const urgencyOrder = { high: 3, medium: 2, low: 1 };
      return urgencyOrder[b[1].urgency as keyof typeof urgencyOrder] - urgencyOrder[a[1].urgency as keyof typeof urgencyOrder];
    });

    const topCondition = possibleConditions[0][1];
    
    let response = `Based on the symptoms you've described (${detectedSymptoms.join(', ')}), ${topCondition.advice}`;

    if (topCondition.urgency === 'high') {
      response += "\n\n🚨 **IMPORTANT**: This is not a substitute for professional medical advice. Please seek immediate medical attention.";
    } else {
      response += "\n\nRemember, this is general information only. For personalized medical advice, please consult with a healthcare professional. Would you like to connect with one of our physicians?";
    }

    return response;
  }

  static getGreeting(): string {
    return "Hello! I'm your AI Health Assistant. I can help provide general information about symptoms and when to seek medical care. Please describe how you're feeling or what symptoms you're experiencing. \n\n**Important**: I provide general information only and cannot replace professional medical advice.";
  }
}
