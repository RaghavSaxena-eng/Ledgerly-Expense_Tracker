import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import Background from './Background.jsx';
import Logo from './Logo.jsx';
import { ease } from '../lib/motion.js';

export default function AuthShell({ title, headline, blurb, children }) {
  return (
    <div className="auth">
      <Background />
      <aside className="auth-side above">
        <Logo />
        <div>
          <h2>{headline}</h2>
          <p>{blurb}</p>
        </div>
        <div className="auth-quote">
          <p>Every query runs against your workspace only. Teammates see what you share, and no one outside ever does.</p>
          <div>
            <ShieldCheck size={18} color="#12a66a" />
            Workspace isolation, built in
          </div>
        </div>
      </aside>
      <main className="auth-main above">
        <motion.div
          className="auth-form"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease }}
        >
          <div>
            <h1>{title}</h1>
          </div>
          {children}
        </motion.div>
      </main>
    </div>
  );
}
