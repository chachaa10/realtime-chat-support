import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { useLabels } from '../hooks/useLabels';
import { useCreateTicket } from '../hooks/useTicketMutations';

export function CreateTicketForm() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);

  const { data: labels } = useLabels();
  const createMutation = useCreateTicket();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    try {
      const ticket = await createMutation.mutateAsync({
        subject: subject.trim(),
        description: description.trim(),
        labelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
      });
      navigate({ to: '/tickets/$ticketId', params: { ticketId: ticket.id.toString() } });
    } catch {
      // error handled by mutation state
    }
  };

  const toggleLabel = (id: number) => {
    setSelectedLabelIds((prev) =>
      prev.includes(id) ? prev.filter((lid) => lid !== id) : [...prev, id],
    );
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-ink text-[1.25rem] font-semibold">Create Ticket</h1>
        <p className="text-ink-muted mt-0.5 text-[0.8125rem]">
          Describe your issue and we will connect you with a support agent.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Brief summary of your issue"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your issue in detail..."
          required
          rows={5}
          className="border-border bg-surface placeholder:text-ink-dim focus-visible:border-ring focus-visible:ring-ring/50 w-full rounded-lg border px-3 py-2 text-[0.875rem] transition-colors outline-none focus-visible:ring-3"
        />
      </div>

      {labels && labels.length > 0 && (
        <div className="space-y-2">
          <Label>Labels (optional)</Label>
          <div className="flex flex-wrap gap-2">
            {labels.map((label) => (
              <button
                key={label.id}
                type="button"
                onClick={() => toggleLabel(label.id)}
                className={`inline-flex h-7 items-center rounded-full px-3 text-[0.75rem] font-medium transition-all ${
                  selectedLabelIds.includes(label.id)
                    ? 'ring-2 ring-offset-1'
                    : 'opacity-70 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: label.color + '20',
                  color: label.color,
                }}
              >
                {label.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <Button type="submit" disabled={createMutation.isPending} className="w-full">
        {createMutation.isPending ? 'Creating...' : 'Create Ticket'}
      </Button>

      {createMutation.isError && (
        <p className="text-danger text-[0.8125rem]">
          {createMutation.error instanceof Error
            ? createMutation.error.message
            : 'Failed to create ticket'}
        </p>
      )}
    </form>
  );
}
