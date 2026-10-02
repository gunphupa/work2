import { feedbackStore } from '../src/lib/feedback-store';
import { summarize, toCsv } from '../src/lib/results';
const args = process.argv.slice(2);
const format = args.includes('--csv') ? 'csv' : args.includes('--summary') ? 'summary' : 'json';
try {
  const records = await feedbackStore.list();
  process.stdout.write(
    (format === 'csv'
      ? toCsv(records)
      : JSON.stringify(
          format === 'summary'
            ? summarize(records)
            : records.map((record) =>
                Object.fromEntries(Object.entries(record).filter(([key]) => key !== 'sessionId')),
              ),
          null,
          2,
        )) + '\n',
  );
} catch {
  console.error('Could not read feedback. Check FIXFLOW_DATA_DIR and file permissions.');
  process.exitCode = 1;
}
