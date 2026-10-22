import { useEffect, useRef } from 'react';
import { animate } from 'framer-motion';

// Counts smoothly from the previously shown value to the new one.
export default function AnimatedNumber({ value, format = (v) => Math.round(v).toString(), duration = 1.1 }) {
  const ref = useRef(null);
  const current = useRef(0);

  useEffect(() => {
    const controls = animate(current.current, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => {
        current.current = v;
        if (ref.current) ref.current.textContent = format(v);
      },
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <span ref={ref}>{format(0)}</span>;
}
