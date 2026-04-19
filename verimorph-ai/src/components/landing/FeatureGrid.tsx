import { motion } from 'framer-motion';
import { Scan, Zap, Eye, Database, Shield, Smartphone, Globe, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const features = [
  { icon: Scan,       title: 'Shape Analysis',        desc: 'Detect layout anomalies and structural inconsistencies' },
  { icon: Zap,        title: 'Morph Hashing',         desc: 'Perceptual fingerprinting to detect pixel-level tampering' },
  { icon: Eye,        title: 'Forgery Heatmap',       desc: 'Visual overlay pinpointing suspicious regions in documents' },
  { icon: Database,   title: 'Offline Mode',          desc: 'Full processing pipeline runs entirely in the browser' },
  { icon: Shield,     title: 'Legacy Compatible',     desc: 'Works with scanned physical documents and old-format files' },
  { icon: Smartphone, title: 'Mobile Ready',          desc: 'Optimized for mobile photo uploads from field officers' },
  { icon: Globe,      title: 'Institution Network',   desc: 'Cross-reference against known institution seal databases' },
  { icon: Clock,      title: 'Real-time Processing',  desc: 'Concurrent multi-file processing with configurable workers' },
];

export default function FeatureGrid() {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-4 bg-black border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Everything You Need to
            <span className="block text-app-accent drop-shadow-[0_0_10px_rgba(34,197,94,0.3)]">
              Verify with Confidence
            </span>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            A complete forensic toolkit powered by AI, running locally in your browser.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {features.map(({ icon: Icon, title, desc, color, bg }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.05, y: -4 }}
              className="p-5 rounded-2xl bg-app-surface border border-white/5 hover:border-white/10 hover:shadow-soft transition-all cursor-default group"
            >
              <div className={`inline-flex p-2.5 rounded-xl bg-black border border-white/5 mb-3`}>
                <Icon className={`w-5 h-5 text-app-accent`} />
              </div>
              <h3 className="font-semibold text-white text-sm mb-1">{title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>

        {/* CTA Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="rounded-2xl bg-app-card border border-white/10 p-10 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(34,197,94,0.05),_transparent_70%)]" />
          <h3 className="text-3xl font-bold text-white mb-3 relative z-10">
            Ready to Transform Your Validation Process?
          </h3>
          <p className="text-slate-400 mb-8 text-lg relative z-10">Join thousands of verification officers using AI-powered document analysis.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <button
              onClick={() => navigate('/upload')}
              className="px-8 py-3 rounded-xl bg-app-accent text-black font-bold hover:brightness-110 transition-all shadow-[0_0_20px_rgba(34,197,94,0.3)]"
            >
              Start Free Trial
            </button>
            <button className="px-8 py-3 rounded-xl border border-white/20 text-white font-bold hover:bg-white/5 transition-all">
              Schedule Demo
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
