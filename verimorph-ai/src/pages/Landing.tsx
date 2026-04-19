// ============================================================
// Landing Page — PART 7e / PART 8
// Hero section with DarkVeil (animated dark veil background)
// Feature grid, CTA buttons
// ============================================================
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import HeroSection from '../components/landing/HeroSection';
import FeatureGrid from '../components/landing/FeatureGrid';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black">
      <HeroSection onGetStarted={() => navigate('/upload')} />
      <FeatureGrid />

      {/* CTA Section */}
      <section className="py-24 px-6 text-center bg-black border-t border-white/5 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(34,197,94,0.05),_transparent_70%)]" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto"
        >
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Ready to detect forgeries?
          </h2>
          <p className="text-slate-400 text-lg mb-8">
            Upload any document and get AI-powered forensic analysis in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/upload')}
              id="cta-upload-button"
              className="
                px-8 py-4 rounded-2xl font-bold text-black text-lg
                bg-app-accent
                hover:bg-app-accent-hover hover:brightness-110
                shadow-[0_0_20px_rgba(34,197,94,0.3)]
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-app-accent
              "
              aria-label="Start document analysis"
            >
              🔬 Start Analysis
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/chat')}
              id="cta-chat-button"
              className="
                px-8 py-4 rounded-2xl font-bold text-slate-300 text-lg
                border border-white/10 bg-transparent
                hover:text-white hover:bg-[#111111] hover:border-white/20
                transition-all duration-200
                focus:outline-none focus:ring-2 focus:ring-slate-500
              "
              aria-label="Open AI chat"
            >
              💬 Ask AI
            </motion.button>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
