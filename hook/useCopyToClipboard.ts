// hooks/useCopyToClipboard.ts
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

export function useCopyToClipboard() {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copy = useCallback(
    async (text: string, label: string = 'Clipboard') => {
      if (!navigator?.clipboard) {
        console.warn('Clipboard not supported');
        return false;
      }

      try {
        await navigator.clipboard.writeText(text);

        setCopiedText(text);

        toast.success(`Copied ${label}`, {
          description:
            text.length > 20
              ? `${text.slice(0, 6)}...${text.slice(-4)}`
              : !isNaN(Number(text))
              ? Number(text).toLocaleString(undefined, {
                  maximumFractionDigits: 6,
                })
              : text,
          duration: 2000,
          action: {
            label: 'Close',
            onClick: () => {},
          },
        });

        setTimeout(() => {
          setCopiedText(null);
        }, 2000);

        return true;
      } catch (error) {
        console.error('Copy failed', error);
        toast.error('Failed to copy');
        setCopiedText(null);
        return false;
      }
    },
    []
  );

  return { copiedText, copy };
}
