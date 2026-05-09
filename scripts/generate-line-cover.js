import fs from 'fs';
import sharp from 'sharp';

const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 878" width="1080" height="878">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" /> <!-- slate-900 -->
      <stop offset="50%" stop-color="#1e1b4b" /> <!-- indigo-950 -->
      <stop offset="100%" stop-color="#020617" /> <!-- slate-950 -->
    </linearGradient>

    <!-- Logo Gradient -->
    <linearGradient id="vccGradLight" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#60A5FA"/>
      <stop offset="100%" stop-color="#818CF8"/>
    </linearGradient>
    
    <!-- Accent Gradient for subtle background shapes -->
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.1" />
      <stop offset="100%" stop-color="#6366f1" stop-opacity="0.05" />
    </linearGradient>

    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1080" height="878" fill="url(#bgGrad)"/>
  
  <!-- Decorative Abstract Shapes -->
  <circle cx="900" cy="150" r="300" fill="url(#accentGrad)" />
  <circle cx="100" cy="800" r="400" fill="url(#accentGrad)" />
  <polygon points="1080,0 1080,400 600,0" fill="url(#accentGrad)" />

  <!-- Centered Content Group -->
  <!-- Scale 2x, Center horizontally (1080/2 = 540) and vertically (878/2 = 439) -->
  <g transform="translate(140, 319) scale(2)">
    <!-- Logo SVG content from logo-light.svg -->
    <g transform="translate(30,5)">
      <g style="filter: url(#glow);">
        <!-- Isometric Mark -->
        <path fill="#FFFFFF" d="M0 30l40-20v60l-40 20z"/>
        <path fill="url(#vccGradLight)" d="M40 10l40 20v60l-40-20z"/>
        <path fill="#FFFFFF" fill-opacity="0.3" d="M0 30l40-20 40 20-40 20z"/>
      </g>
    </g>
    
    <!-- Text -->
    <text x="135" y="60" style="font-family: system-ui, -apple-system, sans-serif; font-size: 48px; font-weight: 800; fill: #FFFFFF;">
      VCC<tspan fill="#60A5FA" font-weight="400"> ASSET</tspan>
    </text>
    <text x="138" y="87" style="font-family: system-ui, -apple-system, sans-serif; font-size: 14px; font-weight: 600; fill: #94A3B8; letter-spacing: 5px;">
      PREMIUM REAL ESTATE
    </text>
  </g>

  <!-- Tagline / Status Text -->


  <!-- Premium Line Decoration -->
</svg>
`;

fs.writeFileSync('public/images/branding/vcc-asset/line-cover.svg', svgContent);

sharp(Buffer.from(svgContent))
  .png()
  .toFile('public/images/branding/vcc-asset/line-cover.png')
  .then(() => {
    console.log('Successfully generated line-cover.png and line-cover.svg');
  })
  .catch(err => {
    console.error('Error generating image:', err);
  });
