import { motion } from 'framer-motion';
import Background from './Background.jsx';
import { LogoMark } from './Logo.jsx';

export default function Splash() {
  return (
    <div className="splash">
      <Background />
      <motion.div
        className="above"
        animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <LogoMark size={26} />
      </motion.div>
    </div>
  );
}
