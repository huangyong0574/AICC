import { motion } from 'framer-motion';
import { Radar, Zap, Brain } from 'lucide-react';
import { Concept, categoryLabels, categoryColors } from '../data/concepts';

interface Props {
  concept: Concept;
  index: number;
  onClick: () => void;
}

const catIcons = {
  frontier: Radar,
  mature: Zap,
  emerging: Brain,
};

export default function ConceptCard({ concept, index, onClick }: Props) {
  const Icon = catIcons[concept.category];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      onClick={onClick}
      className="cursor-pointer rounded-2xl bg-white p-5 shadow-md hover:shadow-xl transition-shadow border border-gray-100"
    >
      <div className="flex items-center justify-between mb-3">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${categoryColors[concept.category]}`}>
          <Icon size={12} />
          {categoryLabels[concept.category]}
        </span>
        <span className="text-xs text-gray-400">{concept.year}</span>
      </div>

      <h3 className="text-lg font-bold text-gray-900 mb-1">{concept.shortName}</h3>
      <p className="text-sm text-gray-500 mb-3 leading-snug">{concept.summary}</p>

      <div className="space-y-2">
        <MetricBar label="成熟度" value={concept.maturity} color="bg-blue-500" />
        <MetricBar label="影响力" value={concept.impact} color="bg-orange-500" />
        <MetricBar label="复杂度" value={concept.complexity} color="bg-rose-500" />
      </div>
    </motion.div>
  );
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 w-12 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-gray-500 w-8 text-right">{value}</span>
    </div>
  );
}
