import { useNavigate } from '@tanstack/react-router';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

import { SkeletonLabelPills } from '@/components/ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadFile } from '@/lib/api/uploads';

import { useLabels } from '../hooks/useLabels';
import { useCreateTicket } from '../hooks/useTicketMutations';

interface SelectedFile {
  file: File;
  id: string;
}

export function CreateTicketForm() {
  const navigate = useNavigate();
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<number[]>([]);
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: labels, isLoading: labelsLoading } = useLabels();
  const createMutation = useCreateTicket();

  const isPending = createMutation.isPending || uploading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) return;

    try {
      const ticket = await createMutation.mutateAsync({
        subject: subject.trim(),
        description: description.trim(),
        labelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
      });

      if (files.length > 0) {
        setUploading(true);
        await Promise.all(files.map(({ file }) => uploadFile(file, ticket.id)));
      }

      navigate({ to: '/tickets/$ticketId', params: { ticketId: ticket.id.toString() } });
    } catch {
      // error handled by mutation state or caught below
    } finally {
      setUploading(false);
    }
  };

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files;
    if (!selected) return;

    const newFiles: SelectedFile[] = [];
    for (const file of selected) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} must be smaller than 10MB`);
        continue;
      }
      newFiles.push({ file, id: crypto.randomUUID() });
    }
    setFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removeFile(id: string) {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

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

      <div className="space-y-2">
        <Label>Labels (optional)</Label>
        {labelsLoading ? (
          <SkeletonLabelPills />
        ) : labels && labels.length > 0 ? (
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
        ) : null}
      </div>

      <div className="space-y-2">
        <Label>Attachments (optional)</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
          className="hidden"
          multiple
          onChange={handleFileSelect}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
            className="border-border text-ink-muted hover:text-ink hover:bg-surface inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[0.8125rem] font-medium transition-colors disabled:opacity-40"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Add Attachments
          </button>
          <p className="text-ink-dim w-full text-[0.75rem]">
            Max 10MB per file. Accepted: images, PDF, Word, Excel, CSV, text
          </p>
        </div>
        {files.length > 0 && (
          <ul className="space-y-1">
            {files.map((f) => (
              <li
                key={f.id}
                className="border-border text-ink-muted flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[0.8125rem]"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                <span className="flex-1 truncate">{f.file.name}</span>
                <span className="text-ink-dim shrink-0">{formatSize(f.file.size)}</span>
                <button
                  type="button"
                  onClick={() => removeFile(f.id)}
                  disabled={isPending}
                  className="text-ink-dim hover:text-danger ml-1 shrink-0 transition-colors disabled:opacity-40"
                  aria-label={`Remove ${f.file.name}`}
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && (
          <svg className="mr-2 -ml-1 size-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="31.4 31.4"
              strokeLinecap="round"
              className="opacity-20"
            />
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="3"
              strokeDasharray="31.4 31.4"
              strokeDashoffset="8"
              strokeLinecap="round"
            />
          </svg>
        )}
        {uploading
          ? 'Uploading attachments...'
          : createMutation.isPending
            ? 'Creating...'
            : 'Create Ticket'}
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
