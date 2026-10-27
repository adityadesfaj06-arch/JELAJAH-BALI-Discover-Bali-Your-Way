import React, { useState } from 'react';
import { X, Sparkles, Send, CheckCircle2, Route as RouteIcon } from 'lucide-react';
import {
  askGeminiTravelAssistant,
  AiTravelAssistantResponse,
} from '../services/apiClient';
import { useTranslation } from '../i18n/useTranslation';

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyRecommendation: (
    destinationIds: string[],
    vehicleId?: string,
    days?: number,
    travelers?: number
  ) => void;
}

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  onApplyRecommendation,
}) => {
  const { lang, formatMoney } = useTranslation();
  const [prompt, setPrompt] = useState('');
  const [durationDays, setDurationDays] = useState(3);
  const [travelerCount, setTravelerCount] = useState(2);
  const [startArea, setStartArea] = useState('Seminyak / Kuta');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AiTravelAssistantResponse | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await askGeminiTravelAssistant({
        prompt: prompt.trim(),
        lang,
        durationDays,
        travelerCount,
        startArea,
      });
      setResult(res);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts =
    lang === 'en'
      ? [
          '3 days in Ubud, Kintamani sunrise & waterfalls for a couple',
          'Family-friendly South Bali beaches, Uluwatu sunset & Jimbaran seafood',
          '2-day Nusa Penida & Nusa Lembongan island hopping from Sanur',
        ]
      : [
          'Rute 3 hari Ubud, sunrise Kintamani & air terjun untuk pasangan',
          'Wisata ramah keluarga di Bali Selatan, sunset Uluwatu & seafood Jimbaran',
          'Eksplorasi 2 hari Nusa Penida & Nusa Lembongan dari Pelabuhan Sanur',
        ];

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="h-full w-full max-w-lg bg-[#FAF7F2] dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-2xl flex flex-col border-l border-stone-200 dark:border-stone-800">
        <div className="bg-[#103828] px-5 py-4 text-amber-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-300" />
            <div>
              <h2 className="font-serif text-lg font-bold">
                {lang === 'id'
                  ? 'AI Bali Travel Assistant (Gemini)'
                  : 'AI Bali Travel Assistant (Gemini)'}
              </h2>
              <p className="text-[11px] text-amber-200/80">
                {lang === 'id'
                  ? 'Perencana rute searah, estimasi biaya & etika budaya'
                  : 'Directional route planner, budget estimator & cultural guide'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close AI Assistant"
            className="rounded-lg p-1.5 hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-stone-500">
              {lang === 'id' ? 'Contoh Permintaan Cepat:' : 'Quick Prompt Ideas:'}
            </p>
            <div className="flex flex-col gap-1.5">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(qp)}
                  className="text-left rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-800 px-3 py-2 text-xs hover:border-emerald-700 transition"
                >
                  “{qp}”
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3 text-xs">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold mb-1">
                  {lang === 'id' ? 'Durasi (Hari)' : 'Days'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={14}
                  value={durationDays}
                  onChange={(e) => setDurationDays(parseInt(e.target.value, 10) || 3)}
                  className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-2.5 py-1.5 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  {lang === 'id' ? 'Wisatawan' : 'Travelers'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={25}
                  value={travelerCount}
                  onChange={(e) => setTravelerCount(parseInt(e.target.value, 10) || 2)}
                  className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-2.5 py-1.5 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  {lang === 'id' ? 'Area Hotel' : 'Hotel Area'}
                </label>
                <input
                  type="text"
                  value={startArea}
                  onChange={(e) => setStartArea(e.target.value)}
                  className="w-full rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 px-2.5 py-1.5"
                />
              </div>
            </div>

            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                lang === 'id'
                  ? 'Ceritakan rencana liburan Bali impian Anda...'
                  : 'Describe your ideal Bali trip, interests, and budget...'
              }
              className="w-full rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 p-3 text-xs"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-2.5 text-xs font-bold text-stone-950 hover:bg-amber-400 transition"
            >
              <Send className="h-3.5 w-3.5" />
              <span>
                {loading
                  ? lang === 'id'
                    ? 'Menyusun Rencana Perjalanan...'
                    : 'Crafting Bali Itinerary...'
                  : lang === 'id'
                    ? 'Tanyakan ke Asisten AI'
                    : 'Ask AI Travel Assistant'}
              </span>
            </button>
          </form>

          {result && (
            <div className="rounded-2xl border border-emerald-800/30 bg-white dark:bg-stone-800 p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-800 dark:text-emerald-400">
                <span className="inline-flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {result.isLiveGemini
                    ? 'Gemini 3.8 Flash Response'
                    : 'Smart Geographic Route Engine'}
                </span>
                {result.estimatedTotalBudgetIDR && (
                  <span className="font-mono">
                    Est. {formatMoney(result.estimatedTotalBudgetIDR)}
                  </span>
                )}
              </div>

              <p className="leading-relaxed text-stone-700 dark:text-stone-200 whitespace-pre-line">
                {result.reply}
              </p>

              <button
                onClick={() => {
                  onApplyRecommendation(
                    result.recommendedDestinationIds,
                    result.recommendedVehicleId,
                    durationDays,
                    travelerCount
                  );
                  onClose();
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#103828] px-4 py-2.5 text-xs font-semibold text-amber-50 hover:bg-[#174d38]"
              >
                <RouteIcon className="h-4 w-4" />
                <span>
                  {lang === 'id'
                    ? `Muat ${result.recommendedDestinationIds.length} Destinasi Ini ke Trip Planner`
                    : `Load These ${result.recommendedDestinationIds.length} Stops into Trip Planner`}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
