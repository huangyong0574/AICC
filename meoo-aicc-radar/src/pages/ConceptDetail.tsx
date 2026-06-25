import { motion } from 'framer-motion';
import { ArrowLeft, Lightbulb, Target } from 'lucide-react';
import { concepts, categoryLabels, categoryColors } from '../data/concepts';

interface Props {
  conceptId: string;
  onBack: () => void;
}

export default function ConceptDetail({ conceptId, onBack }: Props) {
  const concept = concepts.find(c => c.id === conceptId);

  if (!concept) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">概念未找到</p>
          <button onClick={onBack} className="text-blue-600 hover:underline">返回</button>
        </div>
      </div>
    );
  }

  const metrics = [
    { label: '成熟度', value: concept.maturity, color: 'bg-blue-500' },
    { label: '影响力', value: concept.impact, color: 'bg-orange-500' },
    { label: '复杂度', value: concept.complexity, color: 'bg-rose-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="sticky top-0 z-10 backdrop-blur-md bg-white/80 border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">{concept.name}</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center gap-3 mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${categoryColors[concept.category]}`}>
              {categoryLabels[concept.category]}
            </span>
            <span className="text-sm text-gray-400">{concept.year}</span>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
            <h2 className="text-sm font-medium text-gray-500 mb-2">核心概述</h2>
            <p className="text-gray-800 leading-relaxed">{concept.summary}</p>
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl p-6 shadow-md mb-6 border border-amber-100">
            <div className="flex items-start gap-3">
              <Lightbulb className="text-amber-500 mt-0.5 shrink-0" size={20} />
              <div>
                <h2 className="text-sm font-medium text-amber-700 mb-1">关键洞察</h2>
                <p className="text-gray-800 leading-relaxed">{concept.keyInsight}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md mb-6">
            <h2 className="text-sm font-medium text-gray-500 mb-4">量化指标</h2>
            <div className="space-y-4">
              {metrics.map(m => (
                <div key={m.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm text-gray-600">{m.label}</span>
                    <span className="text-sm font-medium text-gray-800">{m.value}/100</span>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${m.value}%` }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                      className={`h-full rounded-full ${m.color}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-md">
            <div className="flex items-center gap-2 mb-4">
              <Target size={16} className="text-gray-500" />
              <h2 className="text-sm font-medium text-gray-500">应用场景</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {concept.applications.map(app => (
                <span key={app} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm">
                  {app}
                </span>
              ))}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
