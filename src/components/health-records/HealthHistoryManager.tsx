import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FileText, Save, Edit, Info } from 'lucide-react';

export const HealthHistoryManager: React.FC = () => {
  const [healthHistory, setHealthHistory] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedHistory = localStorage.getItem('user_health_history');
    if (savedHistory) {
      setHealthHistory(savedHistory);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('user_health_history', healthHistory);
    setIsEditing(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setSaved(false);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Health History & Medical Records
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="w-4 h-4" />
          <AlertDescription>
            Your health history helps our AI provide more personalized symptom analysis. 
            This information is stored locally on your device and used to enhance AI recommendations.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="health-history">
            Medical History, Allergies, Current Medications, and Chronic Conditions
          </Label>
          {isEditing ? (
            <Textarea
              id="health-history"
              placeholder="Enter your medical history, current medications, allergies, chronic conditions, previous surgeries, family medical history, etc..."
              value={healthHistory}
              onChange={(e) => setHealthHistory(e.target.value)}
              className="min-h-[200px] resize-none"
              rows={8}
            />
          ) : (
            <div className="min-h-[200px] p-3 border rounded-lg bg-gray-50">
              {healthHistory ? (
                <p className="whitespace-pre-wrap text-sm">{healthHistory}</p>
              ) : (
                <p className="text-gray-500 text-sm italic">
                  No health history recorded. Click "Edit" to add your medical information.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSave} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Save Health History
              </Button>
              <Button onClick={() => setIsEditing(false)} variant="outline">
                Cancel
              </Button>
            </>
          ) : (
            <Button onClick={handleEdit} className="flex-1">
              <Edit className="w-4 h-4 mr-2" />
              {healthHistory ? 'Edit Health History' : 'Add Health History'}
            </Button>
          )}
        </div>

        {saved && (
          <Alert>
            <AlertDescription className="text-sm text-green-600">
              Health history saved successfully! This information will be used to enhance AI symptom analysis.
            </AlertDescription>
          </Alert>
        )}

        <Alert>
          <AlertDescription className="text-xs text-gray-600">
            <strong>Privacy Note:</strong> Your health information is stored locally on your device only. 
            It is not transmitted to our servers except when used for AI analysis through your configured API.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};