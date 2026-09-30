import { router } from 'expo-router';

import { PhasePreview } from '@/components/navigation/PhasePreview';
import { Button } from '@/components/ui';

export default function NotesScreen() {
  return (
    <PhasePreview
      title="Notes"
      icon="file-text"
      headline="Rich notes, beautifully organised"
      description="Write with headings, checklists, tables and code. Pin, favourite, tag and file notes into notebooks."
      phase={2}
      action={
        <Button title="Browse notebooks" variant="secondary" icon="book" onPress={() => router.push('/notebooks')} />
      }
    />
  );
}
