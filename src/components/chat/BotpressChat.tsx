
import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

export const BotpressChat: React.FC = () => {
  useEffect(() => {
    // Create script element for Botpress
    const script = document.createElement('script');
    script.src = 'https://cdn.botpress.cloud/webchat/v3.0/shareable.html?configUrl=https://files.bpcontent.cloud/2025/06/08/20/20250608203313-B2N3785R.json';
    script.async = true;
    
    // Add the script to the document
    document.head.appendChild(script);
    
    // Cleanup function to remove script when component unmounts
    return () => {
      const existingScript = document.querySelector(`script[src="${script.src}"]`);
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  return (
    <Card className="h-full bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
          <MessageCircle className="w-5 h-5" />
          AI Health Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[600px]">
        <div className="w-full h-full flex items-center justify-center">
          <iframe
            src="https://cdn.botpress.cloud/webchat/v3.0/shareable.html?configUrl=https://files.bpcontent.cloud/2025/06/08/20/20250608203313-B2N3785R.json"
            width="100%"
            height="100%"
            frameBorder="0"
            className="rounded-md"
            title="Botpress AI Chat"
          />
        </div>
      </CardContent>
    </Card>
  );
};
