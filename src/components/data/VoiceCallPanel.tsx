'use client';

import { useState } from 'react';
import { PhoneCall } from 'lucide-react';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Textarea } from '@components/ui/Textarea';
import { useRetellCall } from '@hooks/useRetellCall';

interface VoiceCallPanelProps {
  leadId: string;
  defaultPhone?: string;
}

export function VoiceCallPanel({ leadId, defaultPhone }: VoiceCallPanelProps) {
  const [phoneNumber, setPhoneNumber] = useState(defaultPhone ?? '');
  const [goal, setGoal] = useState('Understand needs and schedule demo.');
  const { startCall, callId, isStarting, error } = useRetellCall();

  const handleStartCall = async () => {
    await startCall({ leadId, phoneNumber, goal });
  };

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Phone number</label>
        <Input
          placeholder="+1 (555) 123-4567"
          value={phoneNumber}
          onChange={(event) => setPhoneNumber(event.target.value)}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium uppercase tracking-wide text-slate-400">Call goal</label>
        <Textarea
          placeholder="Share call objectives or context for Retell"
          value={goal}
          onChange={(event) => setGoal(event.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={handleStartCall} disabled={isStarting || phoneNumber.length === 0}>
          <PhoneCall className="mr-2 h-4 w-4" />
          {isStarting ? 'Starting call…' : 'Launch AI voice call'}
        </Button>
        {callId ? <p className="text-xs text-brand-200">Active call ID: {callId}</p> : null}
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
      </div>
    </div>
  );
}
