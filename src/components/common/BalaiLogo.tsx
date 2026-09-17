import React from 'react';

interface BalaiLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'icon';
  lightText?: boolean;
}

export const BalaiLogo: React.FC<BalaiLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'icon',
  lightText = false,
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const svgDimensions = sizeClasses[size];

  const emblem = (
    <svg
      className={`${svgDimensions} ${className} shrink-0 transition-transform duration-200 hover:scale-105`}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Balai Logo"
    >
      {/* Outer Shield & Roof Crest */}
      <g stroke="#0F172A" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round">
        {/* Top Pitched Roof with Overhangs */}
        <path d="M 25 68 L 100 42 L 175 68" />
        
        {/* Shield Outline curving down to base */}
        <path d="M 30 72 L 30 102 C 30 148 68 178 100 182 C 132 178 170 148 170 102 L 170 72" />

        {/* Central Vertical Divider */}
        <path d="M 100 52 L 100 135" />

        {/* Left Compartment: House & Architecture Structures */}
        <path d="M 40 76 L 40 92 L 65 92" />
        <path d="M 65 74 L 65 138" />
        <path d="M 65 74 L 92 64 L 92 136" />
        <path d="M 75 75 L 75 88 L 86 88" />
        <rect x="75" y="98" width="11" height="14" rx="2" fill="none" />
        <rect x="47" y="104" width="10" height="12" rx="1.5" fill="none" />
        <path d="M 40 96 L 57 96 L 57 132" />
        <path d="M 75 120 L 86 120" />

        {/* Right Compartment: Upper Water Waves */}
        <path d="M 100 68 C 120 62 145 74 165 68" />
        <path d="M 100 82 C 118 76 138 90 162 82" />
        <path d="M 104 94 C 120 86 136 100 156 94" />
        
        {/* Right Compartment: Utility Divider */}
        <path d="M 100 106 C 120 106 142 108 160 114" />
      </g>

      {/* Golden Lightning Bolt in lower right quadrant */}
      <path
        d="M 126 112 L 121 122 L 127 122 L 123 134 L 132 121 L 126 121 Z"
        fill="#EAB308"
        stroke="#CA8A04"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Bottom Symmetrical Inner Shield Accent Wings */}
      <path
        d="M 38 106 C 42 142 68 164 92 168"
        stroke="#0F172A"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 162 106 C 158 142 132 164 108 168"
        stroke="#0F172A"
        strokeWidth="5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Center Sprout Stem */}
      <path
        d="M 100 182 L 100 135"
        stroke="#0F172A"
        strokeWidth="6"
        strokeLinecap="round"
      />

      {/* Three Green Leaves (Center, Left, Right) */}
      <g fill="#22C55E" stroke="#0F172A" strokeWidth="4.5" strokeLinejoin="round">
        {/* Center upright leaf */}
        <path d="M 100 114 C 108 124 108 136 100 144 C 92 136 92 124 100 114 Z" />
        {/* Left leaf */}
        <path d="M 100 142 C 86 138 78 144 80 154 C 90 158 98 152 100 142 Z" />
        {/* Right leaf */}
        <path d="M 100 142 C 114 138 122 144 120 154 C 110 158 102 152 100 142 Z" />
      </g>
    </svg>
  );

  if (variant === 'icon') {
    return emblem;
  }

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {emblem}
      <div>
        <h1
          className={`font-bold tracking-tight leading-none ${
            lightText ? 'text-white' : 'text-[#0F172A]'
          } ${size === 'lg' || size === 'xl' ? 'text-2xl' : 'text-lg'}`}
        >
          Balai
        </h1>
        <p
          className={`text-xs font-medium mt-0.5 ${
            lightText ? 'text-slate-400' : 'text-slate-500'
          }`}
        >
          Rental & Utility Ledger
        </p>
      </div>
    </div>
  );
};
