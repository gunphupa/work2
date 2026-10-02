import { notFound } from 'next/navigation';
import { Diagnostic } from '@/components/diagnostic';
import { getFlow } from '@/data/flows';
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const flow = getFlow((await params).id);
  return { title: flow?.title.en ?? 'Problem not found' };
}
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const flow = getFlow((await params).id);
  if (!flow) notFound();
  return <Diagnostic key={flow.id} flow={flow} />;
}
