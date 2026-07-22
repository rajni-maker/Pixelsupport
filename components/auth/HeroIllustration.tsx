/* Hand-built vector portrait of a PixelSupport support rep at a modern
 * workstation. Every animated part (eyelids, torso, head, hands) is its own
 * group so CSS can drive it — see signup.css for the keyframes.
 *
 * Purely decorative: aria-hidden, and every loop stops under
 * prefers-reduced-motion.
 */
export default function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 460 420"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="h-full w-full"
    >
      <defs>
        <linearGradient id="ps-skin" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5C6A2" />
          <stop offset="100%" stopColor="#DDA07A" />
        </linearGradient>
        <linearGradient id="ps-hair" x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#2A2136" />
          <stop offset="100%" stopColor="#100B18" />
        </linearGradient>
        <linearGradient id="ps-denim" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#5089C0" />
          <stop offset="100%" stopColor="#2B5382" />
        </linearGradient>
        <linearGradient id="ps-screen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1B2036" />
          <stop offset="100%" stopColor="#0C1020" />
        </linearGradient>
        <linearGradient id="ps-ai" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
        <linearGradient id="ps-desk" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.10)" />
          <stop offset="50%" stopColor="rgba(255,255,255,0.05)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.10)" />
        </linearGradient>
        <linearGradient id="ps-leaf" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#0E7C63" />
          <stop offset="100%" stopColor="#34D399" />
        </linearGradient>
        <linearGradient id="ps-rgb" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.55" />
          <stop offset="50%" stopColor="#4F46E5" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.55" />
        </linearGradient>
        <filter id="ps-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feComposite in="SourceGraphic" in2="b" operator="over" />
        </filter>
        <filter id="ps-blur" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>

      {/* ---------- Ambient RGB wash on the back wall ---------- */}
      <ellipse cx="230" cy="180" rx="180" ry="120" fill="url(#ps-rgb)" opacity="0.16" filter="url(#ps-blur)" />

      {/* Soft light rays raking down from the upper left */}
      <g opacity="0.13">
        <path d="M40 0 L110 0 L190 300 L140 300 Z" fill="url(#ps-ai)" filter="url(#ps-blur)" />
        <path d="M150 0 L185 0 L230 260 L205 260 Z" fill="url(#ps-ai)" filter="url(#ps-blur)" />
      </g>

      {/* ---------- Indoor plant ---------- */}
      <g className="ps-sway" style={{ transformOrigin: "62px 330px" }}>
        <path d="M62 300 Q46 268 30 250" stroke="url(#ps-leaf)" strokeWidth="3" strokeLinecap="round" />
        <path d="M62 300 Q78 262 96 246" stroke="url(#ps-leaf)" strokeWidth="3" strokeLinecap="round" />
        <path d="M62 300 Q60 258 62 232" stroke="url(#ps-leaf)" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="28" cy="246" rx="15" ry="9" fill="url(#ps-leaf)" opacity="0.85" transform="rotate(-38 28 246)" />
        <ellipse cx="98" cy="242" rx="15" ry="9" fill="url(#ps-leaf)" opacity="0.85" transform="rotate(35 98 242)" />
        <ellipse cx="62" cy="226" rx="12" ry="17" fill="url(#ps-leaf)" opacity="0.9" />
        <ellipse cx="44" cy="268" rx="13" ry="8" fill="url(#ps-leaf)" opacity="0.7" transform="rotate(-22 44 268)" />
        <ellipse cx="82" cy="266" rx="13" ry="8" fill="url(#ps-leaf)" opacity="0.7" transform="rotate(20 82 266)" />
      </g>
      <path d="M46 300 L78 300 L74 336 L50 336 Z" fill="rgba(255,255,255,0.09)" stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
      <rect x="44" y="296" width="36" height="8" rx="3" fill="rgba(255,255,255,0.13)" />

      {/* ---------- Second monitor: ticket analytics ---------- */}
      <g transform="rotate(-4 372 148)">
        <rect x="308" y="88" width="128" height="98" rx="9" fill="url(#ps-screen)" stroke="rgba(255,255,255,0.14)" strokeWidth="1.5" />
        <rect x="315" y="95" width="114" height="84" rx="5" fill="rgba(6,182,212,0.09)" />
        <text x="323" y="110" fill="rgba(255,255,255,0.65)" fontSize="7" fontWeight="600">Ticket Analytics</text>
        {/* Bars */}
        <rect x="323" y="150" width="9" height="20" rx="2" fill="#4F46E5" opacity="0.85" />
        <rect x="337" y="140" width="9" height="30" rx="2" fill="#6366F1" opacity="0.85" />
        <rect x="351" y="128" width="9" height="42" rx="2" fill="#8B5CF6" opacity="0.85" />
        <rect x="365" y="146" width="9" height="24" rx="2" fill="#06B6D4" opacity="0.85" />
        <rect x="379" y="119" width="9" height="51" rx="2" fill="#22D3EE" opacity="0.9" />
        <rect x="393" y="134" width="9" height="36" rx="2" fill="#8B5CF6" opacity="0.8" />
        <rect x="407" y="124" width="9" height="46" rx="2" fill="#4F46E5" opacity="0.85" />
        {/* Trend line */}
        <path d="M327 146 L341 137 L355 124 L369 141 L383 115 L397 130 L411 120" stroke="#67E8F9" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9" />
        <line x1="323" y1="172" x2="416" y2="172" stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
        {/* Live dot */}
        <circle cx="422" cy="107" r="3" fill="#10B981">
          <animate attributeName="opacity" values="1;0.35;1" dur="2.4s" repeatCount="indefinite" />
        </circle>
      </g>
      <rect x="360" y="186" width="16" height="24" rx="3" fill="rgba(255,255,255,0.07)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
      <rect x="346" y="208" width="44" height="6" rx="3" fill="rgba(255,255,255,0.1)" />
      {/* RGB underglow on the monitor stand */}
      <ellipse cx="368" cy="214" rx="42" ry="7" fill="url(#ps-rgb)" opacity="0.5" filter="url(#ps-blur)" />

      {/* ================= PERSON ================= */}

      {/* Hair, back layer — long and wavy, falling past the shoulders */}
      <g className="ps-breathe" style={{ transformOrigin: "215px 330px" }}>
        <path
          d="M167 150 Q160 100 185 82 Q205 66 232 68 Q262 70 278 92 Q292 112 286 152 Q294 200 288 250 Q284 286 272 306 L258 300 Q268 258 262 214 Q258 182 254 168 L176 168 Q170 190 166 220 Q160 262 170 302 L156 308 Q142 274 140 236 Q138 192 167 150 Z"
          fill="url(#ps-hair)"
        />

        {/* Torso — denim collared shirt */}
        <path
          d="M182 214 Q166 224 158 248 Q148 282 146 330 L146 420 L286 420 L286 330 Q284 282 274 248 Q266 224 250 214 Z"
          fill="url(#ps-denim)"
        />
        <path
          d="M182 214 Q166 224 158 248 Q148 282 146 330 L146 420 L286 420 L286 330 Q284 282 274 248 Q266 224 250 214 Z"
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth="1"
        />
        {/* Collar */}
        <path d="M196 212 L216 244 L200 258 L182 224 Z" fill="#3C6D9E" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
        <path d="M236 212 L216 244 L232 258 L250 224 Z" fill="#3C6D9E" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
        {/* Placket + buttons */}
        <line x1="216" y1="248" x2="216" y2="418" stroke="rgba(255,255,255,0.16)" strokeWidth="1.5" strokeDasharray="5 4" />
        <circle cx="216" cy="286" r="2.2" fill="rgba(255,255,255,0.4)" />
        <circle cx="216" cy="330" r="2.2" fill="rgba(255,255,255,0.4)" />
        {/* Shoulder seams */}
        <path d="M182 222 Q172 250 168 286" stroke="rgba(255,255,255,0.1)" strokeWidth="1.2" fill="none" />
        <path d="M250 222 Q260 250 264 286" stroke="rgba(255,255,255,0.1)" strokeWidth="1.2" fill="none" />

        {/* Neck */}
        <path d="M202 186 L230 186 L232 220 Q216 230 200 220 Z" fill="url(#ps-skin)" />
        <path d="M202 200 Q216 214 230 200" fill="rgba(0,0,0,0.12)" />
      </g>

      {/* ---------- Head (sways gently) ---------- */}
      <g className="ps-head" style={{ transformOrigin: "216px 200px" }}>
        {/* Ears */}
        <ellipse cx="174" cy="152" rx="6" ry="9" fill="url(#ps-skin)" />
        <ellipse cx="258" cy="152" rx="6" ry="9" fill="url(#ps-skin)" />

        {/* Face */}
        <ellipse cx="216" cy="148" rx="42" ry="47" fill="url(#ps-skin)" />
        <ellipse cx="216" cy="148" rx="42" ry="47" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

        {/* Hair, front — soft centre-left part with volume on top */}
        <path
          d="M174 152 Q168 104 194 86 Q214 72 238 78 Q266 86 274 118 Q278 136 274 152 Q272 130 264 116 Q248 100 224 104 Q202 106 188 122 Q178 134 174 152 Z"
          fill="url(#ps-hair)"
        />
        <path d="M196 96 Q216 84 240 92" stroke="rgba(255,255,255,0.12)" strokeWidth="1.2" fill="none" />
        {/* Face-framing strands */}
        <path d="M176 142 Q172 172 180 196" stroke="url(#ps-hair)" strokeWidth="8" strokeLinecap="round" fill="none" />
        <path d="M272 142 Q278 174 268 198" stroke="url(#ps-hair)" strokeWidth="8" strokeLinecap="round" fill="none" />

        {/* Brows */}
        <path d="M192 134 Q201 129 210 133" stroke="#1A1424" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <path d="M224 133 Q233 129 242 134" stroke="#1A1424" strokeWidth="2.4" strokeLinecap="round" fill="none" />

        {/* Eyes — the group scales flat to blink */}
        <g className="ps-blink" style={{ transformOrigin: "216px 145px" }}>
          <ellipse cx="201" cy="145" rx="6" ry="3.6" fill="#fff" opacity="0.92" />
          <ellipse cx="233" cy="145" rx="6" ry="3.6" fill="#fff" opacity="0.92" />
          <circle cx="201" cy="145" r="2.9" fill="#241C2E" />
          <circle cx="233" cy="145" r="2.9" fill="#241C2E" />
          <circle cx="202.2" cy="143.8" r="1.1" fill="#fff" />
          <circle cx="234.2" cy="143.8" r="1.1" fill="#fff" />
        </g>

        {/* Nose */}
        <path d="M216 150 Q213 161 217 164" stroke="rgba(90,50,30,0.35)" strokeWidth="1.6" strokeLinecap="round" fill="none" />

        {/* Smile */}
        <path d="M203 172 Q216 182 229 172" stroke="#8C4A3C" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        <path d="M206 174 Q216 179 226 174" fill="rgba(255,255,255,0.5)" />
        {/* Cheeks */}
        <ellipse cx="193" cy="161" rx="7" ry="4.5" fill="#E88B72" opacity="0.28" />
        <ellipse cx="240" cy="161" rx="7" ry="4.5" fill="#E88B72" opacity="0.28" />

        {/* ---------- Premium wireless headset ---------- */}
        <path d="M170 150 Q164 92 216 86 Q268 92 262 150" stroke="#2A2F3E" strokeWidth="5.5" strokeLinecap="round" fill="none" />
        <path d="M170 150 Q164 92 216 86 Q268 92 262 150" stroke="url(#ps-ai)" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.75" />
        <rect x="160" y="136" width="17" height="30" rx="8" fill="#1A1F2C" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
        <rect x="255" y="136" width="17" height="30" rx="8" fill="#1A1F2C" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
        <rect x="163" y="142" width="11" height="18" rx="5" fill="#3B4256" />
        <rect x="258" y="142" width="11" height="18" rx="5" fill="#3B4256" />
        {/* RGB accent rings on the earcups */}
        <rect x="160" y="136" width="17" height="30" rx="8" fill="none" stroke="url(#ps-ai)" strokeWidth="1.4" opacity="0.85">
          <animate attributeName="opacity" values="0.85;0.35;0.85" dur="3s" repeatCount="indefinite" />
        </rect>
        <rect x="255" y="136" width="17" height="30" rx="8" fill="none" stroke="url(#ps-ai)" strokeWidth="1.4" opacity="0.85">
          <animate attributeName="opacity" values="0.35;0.85;0.35" dur="3s" repeatCount="indefinite" />
        </rect>
        {/* Mic boom */}
        <path d="M264 164 Q276 184 250 190" stroke="#2A2F3E" strokeWidth="2.6" strokeLinecap="round" fill="none" />
        <circle cx="249" cy="190" r="3.6" fill="#3B4256" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
        <circle cx="249" cy="190" r="6" fill="none" stroke="url(#ps-ai)" strokeWidth="0.8" opacity="0.5">
          <animate attributeName="r" values="6;9;6" dur="2.2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.5;0;0.5" dur="2.2s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* ---------- Arms reaching to the laptop ---------- */}
      <path d="M166 268 Q142 300 150 330" stroke="url(#ps-denim)" strokeWidth="21" strokeLinecap="round" fill="none" />
      <path d="M266 268 Q290 300 282 330" stroke="url(#ps-denim)" strokeWidth="21" strokeLinecap="round" fill="none" />

      {/* Hands — small independent typing motion */}
      <g className="ps-hand-l">
        <ellipse cx="150" cy="333" rx="13" ry="8.5" fill="url(#ps-skin)" transform="rotate(-18 150 333)" />
        <path d="M143 336 L157 336" stroke="rgba(120,70,45,0.3)" strokeWidth="1" strokeLinecap="round" />
      </g>
      <g className="ps-hand-r">
        <ellipse cx="282" cy="333" rx="13" ry="8.5" fill="url(#ps-skin)" transform="rotate(18 282 333)" />
        <path d="M275 336 L289 336" stroke="rgba(120,70,45,0.3)" strokeWidth="1" strokeLinecap="round" />
      </g>

      {/* ---------- Desk ---------- */}
      <rect x="20" y="336" width="420" height="7" rx="3.5" fill="url(#ps-desk)" />
      <ellipse cx="230" cy="352" rx="190" ry="12" fill="rgba(255,255,255,0.03)" />
      {/* RGB strip glowing under the desk edge */}
      <rect x="40" y="345" width="380" height="3" rx="1.5" fill="url(#ps-rgb)" opacity="0.75" filter="url(#ps-blur)" />

      {/* ---------- Laptop: the PixelSupport dashboard ---------- */}
      <g>
        <rect x="146" y="256" width="168" height="106" rx="8" fill="url(#ps-screen)" stroke="rgba(255,255,255,0.16)" strokeWidth="1.6" />
        <rect x="153" y="263" width="154" height="92" rx="5" fill="rgba(79,70,229,0.10)" />

        {/* App chrome */}
        <rect x="153" y="263" width="154" height="14" rx="5" fill="rgba(255,255,255,0.07)" />
        <circle cx="161" cy="270" r="2" fill="#F43F5E" opacity="0.8" />
        <circle cx="168" cy="270" r="2" fill="#F59E0B" opacity="0.8" />
        <circle cx="175" cy="270" r="2" fill="#10B981" opacity="0.8" />
        <text x="184" y="273" fill="rgba(255,255,255,0.75)" fontSize="7" fontWeight="700">Support Dashboard</text>

        {/* Widget: AI Summary */}
        <rect x="158" y="282" width="70" height="30" rx="4" fill="rgba(139,92,246,0.18)" stroke="rgba(139,92,246,0.4)" strokeWidth="0.8" />
        <path d="M165 289 a3 3 0 0 0 4.5 4.5 4.5 4.5 0 1 1-4.5-4.5Z" fill="none" stroke="#C4B5FD" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" />
        <text x="174" y="293" fill="#DDD6FE" fontSize="6" fontWeight="600">AI Summary</text>
        <line x1="164" y1="300" x2="221" y2="300" stroke="rgba(255,255,255,0.3)" strokeWidth="1.4" strokeLinecap="round" />
        <line x1="164" y1="305" x2="207" y2="305" stroke="rgba(255,255,255,0.18)" strokeWidth="1.4" strokeLinecap="round">
          <animate attributeName="x2" values="164;207;207" dur="4s" repeatCount="indefinite" />
        </line>

        {/* Widget: Open Tickets */}
        <rect x="233" y="282" width="69" height="30" rx="4" fill="rgba(6,182,212,0.16)" stroke="rgba(6,182,212,0.38)" strokeWidth="0.8" />
        <text x="239" y="292" fill="#A5F3FC" fontSize="6" fontWeight="600">Open Tickets</text>
        <text x="239" y="306" fill="#FFFFFF" fontSize="12" fontWeight="700">24</text>
        <circle cx="292" cy="300" r="5.5" fill="none" stroke="#22D3EE" strokeWidth="1.6" opacity="0.8" />
        <path d="M292 295 a5.5 5.5 0 0 1 5 3.4" stroke="#67E8F9" strokeWidth="1.8" strokeLinecap="round" fill="none" />

        {/* Widget: Ticket Analytics */}
        <rect x="158" y="316" width="144" height="34" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
        <text x="164" y="325" fill="rgba(255,255,255,0.6)" fontSize="6" fontWeight="600">Ticket Analytics</text>
        <rect x="164" y="336" width="7" height="9" rx="1.5" fill="#4F46E5" />
        <rect x="175" y="331" width="7" height="14" rx="1.5" fill="#6366F1" />
        <rect x="186" y="334" width="7" height="11" rx="1.5" fill="#8B5CF6" />
        <rect x="197" y="328" width="7" height="17" rx="1.5" fill="#A78BFA" />
        <rect x="208" y="333" width="7" height="12" rx="1.5" fill="#06B6D4" />
        <rect x="219" y="330" width="7" height="15" rx="1.5" fill="#22D3EE" />
        <path d="M238 342 L248 334 L258 337 L268 327 L280 331 L294 322" stroke="#67E8F9" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.9" />
        <circle cx="294" cy="322" r="2" fill="#67E8F9">
          <animate attributeName="opacity" values="1;0.3;1" dur="1.8s" repeatCount="indefinite" />
        </circle>

        {/* Screen sheen */}
        <path d="M153 263 L200 263 L153 340 Z" fill="rgba(255,255,255,0.04)" />

        {/* Base + hinge */}
        <path d="M132 362 L328 362 L336 372 Q336 376 331 376 L129 376 Q124 376 124 372 Z" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.16)" strokeWidth="1" />
        <rect x="200" y="366" width="60" height="3" rx="1.5" fill="rgba(255,255,255,0.16)" />
        {/* Keyboard glow */}
        <rect x="140" y="364" width="180" height="4" rx="2" fill="url(#ps-rgb)" opacity="0.6" filter="url(#ps-blur)" />
      </g>

      {/* ---------- Coffee mug ---------- */}
      <g>
        <path d="M336 312 L360 312 L357 336 Q356 340 351 340 L345 340 Q340 340 339 336 Z" fill="rgba(255,255,255,0.14)" stroke="rgba(255,255,255,0.28)" strokeWidth="1.2" />
        <path d="M360 318 Q370 320 368 328 Q366 334 357 333" stroke="rgba(255,255,255,0.28)" strokeWidth="1.6" fill="none" />
        <ellipse cx="348" cy="312" rx="12" ry="3.4" fill="#6B4A32" opacity="0.85" />
        {/* Steam */}
        <path className="ps-steam" d="M343 306 q4 -6 0 -12 q-4 -6 0 -11" stroke="rgba(255,255,255,0.32)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        <path className="ps-steam ps-steam-2" d="M352 306 q4 -6 0 -12 q-4 -6 0 -11" stroke="rgba(255,255,255,0.22)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      </g>

      {/* ---------- Floating AI interface ---------- */}
      <g>
        {/* Orb */}
        <circle cx="318" cy="212" r="19" fill="url(#ps-ai)" filter="url(#ps-glow)" opacity="0.92">
          <animate attributeName="r" values="19;22;19" dur="3.4s" repeatCount="indefinite" />
        </circle>
        <circle cx="318" cy="212" r="13" fill="#fff" opacity="0.12" />
        <path d="M313 208 a4 4 0 0 0 6 6 6 6 0 1 1-6-6Z" fill="none" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
        <circle cx="318" cy="212" r="26" fill="none" stroke="url(#ps-ai)" strokeWidth="1" opacity="0.4">
          <animate attributeName="r" values="26;36;26" dur="3.4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0;0.4" dur="3.4s" repeatCount="indefinite" />
        </circle>
        <circle cx="318" cy="212" r="34" fill="none" stroke="url(#ps-ai)" strokeWidth="0.6" opacity="0.22">
          <animate attributeName="r" values="34;46;34" dur="3.4s" begin="1.1s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.22;0;0.22" dur="3.4s" begin="1.1s" repeatCount="indefinite" />
        </circle>

        {/* Data thread from the orb to the rep */}
        <path d="M300 206 Q282 192 268 184" stroke="url(#ps-ai)" strokeWidth="1.4" strokeDasharray="4 4" opacity="0.6" fill="none">
          <animate attributeName="stroke-dashoffset" values="0;16" dur="1.1s" repeatCount="indefinite" />
        </path>

        {/* Glass panel: AI drafting a reply */}
        <g className="ps-panel">
          <rect x="330" y="240" width="92" height="38" rx="8" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
          <path d="M337 250 a2.5 2.5 0 0 0 3.7 3.7 3.7 3.7 0 1 1-3.7-3.7Z" fill="none" stroke="#C4B5FD" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
          <text x="345" y="254" fill="rgba(255,255,255,0.8)" fontSize="6.5" fontWeight="600">AI Draft Reply</text>
          <line x1="337" y1="262" x2="412" y2="262" stroke="rgba(255,255,255,0.32)" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="337" y1="268" x2="392" y2="268" stroke="rgba(255,255,255,0.18)" strokeWidth="1.3" strokeLinecap="round">
            <animate attributeName="x2" values="337;392;392" dur="3.6s" repeatCount="indefinite" />
          </line>
        </g>

        {/* Glass panel: resolution time */}
        <g className="ps-panel ps-panel-2">
          <rect x="24" y="176" width="86" height="30" rx="8" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
          <circle cx="38" cy="191" r="6" fill="none" stroke="#67E8F9" strokeWidth="1.3" />
          <path d="M38 187.5 L38 191 L40.5 192.5" stroke="#67E8F9" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          <text x="50" y="189" fill="rgba(255,255,255,0.8)" fontSize="6.5" fontWeight="600">Avg resolve</text>
          <text x="50" y="199" fill="#67E8F9" fontSize="8" fontWeight="700">2.4h</text>
        </g>

        {/* Sparkles */}
        <g fill="#fff">
          <path className="ps-twinkle" d="M292 152 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" opacity="0.7" />
          <path className="ps-twinkle ps-twinkle-2" d="M126 214 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z" opacity="0.6" />
          <path className="ps-twinkle ps-twinkle-3" d="M404 68 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 Z" opacity="0.55" />
          <path className="ps-twinkle ps-twinkle-4" d="M146 92 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 Z" opacity="0.5" />
        </g>
      </g>
    </svg>
  );
}
