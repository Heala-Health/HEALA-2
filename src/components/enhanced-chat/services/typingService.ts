
import { useRef } from 'react';

export const useTypingIndicator = () => {
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const handleTyping = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      // Clear typing after 3 seconds
    }, 3000);
  };

  const cleanup = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  return { handleTyping, cleanup };
};
