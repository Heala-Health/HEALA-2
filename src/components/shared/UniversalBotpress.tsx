
import React from 'react';

export const UniversalBotpress: React.FC = () => {
  return (
    <div className="w-full h-[600px] border rounded-lg overflow-hidden bg-white">
      <iframe
        src="https://cdn.botpress.cloud/webchat/v3.0/shareable.html?configUrl=https://files.bpcontent.cloud/2025/06/08/20/20250608203313-B2N3785R.json"
        width="100%"
        height="100%"
        frameBorder="0"
        title="AI Health Assistant"
        className="w-full h-full rounded-lg"
        allow="microphone; camera"
      />
    </div>
  );
};
