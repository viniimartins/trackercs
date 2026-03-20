import type { Metadata } from 'next';

import { DemosContent } from './content';

export const metadata: Metadata = {
  title: 'Demos - Tracker CS2',
  description: 'Upload and browse CS2 demo files',
};

export default function DemosPage() {
  return <DemosContent />;
}
