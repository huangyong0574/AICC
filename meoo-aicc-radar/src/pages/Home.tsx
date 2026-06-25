import { useState } from 'react';
import { motion } from 'framer-motion';
import { Radar, Filter } from 'lucide-react';
import { concepts, categoryLabels, Concept } from '../data/concepts';
import ConceptCard from '../components/ConceptCard';

interface Props {
  onNavigate: (id: string) => void;
}

type FilterType = 'all' | Concept['category'];

export default function Home({ onNavigate }: Props) {
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = filter === 'all' ? concepts : concepts.filter(c => c.category === filter);

  const filters: { key: FilterType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'frontier', label: categoryLabels.frontier },
    { key: 'mature', label: categoryLabels.mature },
    { key: 'emerging', label: categoryLabels.emerging },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="sticky top-0 z-10 backdrop-blur-md bg-white/80 border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radar className="text-blue-600" size={24} />
            <h1 className="text-xl font-bold text-gray-900">AICC 概念雷达</h1>
          </div>
          <span className="text-sm text-gray-400">{concepts.length} 个概念</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <Filter size={14} className="text-gray-400" />
            <span className="text-sm text-gray-500">筛选分类</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  filter === f.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((concept, i) => (
            <ConceptCard
              key={concept.id}
              concept={concept}
              index={i}
              onClick={() => onNavigate(concept.id)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            暂无匹配的概念
          </div>
        )}
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-8 text-center text-xs text-gray-400">
        AICC AI Concept Radar — Powered by Meoo
      </footer>
    </div>
  );
}
