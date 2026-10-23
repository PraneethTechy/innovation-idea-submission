svg_content = '''<svg viewBox="0 0 480 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Soft Aura Glow Filter -->
    <filter id="softAura" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="9" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Filament Glow Filter -->
    <filter id="filamentGlow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="3.5" result="glow"/>
      <feMerge>
        <feMergeNode in="glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- Badge Drop Shadow -->
    <filter id="badgeShadow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#4C1D95" flood-opacity="0.32"/>
    </filter>

    <!-- Bulb Outer Aura Radial Gradient -->
    <radialGradient id="bulbAura" cx="50%" cy="46%" r="52%">
      <stop offset="0%" stop-color="#FEF08A" stop-opacity="0.95"/>
      <stop offset="35%" stop-color="#FDE047" stop-opacity="0.7"/>
      <stop offset="60%" stop-color="#F472B6" stop-opacity="0.4"/>
      <stop offset="85%" stop-color="#A855F7" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#8B5CF6" stop-opacity="0"/>
    </radialGradient>

    <!-- Bulb Core Glass 3D Gradient -->
    <radialGradient id="bulbGlass" cx="36%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.98"/>
      <stop offset="20%" stop-color="#FEF08A" stop-opacity="0.95"/>
      <stop offset="44%" stop-color="#FBBF24" stop-opacity="0.92"/>
      <stop offset="68%" stop-color="#F472B6" stop-opacity="0.88"/>
      <stop offset="88%" stop-color="#A855F7" stop-opacity="0.92"/>
      <stop offset="100%" stop-color="#6366F1" stop-opacity="0.96"/>
    </radialGradient>

    <!-- Filament Gradient -->
    <linearGradient id="filamentGrad" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#FEF08A"/>
      <stop offset="50%" stop-color="#FFFFFF"/>
      <stop offset="100%" stop-color="#FDE047"/>
    </linearGradient>

    <!-- Socket Threads Metallic Gradient -->
    <linearGradient id="socketGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1E1B4B"/>
      <stop offset="25%" stop-color="#312E81"/>
      <stop offset="50%" stop-color="#581C87"/>
      <stop offset="75%" stop-color="#312E81"/>
      <stop offset="100%" stop-color="#1E1B4B"/>
    </linearGradient>

    <!-- Crystal Gradients -->
    <linearGradient id="cTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E0F2FE"/>
      <stop offset="100%" stop-color="#BAE6FD"/>
    </linearGradient>
    <linearGradient id="cLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8"/>
      <stop offset="100%" stop-color="#0284C7"/>
    </linearGradient>
    <linearGradient id="cRightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#818CF8"/>
      <stop offset="100%" stop-color="#4F46E5"/>
    </linearGradient>

    <linearGradient id="cLeftPrism1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#C084FC"/>
      <stop offset="100%" stop-color="#7E22CE"/>
    </linearGradient>
    <linearGradient id="cLeftPrism2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E9D5FF"/>
      <stop offset="100%" stop-color="#A855F7"/>
    </linearGradient>

    <linearGradient id="cRightPrism1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#A78BFA"/>
      <stop offset="100%" stop-color="#6D28D9"/>
    </linearGradient>
    <linearGradient id="cRightPrism2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#DDD6FE"/>
      <stop offset="100%" stop-color="#8B5CF6"/>
    </linearGradient>

    <!-- Badge Linear Gradient -->
    <linearGradient id="badgeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8B5CF6"/>
      <stop offset="45%" stop-color="#7C3AED"/>
      <stop offset="100%" stop-color="#6D28D9"/>
    </linearGradient>
  </defs>

  <!-- ================= BACKGROUND AURA (FADES TO 0 OPACITY) ================= -->
  <circle cx="250" cy="74" r="86" fill="url(#bulbAura)" filter="url(#softAura)"/>
  <circle cx="250" cy="74" r="66" fill="url(#bulbAura)" opacity="0.8"/>

  <!-- ================= DOTTED CONNECTING CURVES ================= -->
  <g stroke="#C4B5FD" stroke-width="1.6" stroke-dasharray="3,3" fill="none" opacity="0.85">
    <path d="M 168 54 C 192 56, 210 65, 224 72"/>
    <path d="M 168 120 C 192 118, 212 112, 226 102"/>
    <path d="M 354 60 C 326 62, 304 70, 284 76"/>
    <path d="M 354 126 C 326 124, 302 116, 280 106"/>
  </g>

  <!-- ================= INSPIRATIONAL SCRIPT TEXT ================= -->
  <g transform="translate(16, 0)">
    <g transform="rotate(-6 42 68)">
      <text x="42" y="56" font-family="'Caveat', 'Segoe Script', 'Brush Script MT', cursive, sans-serif" font-size="14.5" font-weight="700" fill="#6D28D9" text-anchor="middle" letter-spacing="0.2">Your idea</text>
      <text x="42" y="72" font-family="'Caveat', 'Segoe Script', 'Brush Script MT', cursive, sans-serif" font-size="13.5" font-weight="600" fill="#7C3AED" text-anchor="middle" letter-spacing="0.2">can make</text>
      <text x="42" y="88" font-family="'Caveat', 'Segoe Script', 'Brush Script MT', cursive, sans-serif" font-size="14.5" font-weight="700" fill="#6D28D9" text-anchor="middle" letter-spacing="0.2">a difference</text>
    </g>
  </g>

  <!-- ================= CRYSTAL PEDESTALS (ISOMETRIC PRISMS) ================= -->
  <g id="crystals">
    <!-- Far Left Crystal Tower -->
    <polygon points="175,160 188,145 200,154 187,170" fill="url(#cLeftPrism2)"/>
    <polygon points="175,160 187,170 187,198 175,190" fill="url(#cLeftPrism1)"/>
    <polygon points="187,170 200,154 200,188 187,198" fill="#581C87"/>

    <!-- Left Medium Crystal Tower -->
    <polygon points="195,148 210,136 222,145 207,158" fill="#E9D5FF"/>
    <polygon points="195,148 207,158 207,196 195,188" fill="url(#cLeftPrism1)"/>
    <polygon points="207,158 222,145 222,185 207,196" fill="#6B21A8"/>

    <!-- Far Right Crystal Tower -->
    <polygon points="302,154 315,138 328,148 315,164" fill="url(#cRightPrism2)"/>
    <polygon points="302,154 315,164 315,196 302,188" fill="url(#cRightPrism1)"/>
    <polygon points="315,164 328,148 328,186 315,196" fill="#4C1D95"/>

    <!-- Right Medium Crystal Tower -->
    <polygon points="282,146 296,134 308,144 294,156" fill="#DDD6FE"/>
    <polygon points="282,146 294,156 294,198 282,190" fill="url(#cRightPrism1)"/>
    <polygon points="294,156 308,144 308,188 294,198" fill="#5B21B6"/>

    <!-- Center Isometric Pedestal (Directly below lightbulb base) -->
    <!-- Top Face (Isometric rhombus) -->
    <polygon points="250,152 275,162 250,172 225,162" fill="url(#cTopGrad)"/>
    <!-- Left Face -->
    <polygon points="225,162 250,172 250,200 225,190" fill="url(#cLeftGrad)"/>
    <!-- Right Face -->
    <polygon points="250,172 275,162 275,190 250,200" fill="url(#cRightGrad)"/>

    <!-- Glowing Top Highlight Edge -->
    <line x1="225" y1="162" x2="250" y2="172" stroke="#FFFFFF" stroke-width="1.4" opacity="0.95"/>
    <line x1="250" y1="172" x2="275" y2="162" stroke="#E0F2FE" stroke-width="1.4" opacity="0.95"/>
  </g>

  <!-- ================= 3D GLASS LIGHTBULB BODY ================= -->
  <g id="lightbulb">
    <!-- Bulb Contour Path - Tapering down into socket neck at y=130 -->
    <path d="M 250, 16 
             C 208, 16  184, 46  184, 78 
             C 184, 100 200, 114 212, 124 
             C 218, 128 228, 130 236, 130 
             L 264, 130 
             C 272, 130 282, 128 288, 124 
             C 300, 114 316, 100 316, 78 
             C 316, 46  292, 16  250, 16 Z" 
          fill="url(#bulbGlass)"/>

    <!-- Inner Luminous Core Highlight -->
    <ellipse cx="242" cy="60" rx="38" ry="34" fill="#FFFFFF" opacity="0.35" filter="url(#softAura)"/>
    <ellipse cx="238" cy="54" rx="24" ry="20" fill="#FEF08A" opacity="0.5"/>

    <!-- Specular Reflection (Glass Rim Highlight Left) -->
    <path d="M 204 38 C 192 53 190 72 194 92 C 196 78 202 60 214 46 Z" fill="#FFFFFF" opacity="0.65"/>

    <!-- Specular Reflection (Glass Highlight Top Right Small) -->
    <ellipse cx="284" cy="50" rx="3.5" ry="5.5" transform="rotate(-30 284 50)" fill="#FFFFFF" opacity="0.9"/>

    <!-- ================= GLOWING INNER FILAMENT ================= -->
    <g filter="url(#filamentGlow)">
      <!-- Filament Stems -->
      <line x1="240" y1="128" x2="244" y2="100" stroke="#FDE047" stroke-width="2" stroke-linecap="round"/>
      <line x1="260" y1="128" x2="256" y2="100" stroke="#FDE047" stroke-width="2" stroke-linecap="round"/>

      <!-- Filament Loop / Arches -->
      <path d="M 244 100 
               C 242 78 236 62 246 62 
               C 254 62 251 80 250 96 
               C 249 80 246 62 254 62 
               C 264 62 258 78 256 100" 
            stroke="url(#filamentGrad)" 
            stroke-width="2.6" 
            stroke-linecap="round" 
            stroke-linejoin="round"
            fill="none"/>

      <!-- Filament Center Sparkle -->
      <polygon points="250,54 252,59 257,60 252,61 250,66 248,61 243,60 248,59" fill="#FFFFFF"/>
    </g>
  </g>

  <!-- ================= LIGHTBULB SOCKET (DARK METALLIC BASE) ================= -->
  <g id="socket">
    <!-- Thread 1 -->
    <rect x="235" y="130" width="30" height="5.5" rx="2.5" fill="url(#socketGrad)"/>
    <!-- Thread 2 -->
    <rect x="236" y="135.5" width="28" height="5.5" rx="2.5" fill="url(#socketGrad)"/>
    <!-- Thread 3 -->
    <rect x="238" y="141" width="24" height="5.5" rx="2.5" fill="url(#socketGrad)"/>
    <!-- Socket Tip -->
    <path d="M 241 146.5 Q 250 150 259 146.5 L 256 149.5 Q 250 152.5 244 149.5 Z" fill="#1E1B4B"/>

    <!-- Specular Highlight on Threads -->
    <path d="M 242 131 L 246 131 L 246 145 L 242 145 Z" fill="#FFFFFF" opacity="0.3"/>
  </g>

  <!-- ================= 4 FLOATING INNOVATION BADGES ================= -->
  <!-- NODE 1: TOP LEFT - INNOVATE (ROCKET) -->
  <g id="node-innovate" filter="url(#badgeShadow)">
    <circle cx="150" cy="54" r="18" fill="url(#badgeGrad)"/>
    <circle cx="150" cy="54" r="17" stroke="rgba(255,255,255,0.45)" stroke-width="1.2" fill="none"/>
    <!-- Clean Lucide Rocket SVG Icon -->
    <g transform="translate(141.5, 45.5) scale(0.72)" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
    </g>
  </g>
  <text x="150" y="82" font-family="system-ui, -apple-system, sans-serif" font-size="11.5" font-weight="600" fill="#312E81" text-anchor="middle">Innovate</text>

  <!-- NODE 2: BOTTOM LEFT - COLLABORATE (USERS) -->
  <g id="node-collaborate" filter="url(#badgeShadow)">
    <circle cx="150" cy="120" r="18" fill="url(#badgeGrad)"/>
    <circle cx="150" cy="120" r="17" stroke="rgba(255,255,255,0.45)" stroke-width="1.2" fill="none"/>
    <!-- Clean Users Icon -->
    <circle cx="147" cy="114" r="3" fill="#FFFFFF"/>
    <path d="M 141 125 C 141 120 144 119 147 119 C 150 119 153 120 153 125 Z" fill="#FFFFFF"/>
    <circle cx="153" cy="115" r="2.5" fill="#FFFFFF" opacity="0.85"/>
    <path d="M 151 125 C 151 121.5 153 120.5 156 120.5 C 158 120.5 160 121.5 160 125 Z" fill="#FFFFFF" opacity="0.85"/>
  </g>
  <text x="150" y="148" font-family="system-ui, -apple-system, sans-serif" font-size="11.5" font-weight="600" fill="#312E81" text-anchor="middle">Collaborate</text>

  <!-- NODE 3: TOP RIGHT - IMPROVE (PROCESS/BADGE) -->
  <g id="node-improve" filter="url(#badgeShadow)">
    <circle cx="368" cy="60" r="18" fill="url(#badgeGrad)"/>
    <circle cx="368" cy="60" r="17" stroke="rgba(255,255,255,0.45)" stroke-width="1.2" fill="none"/>
    <!-- User/Check Badge Icon -->
    <circle cx="368" cy="54" r="3" fill="#FFFFFF"/>
    <path d="M 362 65 C 362 61 364 60 368 60 C 372 60 374 61 374 65 Z" fill="#FFFFFF"/>
    <path d="M 370 63 L 373 66 L 377 61" stroke="#34D399" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  </g>
  <text x="368" y="88" font-family="system-ui, -apple-system, sans-serif" font-size="11.5" font-weight="600" fill="#312E81" text-anchor="middle">Improve</text>

  <!-- NODE 4: BOTTOM RIGHT - CREATE VALUE (CHART) -->
  <g id="node-value" filter="url(#badgeShadow)">
    <circle cx="368" cy="126" r="18" fill="url(#badgeGrad)"/>
    <circle cx="368" cy="126" r="17" stroke="rgba(255,255,255,0.45)" stroke-width="1.2" fill="none"/>
    <!-- Bar Chart Icon -->
    <rect x="360" y="127" width="3.5" height="5" rx="1" fill="#FFFFFF"/>
    <rect x="366" y="122" width="3.5" height="10" rx="1" fill="#FFFFFF"/>
    <rect x="372" y="117" width="3.5" height="15" rx="1" fill="#FFFFFF"/>
  </g>
  <text x="368" y="154" font-family="system-ui, -apple-system, sans-serif" font-size="11.5" font-weight="600" fill="#312E81" text-anchor="middle">Create value</text>

  <!-- ================= 4-POINT SPARKLE STARS ================= -->
  <!-- Top Left Sparkle -->
  <g transform="translate(68, 28) scale(0.9)">
    <path d="M 0,-8 Q 0,0 8,0 Q 0,0 0,8 Q 0,0 -8,0 Q 0,0 0,-8 Z" fill="#F59E0B"/>
  </g>
  <!-- Near Bulb Left Sparkle -->
  <g transform="translate(182, 38) scale(0.8)">
    <path d="M 0,-8 Q 0,0 8,0 Q 0,0 0,8 Q 0,0 -8,0 Q 0,0 0,-8 Z" fill="#A855F7"/>
  </g>
  <!-- Lower Left Sparkle -->
  <g transform="translate(182, 122) scale(0.85)">
    <path d="M 0,-8 Q 0,0 8,0 Q 0,0 0,8 Q 0,0 -8,0 Q 0,0 0,-8 Z" fill="#F59E0B"/>
  </g>
  <!-- Top Right Sparkle -->
  <g transform="translate(330, 44) scale(0.9)">
    <path d="M 0,-8 Q 0,0 8,0 Q 0,0 0,8 Q 0,0 -8,0 Q 0,0 0,-8 Z" fill="#F59E0B"/>
  </g>
  <!-- Far Right Sparkle -->
  <g transform="translate(424, 68) scale(0.75)">
    <path d="M 0,-8 Q 0,0 8,0 Q 0,0 0,8 Q 0,0 -8,0 Q 0,0 0,-8 Z" fill="#A855F7"/>
  </g>
</svg>
'''

with open('public/assets/hero_lightbulb.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)

print('Updated public/assets/hero_lightbulb.svg successfully!')
