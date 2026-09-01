import { PhotoAngle, PhotoStage } from '../types';

// Generates an SVG Data URI depicting standard rhinoplasty clinical photography for angles & stages
export function getClinicalPhotoSvg(
  angle: PhotoAngle,
  stage: PhotoStage,
  patientGender: 'female' | 'male' = 'female',
  skinTone: string = '#F4D0B5'
): string {
  const isPostOp = stage !== 'pre_op';
  const isMale = patientGender === 'male';

  // SVG dimensions
  const width = 600;
  const height = 750;

  // Aesthetic adjustments based on stage
  // Pre-op: has dorsal hump, bulbous/drooping tip, larger columella angle or hook
  // Post-op: smooth supratip, defined tip rotation, refined dorsum, symmetry
  const bgFill = '#F8FAFC'; // Clean studio grey/white backdrop

  let content = '';

  if (angle === 'frontal') {
    // Frontal view
    const bridgeWidth = isPostOp ? 14 : 24;
    const tipWidth = isPostOp ? 22 : 36;
    const dorsumColor = isPostOp ? '#10B981' : '#F59E0B';

    content = `
      <defs>
        <linearGradient id="skin" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="${skinTone}" />
          <stop offset="100%" stop-color="#E2B797" />
        </linearGradient>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#000" flood-opacity="0.08"/>
        </filter>
      </defs>

      <!-- Medical Studio Background -->
      <rect width="600" height="750" fill="${bgFill}"/>
      
      <!-- Studio Grid / Reference Lines -->
      <line x1="300" y1="50" x2="300" y2="700" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="4 4" opacity="0.6"/>
      <line x1="100" y1="260" x2="500" y2="260" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="4 4" opacity="0.4"/>
      <line x1="100" y1="420" x2="500" y2="420" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="4 4" opacity="0.4"/>
      <line x1="100" y1="520" x2="500" y2="520" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="4 4" opacity="0.4"/>

      <!-- Head & Neck Contour -->
      <path d="M 200 680 C 200 580, 180 500, 180 340 C 180 180, 420 180, 420 340 C 420 500, 400 580, 400 680 Z" fill="url(#skin)" filter="url(#shadow)"/>
      
      <!-- Shoulders -->
      <path d="M 120 750 C 140 680, 200 650, 300 650 C 400 650, 460 680, 480 750 Z" fill="#0F172A" opacity="0.85"/>

      <!-- Hair -->
      <path d="M 170 300 C 170 120, 430 120, 430 300 C 430 220, 380 160, 300 160 C 220 160, 170 220, 170 300 Z" fill="${isMale ? '#1E293B' : '#332014'}"/>

      <!-- Eyebrows -->
      <path d="M 230 250 Q 260 240 280 248" stroke="#332014" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M 370 250 Q 340 240 320 248" stroke="#332014" stroke-width="4" stroke-linecap="round" fill="none"/>

      <!-- Eyes -->
      <ellipse cx="255" cy="270" rx="20" ry="10" fill="#FFF"/>
      <circle cx="255" cy="270" r="7" fill="#3B2618"/>
      <circle cx="253" cy="268" r="2.5" fill="#FFF"/>

      <ellipse cx="345" cy="270" rx="20" ry="10" fill="#FFF"/>
      <circle cx="345" cy="270" r="7" fill="#3B2618"/>
      <circle cx="343" cy="268" r="2.5" fill="#FFF"/>

      <!-- Nose Bridge (Dorsal Aesthetic Lines) -->
      <path d="M 285 260 Q ${300 - bridgeWidth / 2} 340 288 410" stroke="#C49A77" stroke-width="${isPostOp ? 2 : 3.5}" fill="none" opacity="0.8"/>
      <path d="M 315 260 Q ${300 + bridgeWidth / 2} 340 312 410" stroke="#C49A77" stroke-width="${isPostOp ? 2 : 3.5}" fill="none" opacity="0.8"/>

      <!-- Nasal Tip & Alar Base -->
      <!-- Alar Lobules -->
      <path d="M 275 425 C 270 415, 260 425, 272 438 C 285 444, 290 440, 300 440 C 310 440, 315 444, 328 438 C 340 425, 330 415, 325 425" fill="#B98963" opacity="0.5"/>
      <!-- Tip Definition Highlight / Diamond -->
      <circle cx="300" cy="${isPostOp ? 418 : 425}" r="${tipWidth / 2}" fill="#FDE68A" opacity="${isPostOp ? 0.35 : 0.15}"/>
      <ellipse cx="300" cy="${isPostOp ? 418 : 426}" rx="${isPostOp ? 9 : 14}" ry="${isPostOp ? 7 : 11}" fill="#D8A47F" opacity="0.6"/>

      <!-- Nostril shadows (Frontal slight show) -->
      <ellipse cx="288" cy="433" rx="${isPostOp ? 3.5 : 5.5}" ry="${isPostOp ? 2.5 : 4}" fill="#784C28" opacity="0.75"/>
      <ellipse cx="312" cy="433" rx="${isPostOp ? 3.5 : 5.5}" ry="${isPostOp ? 2.5 : 4}" fill="#784C28" opacity="0.75"/>

      <!-- Lips -->
      <path d="M 260 515 Q 300 500 340 515 Q 300 528 260 515 Z" fill="#D9777F" opacity="0.9"/>
      <path d="M 260 515 Q 300 545 340 515 Q 300 528 260 515 Z" fill="#C55B65" opacity="0.9"/>

      <!-- Chin -->
      <path d="M 275 580 Q 300 610 325 580" stroke="#C49A77" stroke-width="2" fill="none" opacity="0.6"/>

      <!-- Clinical Tag Overlay -->
      <rect x="20" y="20" width="170" height="34" rx="8" fill="#FFFFFF" fill-opacity="0.92" stroke="#E2E8F0"/>
      <circle cx="36" cy="37" r="5" fill="${dorsumColor}"/>
      <text x="50" y="42" font-family="Vazirmatn, sans-serif" font-size="13" font-weight="bold" fill="#0F172A">تمام‌رخ | ${isPostOp ? 'بعد از عمل' : 'قبل از عمل'}</text>
    `;
  } else if (angle === 'profile_left' || angle === 'profile_right') {
    // Lateral Profile (True 90 deg)
    const isLeft = angle === 'profile_left';
    const transform = isLeft ? 'translate(0, 0)' : 'translate(600, 0) scale(-1, 1)';
    const dorsumHumpPath = isPostOp
      ? 'L 288 320 Q 296 360 302 390 L 320 398' // refined slope
      : 'L 288 300 Q 330 340 310 375 L 340 405'; // Dorsal Hump + Drooping Tip

    const tipRotationY = isPostOp ? 398 : 408;
    const nasolabialAngleDegree = isPostOp ? (isMale ? '۹۵°' : '۱۰۲°') : '۸۲°';
    const tagColor = isPostOp ? '#10B981' : '#F59E0B';

    content = `
      <defs>
        <linearGradient id="skinProfile" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${skinTone}" />
          <stop offset="100%" stop-color="#E2B797" />
        </linearGradient>
      </defs>

      <rect width="600" height="750" fill="${bgFill}"/>
      
      <!-- Frankurt Horizontal & Vertical Reference Lines -->
      <line x1="50" y1="310" x2="550" y2="310" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="4 4" opacity="0.6"/>
      <line x1="288" y1="100" x2="288" y2="650" stroke="#CBD5E1" stroke-width="1" stroke-dasharray="4 4" opacity="0.4"/>
      
      <g transform="${transform}">
        <!-- Profile Silhouette -->
        <path d="
          M 240 160 
          C 260 160, 275 190, 280 230 
          L 288 270 
          L 285 285 
          ${dorsumHumpPath}
          Q ${isPostOp ? '324' : '344'} ${tipRotationY + 6} ${isPostOp ? '308' : '322'} ${tipRotationY + 12}
          L ${isPostOp ? '296' : '290'} 430
          Q 310 455 304 470
          Q 288 480 292 495
          Q 306 510 298 525
          Q 275 540 286 565
          Q 296 585 275 620
          L 250 680
          L 150 680
          L 150 200 Z" 
          fill="url(#skinProfile)" stroke="#D4A37D" stroke-width="1.5"/>

        <!-- Hair Profile -->
        <path d="M 240 160 C 180 140, 140 220, 140 360 C 140 500, 170 600, 150 680 L 120 680 L 120 120 C 180 100, 220 120, 240 160 Z" fill="${isMale ? '#1E293B' : '#332014'}"/>

        <!-- Eye Lateral View -->
        <path d="M 270 290 Q 284 285 288 290 Q 284 298 270 290 Z" fill="#3B2618"/>

        <!-- Alar Rim (Lateral) -->
        <path d="M 288 418 C 298 412, 305 422, 298 428 C 292 432, 284 428, 288 418 Z" fill="#B98963" opacity="0.6"/>

        <!-- Nasolabial Angle Arc Visualizer -->
        <path d="M 296 430 L 320 422" stroke="${isPostOp ? '#10B981' : '#EF4444'}" stroke-width="2" stroke-dasharray="2 2"/>
        <path d="M 296 430 L 304 470" stroke="${isPostOp ? '#10B981' : '#EF4444'}" stroke-width="2" stroke-dasharray="2 2"/>
      </g>

      <!-- Nasolabial Angle Measurement Badge -->
      <g transform="translate(${isLeft ? '330' : '80'}, 430)">
        <rect width="140" height="38" rx="8" fill="#FFFFFF" fill-opacity="0.9" stroke="#E2E8F0" filter="url(#shadow)"/>
        <text x="12" y="24" font-family="JetBrains Mono, Vazirmatn, sans-serif" font-size="12" font-weight="600" fill="${isPostOp ? '#059669' : '#D97706'}">NLA: ${nasolabialAngleDegree}</text>
      </g>

      <!-- Clinical Tag Overlay -->
      <rect x="20" y="20" width="180" height="34" rx="8" fill="#FFFFFF" fill-opacity="0.92" stroke="#E2E8F0"/>
      <circle cx="36" cy="37" r="5" fill="${tagColor}"/>
      <text x="50" y="42" font-family="Vazirmatn, sans-serif" font-size="13" font-weight="bold" fill="#0F172A">${isLeft ? 'نیم‌رخ چپ' : 'نیم‌رخ راست'} | ${isPostOp ? 'بعد از عمل' : 'قبل از عمل'}</text>
    `;
  } else if (angle === 'oblique_left' || angle === 'oblique_right') {
    // 3/4 Oblique View (45 deg)
    const isLeft = angle === 'oblique_left';
    const tagColor = isPostOp ? '#10B981' : '#F59E0B';
    const tipShiftX = isLeft ? (isPostOp ? 318 : 326) : (isPostOp ? 282 : 274);
    const humpShift = isPostOp ? 302 : 315;

    content = `
      <defs>
        <linearGradient id="skinOblique" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${skinTone}" />
          <stop offset="100%" stop-color="#E2B797" />
        </linearGradient>
      </defs>

      <rect width="600" height="750" fill="${bgFill}"/>
      
      <!-- Head Contour Oblique -->
      <path d="M 210 680 C 180 520, 170 360, 180 250 C 190 140, 390 140, 420 250 C 440 360, 420 540, 390 680 Z" fill="url(#skinOblique)"/>

      <!-- Eyes (Oblique perspective) -->
      <ellipse cx="${isLeft ? 245 : 255}" cy="275" rx="18" ry="9" fill="#FFF"/>
      <circle cx="${isLeft ? 245 : 255}" cy="275" r="6" fill="#3B2618"/>
      
      <ellipse cx="${isLeft ? 345 : 355}" cy="275" rx="14" ry="8" fill="#FFF"/>
      <circle cx="${isLeft ? 345 : 355}" cy="275" r="5" fill="#3B2618"/>

      <!-- Dorsal Line & Tip (Oblique Contour) -->
      <path d="M 292 265 Q ${humpShift} 340 ${tipShiftX} 415 Q ${tipShiftX + 12} 428 ${tipShiftX - 5} 435 L 295 442" stroke="#C49A77" stroke-width="${isPostOp ? 2 : 3.5}" fill="none"/>
      
      <!-- Alar Definition -->
      <ellipse cx="${isLeft ? 275 : 325}" cy="432" rx="${isPostOp ? 9 : 14}" ry="${isPostOp ? 7 : 10}" fill="#B98963" opacity="0.6"/>

      <!-- Lips in Oblique -->
      <path d="M 265 520 Q 305 505 340 522 Q 305 540 265 520 Z" fill="#D9777F" opacity="0.9"/>

      <!-- Clinical Tag Overlay -->
      <rect x="20" y="20" width="180" height="34" rx="8" fill="#FFFFFF" fill-opacity="0.92" stroke="#E2E8F0"/>
      <circle cx="36" cy="37" r="5" fill="${tagColor}"/>
      <text x="50" y="42" font-family="Vazirmatn, sans-serif" font-size="13" font-weight="bold" fill="#0F172A">${isLeft ? 'سه‌رخ چپ' : 'سه‌رخ راست'} | ${isPostOp ? 'بعد از عمل' : 'قبل از عمل'}</text>
    `;
  } else if (angle === 'basal') {
    // Basal (Worm's Eye / Submental view - shows nostrils, columella, alar base triangle)
    const tagColor = isPostOp ? '#10B981' : '#F59E0B';
    const triangleWidth = isPostOp ? 90 : 130;
    const columellaWidth = isPostOp ? 14 : 22;
    const symmetry = isPostOp ? 'متفارن و متناسب' : 'انحراف خفیف سپتوم کائودال';

    content = `
      <rect width="600" height="750" fill="${bgFill}"/>
      
      <!-- Basal / Submental View Chin & Jaw Contour -->
      <ellipse cx="300" cy="380" rx="190" ry="210" fill="#E8BD9E"/>
      <ellipse cx="300" cy="540" rx="90" ry="45" fill="#D4A37D" opacity="0.5"/> <!-- Chin -->
      
      <!-- Upper Lip from Below -->
      <path d="M 220 460 Q 300 485 380 460 Q 300 450 220 460 Z" fill="#D9777F"/>

      <!-- Nasal Base Aesthetic Triangle -->
      <polygon points="300,240 ${300 - triangleWidth / 2},410 ${300 + triangleWidth / 2},410" fill="#E2B797" stroke="#CBD5E1" stroke-width="1.5" stroke-dasharray="4 4"/>
      
      <!-- Tip Lobule -->
      <ellipse cx="300" cy="255" rx="${isPostOp ? 22 : 32}" ry="${isPostOp ? 16 : 24}" fill="#F4D0B5"/>

      <!-- Columella -->
      <rect x="${300 - columellaWidth / 2}" y="265" width="${columellaWidth}" height="${isPostOp ? 120 : 110}" rx="6" fill="#F4D0B5"/>
      <line x1="300" y1="260" x2="300" y2="385" stroke="#059669" stroke-width="1" stroke-dasharray="2 2" opacity="0.7"/>

      <!-- Nostrils (Pear shaped or oval) -->
      <!-- Left Nares -->
      <ellipse cx="${300 - (isPostOp ? 26 : 34)}" cy="335" rx="${isPostOp ? 11 : 16}" ry="${isPostOp ? 22 : 26}" transform="rotate(${isPostOp ? -25 : -35} ${300 - (isPostOp ? 26 : 34)} 335)" fill="#451A03" opacity="0.9"/>
      <!-- Right Nares -->
      <ellipse cx="${300 + (isPostOp ? 26 : 32)}" cy="335" rx="${isPostOp ? 11 : 18}" ry="${isPostOp ? 22 : 28}" transform="rotate(${isPostOp ? 25 : 30} ${300 + (isPostOp ? 26 : 32)} 335)" fill="#451A03" opacity="0.9"/>

      <!-- Alar Feet / Base Inset -->
      <ellipse cx="${300 - triangleWidth / 2 + 5}" cy="395" rx="14" ry="10" fill="#D4A37D"/>
      <ellipse cx="${300 + triangleWidth / 2 - 5}" cy="395" rx="14" ry="10" fill="#D4A37D"/>

      <!-- Basal Symmetry & Width Note -->
      <g transform="translate(180, 620)">
        <rect width="240" height="42" rx="8" fill="#FFFFFF" fill-opacity="0.95" stroke="#E2E8F0"/>
        <text x="120" y="26" text-anchor="middle" font-family="Vazirmatn, sans-serif" font-size="12" font-weight="600" fill="#0F172A">${symmetry}</text>
      </g>

      <!-- Clinical Tag Overlay -->
      <rect x="20" y="20" width="200" height="34" rx="8" fill="#FFFFFF" fill-opacity="0.92" stroke="#E2E8F0"/>
      <circle cx="36" cy="37" r="5" fill="${tagColor}"/>
      <text x="50" y="42" font-family="Vazirmatn, sans-serif" font-size="13" font-weight="bold" fill="#0F172A">نمای تحتانی (پایه‌ای) | ${isPostOp ? 'بعد عمل' : 'قبل عمل'}</text>
    `;
  } else {
    // Dorsal / Bird's eye
    const tagColor = isPostOp ? '#10B981' : '#F59E0B';
    content = `
      <rect width="600" height="750" fill="${bgFill}"/>
      <!-- Forehead, Bridge, Tip from Top-Down view -->
      <ellipse cx="300" cy="360" rx="180" ry="220" fill="#E8BD9E"/>
      
      <!-- Dorsal line highlight -->
      <path d="M 300 200 L 300 480" stroke="${isPostOp ? '#059669' : '#DC2626'}" stroke-width="${isPostOp ? 2 : 4}" stroke-dasharray="${isPostOp ? 'none' : '4 4'}"/>
      <circle cx="300" cy="480" r="${isPostOp ? 18 : 28}" fill="#FDE68A" opacity="0.4"/>
      
      <!-- Clinical Tag Overlay -->
      <rect x="20" y="20" width="180" height="34" rx="8" fill="#FFFFFF" fill-opacity="0.92" stroke="#E2E8F0"/>
      <circle cx="36" cy="37" r="5" fill="${tagColor}"/>
      <text x="50" y="42" font-family="Vazirmatn, sans-serif" font-size="13" font-weight="bold" fill="#0F172A">نمای فوقانی (پشتی) | ${isPostOp ? 'بعد عمل' : 'قبل عمل'}</text>
    `;
  }

  const svgFull = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    ${content}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svgFull)}`;
}
