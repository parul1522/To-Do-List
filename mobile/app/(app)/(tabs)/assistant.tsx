import { PhasePreview } from '@/components/navigation/PhasePreview';

export default function AssistantScreen() {
  return (
    <PhasePreview
      title="Assistant"
      icon="zap"
      headline="Ask your notes anything"
      description="Summaries, study plans and answers grounded in your own notes — always with the sources it used."
      phase={6}
    />
  );
}
