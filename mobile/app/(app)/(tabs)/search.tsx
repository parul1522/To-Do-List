import { PhasePreview } from '@/components/navigation/PhasePreview';

export default function SearchScreen() {
  return (
    <PhasePreview
      title="Search"
      icon="search"
      headline="Find anything, even by meaning"
      description="Keyword search across notes, tags, notebooks and files, plus semantic search that understands what you meant."
      phase={4}
    />
  );
}
