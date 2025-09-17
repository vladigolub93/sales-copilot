'use client';

import { useState } from 'react';

interface StartCallPayload {
  leadId: string;
  phoneNumber: string;
  goal?: string;
}

export function useRetellCall() {
  const [isStarting, setIsStarting] = useState(false);
  const [callId, setCallId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCall = async (payload: StartCallPayload) => {
    setIsStarting(true);
    setError(null);

    try {
      const response = await fetch('/api/calls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('Failed to start call');
      }

      const data = (await response.json()) as { callId: string };
      setCallId(data.callId);
      return data.callId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsStarting(false);
    }
  };

  return { startCall, callId, isStarting, error };
}
