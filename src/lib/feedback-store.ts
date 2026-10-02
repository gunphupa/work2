import { mkdir, readFile, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { catalog } from '@/data/catalog';
import { feedbackSchema, type FeedbackInput, type FeedbackRecord } from './feedback-schema';
export interface FeedbackStore {
  save(input: FeedbackInput): Promise<{ duplicate: boolean }>;
  list(): Promise<FeedbackRecord[]>;
}
export class FileFeedbackStore implements FeedbackStore {
  private queue: Promise<unknown> = Promise.resolve();
  constructor(private directory: string) {}
  private get file() {
    return path.join(this.directory, 'feedback.jsonl');
  }
  async list(): Promise<FeedbackRecord[]> {
    let content: string;
    try {
      content = await readFile(this.file, 'utf8');
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
    return content
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const record = JSON.parse(line);
        const input = feedbackSchema.parse(
          Object.fromEntries(
            Object.entries(record).filter(([key]) => key !== 'timestamp' && key !== 'category'),
          ),
        );
        if (typeof record.timestamp !== 'string' || typeof record.category !== 'string')
          throw new Error('Invalid stored record');
        return { ...input, timestamp: record.timestamp, category: record.category };
      });
  }
  save(input: FeedbackInput): Promise<{ duplicate: boolean }> {
    const operation = this.queue.then(async () => {
      const validated = feedbackSchema.parse(input);
      const records = await this.list();
      if (records.some((r) => r.sessionId === validated.sessionId)) return { duplicate: true };
      await mkdir(this.directory, { recursive: true, mode: 0o700 });
      const record: FeedbackRecord = {
        ...validated,
        category: catalog.find((f) => f.id === validated.flowId)!.category,
        timestamp: new Date().toISOString(),
      };
      await appendFile(this.file, JSON.stringify(record) + '\n', { mode: 0o600 });
      return { duplicate: false };
    });
    this.queue = operation.catch(() => {});
    return operation;
  }
}
export const feedbackStore = new FileFeedbackStore(
  process.env.FIXFLOW_DATA_DIR || path.join(process.cwd(), '.data'),
);
