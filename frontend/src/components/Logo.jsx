import { Link } from 'react-router-dom';

export function LogoMark({ size = 18 }) {
  return (
    <span className="logo-mark">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 4v16h13" />
        <path d="M10 14l3-3 2.5 2.5L20 9" strokeOpacity=".85" strokeWidth="2.2" />
      </svg>
    </span>
  );
}

export default function Logo({ to = '/' }) {
  return (
    <Link to={to} className="logo">
      <LogoMark />
      Ledgerly
    </Link>
  );
}
