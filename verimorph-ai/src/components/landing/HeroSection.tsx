import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, Upload, Zap, Globe, FileText, ChevronRight } from 'lucide-react';
import DarkVeil from '@/components/ui/dark-veil';

const features = [
  { icon: Shield, title: 'Forgery Detection', desc: 'Multi-layer morphological analysis with real-time heatmaps' },
  { icon: Globe, title: 'Regional Language Support', desc: 'Tamil, Hindi, English and more via Tesseract OCR engine' },
  { icon: FileText, title: 'Visual Explanation Reports', desc: 'Every AI decision explained, downloadable as PDF or Excel' },
];


interface HeroSectionProps {
  onGetStarted: () => void;
}

export default function HeroSection({ onGetStarted }: HeroSectionProps) {
  const navigate = useNavigate();

  return (
    <section style={{ position: 'relative', minHeight: '100vh' }} className="flex flex-col items-center justify-center overflow-hidden px-4">
      {/* DarkVeil — installed via: npx shadcn@latest add @react-bits/DarkVeil-TS-TW */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <DarkVeil
          hueShift={0}
          noiseIntensity={0}
          scanlineIntensity={0}
          speed={0.5}
          scanlineFrequency={0}
          warpAmount={0}
          resolutionScale={1}
        />
      </div>

      <div className="relative z-10 text-center max-w-4xl mx-auto">

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold text-white leading-tight mb-6 tracking-tight"
        >
          AI-powered Document
          <span className="block text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
            Verification
          </span>
          with Full Explainability
        </motion.h1>

        {/* Sub-headline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto mb-10"
        >
          Detect forgeries in certificates, IDs, and official documents — with human-readable explanations your team can trust.
        </motion.p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <button
            id="hero-get-started"
            onClick={onGetStarted}
            className="group flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-black font-bold text-lg shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all hover:scale-105 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-white/50"
            aria-label="Start document analysis"
          >
            <Upload className="w-5 h-5" />
            Get Started
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          <button
            id="hero-chat-button"
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-white/10 bg-[#111111] hover:bg-[#1a1a1a] hover:border-white/20 text-white font-bold text-lg transition-all hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/30"
            aria-label="Open AI chat assistant"
          >
            💬 Ask AI
          </button>
        </motion.div>


        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              whileHover={{ scale: 1.04, y: -4 }}
              className="relative p-6 rounded-2xl bg-[#111111] border border-white/5 text-left overflow-hidden group hover:border-white/10 hover:shadow-[0_10px_30px_rgba(0,0,0,0.6)]"
            >
              <div className={`inline-flex p-3 rounded-xl bg-black border border-white/5 mb-4 shadow-md`}>
                <Icon className="w-6 h-6 text-app-accent" />
              </div>
              <h3 className="font-bold text-white mb-2">{title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
              <div className={`absolute inset-0 bg-white/0 group-hover:bg-white/[0.02] transition-colors rounded-2xl pointer-events-none`} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Scroll hint */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-slate-500"
      >
        <Zap className="w-5 h-5" />
      </motion.div>
    </section>
  );
}
