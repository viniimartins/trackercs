import type { Metadata } from 'next';

import { DemoViewerContent } from './content';

export const metadata: Metadata = {
  title: 'Demo Viewer - Tracker CS2',
  description: 'CS2 Radar Viewer with Playback',
};

export default async function DemoViewerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <DemoViewerContent id={id} />;
}
