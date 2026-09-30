import { PhasePreview } from '@/components/navigation/PhasePreview';

export default function TasksScreen() {
  return (
    <PhasePreview
      title="Tasks"
      icon="check-square"
      headline="Today, upcoming and done"
      description="Standalone tasks and checklists inside notes, with due dates, priorities, reminders and repeats."
      phase={3}
    />
  );
}
