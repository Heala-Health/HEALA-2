
-- Create a table for symptom rules with Nigerian-specific conditions
CREATE TABLE IF NOT EXISTS public.symptom_rules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symptom_name TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  severity TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  advice TEXT NOT NULL DEFAULT '',
  recommended_action TEXT NOT NULL DEFAULT '',
  specialist_required TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.symptom_rules ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (symptom checker should be accessible to all users)
CREATE POLICY "Public can view active symptom rules" 
  ON public.symptom_rules 
  FOR SELECT 
  USING (is_active = true);

-- Insert common Nigerian illnesses and their symptoms
INSERT INTO public.symptom_rules (symptom_name, keywords, severity, advice, recommended_action, specialist_required) VALUES
-- Malaria
('Malaria', 
 ARRAY['fever', 'chills', 'headache', 'body ache', 'sweating', 'nausea', 'vomiting', 'fatigue', 'weakness', 'joint pain'], 
 'high', 
 'Take plenty of fluids, rest in a cool environment, and use a mosquito net. This is a serious condition common in Nigeria.',
 'Seek immediate medical attention for malaria testing and treatment. Visit the nearest hospital or clinic.',
 'General Practitioner or Internal Medicine'),

-- Typhoid Fever
('Typhoid Fever', 
 ARRAY['persistent fever', 'abdominal pain', 'diarrhea', 'constipation', 'rose-colored rash', 'weakness', 'loss of appetite', 'headache'], 
 'high', 
 'Maintain strict hygiene, drink only clean water, and avoid street food. This requires immediate medical treatment.',
 'Visit a hospital immediately for blood tests (Widal test) and antibiotic treatment.',
 'General Practitioner or Infectious Disease Specialist'),

-- Upper Respiratory Tract Infection (Common Cold/Flu)
('Upper Respiratory Infection', 
 ARRAY['cough', 'sore throat', 'runny nose', 'nasal congestion', 'sneezing', 'mild fever', 'body ache'], 
 'low', 
 'Rest, drink warm fluids, use steam inhalation, and take over-the-counter medications for symptom relief.',
 'Rest at home for 3-5 days. See a doctor if symptoms worsen or persist beyond a week.',
 'General Practitioner'),

-- Gastroenteritis (Stomach Bug)
('Gastroenteritis', 
 ARRAY['diarrhea', 'vomiting', 'stomach pain', 'cramps', 'nausea', 'dehydration', 'loss of appetite'], 
 'medium', 
 'Drink oral rehydration solution (ORS), avoid solid foods initially, and maintain good hygiene.',
 'Stay hydrated with ORS. See a doctor if symptoms persist beyond 2 days or if severe dehydration occurs.',
 'General Practitioner'),

-- Hypertension
('Hypertension (High Blood Pressure)', 
 ARRAY['headache', 'dizziness', 'chest pain', 'shortness of breath', 'blurred vision', 'nosebleed'], 
 'high', 
 'Reduce salt intake, exercise regularly, manage stress, and avoid smoking and excessive alcohol.',
 'Check blood pressure immediately and consult a doctor for proper evaluation and medication.',
 'Cardiologist or General Practitioner'),

-- Diabetes symptoms
('Diabetes', 
 ARRAY['excessive thirst', 'frequent urination', 'unexplained weight loss', 'fatigue', 'blurred vision', 'slow healing wounds'], 
 'high', 
 'Monitor blood sugar levels, maintain a healthy diet, and exercise regularly.',
 'Get blood sugar tests done immediately and consult an endocrinologist or family doctor.',
 'Endocrinologist or General Practitioner'),

-- Pneumonia
('Pneumonia', 
 ARRAY['persistent cough', 'chest pain', 'difficulty breathing', 'rapid breathing', 'fever', 'chills', 'fatigue'], 
 'critical', 
 'This is a serious lung infection that requires immediate medical treatment.',
 'Seek emergency medical care immediately. Go to the nearest hospital.',
 'Pulmonologist or Emergency Medicine'),

-- Skin infections (common in tropical climate)
('Skin Infection', 
 ARRAY['skin rash', 'itching', 'redness', 'swelling', 'pus', 'skin lesions', 'burning sensation'], 
 'medium', 
 'Keep the affected area clean and dry, avoid scratching, and use antiseptic solutions.',
 'Apply topical antiseptics and see a doctor if infection spreads or worsens.',
 'Dermatologist or General Practitioner'),

-- Appendicitis
('Appendicitis', 
 ARRAY['severe abdominal pain', 'pain in lower right abdomen', 'nausea', 'vomiting', 'loss of appetite', 'fever', 'inability to pass gas'], 
 'critical', 
 'This is a medical emergency that requires immediate surgery.',
 'Go to the emergency room immediately. Do not eat or drink anything.',
 'General Surgeon or Emergency Medicine'),

-- Migraine/Severe Headaches
('Migraine', 
 ARRAY['severe headache', 'throbbing pain', 'sensitivity to light', 'sensitivity to sound', 'nausea', 'visual disturbances'], 
 'medium', 
 'Rest in a dark, quiet room, apply cold compress, and stay hydrated.',
 'Take prescribed pain medications and see a neurologist if headaches are frequent.',
 'Neurologist');
