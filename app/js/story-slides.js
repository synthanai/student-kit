/* ═══════════════════════════════════════
   Story Slides — Instagram-Ready Profile Cards
   9:16 format (1080x1920), shareable via Web Share API
   4 slide types: Overview, Pillar, Compass, Quote
   ═══════════════════════════════════════ */

const StorySlides = (() => {

    const W = 1080;
    const H = 1920;
    const SCALE = 2; // Render at 2x for crisp text

    // ─── Direction colour map ───
    function getColours(profile) {
        try { return DirectionDetector.getColourPalette(); }
        catch (e) {
            return {
                primary: '#c28840', secondary: '#7a6e5e',
                base: '#1a1410', accent: '#f5a623'
            };
        }
    }

    // ─── Slide 1: CORE Overview ───
    function renderOverview(profile, colours) {
        const kolamSVG = KolamHash.generate(
            `${profile.core.calling}|${profile.core.origin}|${profile.core.reason}|${profile.core.endurance}`,
            colours, profile.stage || 1
        );
        const kolamInner = kolamSVG.replace(/<svg[^>]*>/, '').replace(/<\/svg>/, '');

        return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
            <defs>
                <linearGradient id="bg-grad" x1="0" y1="0" x2="0.3" y2="1">
                    <stop offset="0%" stop-color="#1a1410"/>
                    <stop offset="50%" stop-color="#1f1812"/>
                    <stop offset="100%" stop-color="#14100c"/>
                </linearGradient>
                <linearGradient id="accent-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="${colours.primary}"/>
                    <stop offset="100%" stop-color="${colours.secondary}"/>
                </linearGradient>
                <filter id="glow">
                    <feGaussianBlur stdDeviation="20" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
            </defs>

            <!-- Background -->
            <rect width="${W}" height="${H}" fill="url(#bg-grad)"/>

            <!-- Subtle grid pattern -->
            <g opacity="0.03">
                ${Array.from({ length: 20 }, (_, i) => `<line x1="0" y1="${i * 100}" x2="${W}" y2="${i * 100}" stroke="${colours.primary}" stroke-width="0.5"/>`).join('')}
                ${Array.from({ length: 12 }, (_, i) => `<line x1="${i * 100}" y1="0" x2="${i * 100}" y2="${H}" stroke="${colours.primary}" stroke-width="0.5"/>`).join('')}
            </g>

            <!-- Top accent line -->
            <rect x="80" y="120" width="200" height="3" rx="1.5" fill="url(#accent-grad)" opacity="0.6"/>

            <!-- Header -->
            <text x="80" y="180" font-family="'Noto Sans Tamil', sans-serif" font-size="28" fill="${colours.primary}" opacity="0.8">அறிவர்</text>
            <text x="80" y="220" font-family="'Playfair Display', serif" font-size="48" font-weight="700" fill="#f0e6d6" letter-spacing="8">ARIVAR</text>
            <text x="80" y="250" font-family="'Inter', sans-serif" font-size="18" fill="${colours.primary}" opacity="0.5" letter-spacing="3">CORE PROFILE</text>

            <!-- Kolam (center, large) -->
            <g transform="translate(${(W - 400) / 2}, 300) scale(1.43)" filter="url(#glow)">
                ${kolamInner}
            </g>

            <!-- Name -->
            <text x="${W / 2}" y="740" text-anchor="middle" font-family="'Playfair Display', serif" font-size="42" font-weight="700" fill="#f0e6d6">
                ${esc(profile.name || 'Student')}
            </text>
            <text x="${W / 2}" y="780" text-anchor="middle" font-family="'Inter', sans-serif" font-size="20" fill="${colours.primary}" opacity="0.6">
                ${esc(profile.field_of_study || '')}
            </text>

            <!-- Divider -->
            <line x1="340" y1="820" x2="740" y2="820" stroke="${colours.primary}" stroke-width="1" opacity="0.3"/>

            <!-- CORE Pillars -->
            ${renderSlidePillar('🔥', 'அழைப்பு', 'CALLING', profile.core.calling, 900, colours)}
            ${renderSlidePillar('🌱', 'மூலம்', 'ORIGIN', profile.core.origin, 1060, colours)}
            ${renderSlidePillar('⚡', 'காரணம்', 'REASON', profile.core.reason, 1220, colours)}
            ${renderSlidePillar('🛡️', 'தாங்கும் நிலை', 'ENDURANCE', profile.core.endurance, 1380, colours)}

            <!-- Essence -->
            <text x="${W / 2}" y="1580" text-anchor="middle" font-family="'Playfair Display', serif" font-size="22" font-style="italic" fill="${colours.primary}" opacity="0.9">
                "${trunc(esc(profile.essence || ''), 60)}"
            </text>

            <!-- Footer -->
            <rect x="80" y="${H - 160}" width="200" height="2" rx="1" fill="${colours.primary}" opacity="0.3"/>
            <text x="80" y="${H - 120}" font-family="'Inter', sans-serif" font-size="16" fill="#666" letter-spacing="2">YOUR MIND IS YOURS</text>
            <text x="80" y="${H - 90}" font-family="'Inter', sans-serif" font-size="14" fill="#444">arivar.app</text>
        </svg>`;
    }

    // ─── Slide 2: Single Pillar Deep Dive ───
    function renderPillarSlide(profile, pillarKey, colours) {
        const pillars = {
            calling: { emoji: '🔥', tamil: 'அழைப்பு', label: 'CALLING', question: 'What pulls you forward?' },
            origin: { emoji: '🌱', tamil: 'மூலம்', label: 'ORIGIN', question: 'What shaped your lens?' },
            reason: { emoji: '⚡', tamil: 'காரணம்', label: 'REASON', question: 'What keeps you going?' },
            endurance: { emoji: '🛡️', tamil: 'தாங்கும் நிலை', label: 'ENDURANCE', question: 'What would you never compromise?' }
        };
        const p = pillars[pillarKey];
        const value = profile.core[pillarKey] || '...';

        return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
            <defs>
                <linearGradient id="bg2" x1="0" y1="0" x2="0.3" y2="1">
                    <stop offset="0%" stop-color="#1a1410"/>
                    <stop offset="100%" stop-color="#14100c"/>
                </linearGradient>
            </defs>
            <rect width="${W}" height="${H}" fill="url(#bg2)"/>

            <!-- Large emoji -->
            <text x="${W / 2}" y="500" text-anchor="middle" font-size="200">${p.emoji}</text>

            <!-- Tamil + English label -->
            <text x="${W / 2}" y="620" text-anchor="middle" font-family="'Noto Sans Tamil', sans-serif" font-size="36" fill="${colours.primary}" opacity="0.7">${p.tamil}</text>
            <text x="${W / 2}" y="680" text-anchor="middle" font-family="'Playfair Display', serif" font-size="56" font-weight="700" fill="#f0e6d6" letter-spacing="6">${p.label}</text>

            <!-- Question -->
            <text x="${W / 2}" y="760" text-anchor="middle" font-family="'Inter', sans-serif" font-size="22" fill="${colours.primary}" opacity="0.5" font-style="italic">${p.question}</text>

            <!-- Divider -->
            <line x1="240" y1="810" x2="840" y2="810" stroke="${colours.primary}" stroke-width="1" opacity="0.3"/>

            <!-- Answer (wrapped) -->
            ${wrapText(value, W / 2, 900, 48, 32, '#f0e6d6', "'Inter', sans-serif")}

            <!-- Student name -->
            <text x="${W / 2}" y="1500" text-anchor="middle" font-family="'Playfair Display', serif" font-size="28" fill="${colours.primary}" opacity="0.6">
                — ${esc(profile.name || 'Student')}
            </text>

            <!-- Footer -->
            <text x="${W / 2}" y="${H - 120}" text-anchor="middle" font-family="'Inter', sans-serif" font-size="16" fill="#444" letter-spacing="2">ARIVAR · YOUR MIND IS YOURS</text>
        </svg>`;
    }

    // ─── Slide 3: Direction Compass ───
    function renderCompassSlide(profile, colours) {
        const dir = profile.direction || {};
        const n = dir.north || 0, e = dir.east || 0, s = dir.south || 0, w = dir.west || 0;
        const maxScore = Math.max(n, e, s, w, 1);
        const cx = W / 2, cy = 900;
        const R = 280;

        // Normalize to radius
        const nR = (n / maxScore) * R;
        const eR = (e / maxScore) * R;
        const sR = (s / maxScore) * R;
        const wR = (w / maxScore) * R;

        const points = `${cx},${cy - nR} ${cx + eR},${cy} ${cx},${cy + sR} ${cx - wR},${cy}`;

        const dirLabels = {
            north: { label: 'வானம் AIR', y: cy - R - 40, x: cx },
            east: { label: 'நெருப்பு FIRE', y: cy, x: cx + R + 40 },
            south: { label: 'நிலம் EARTH', y: cy + R + 50, x: cx },
            west: { label: 'நீர் WATER', y: cy, x: cx - R - 40 }
        };

        return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
            <defs>
                <linearGradient id="bg3" x1="0" y1="0" x2="0.3" y2="1">
                    <stop offset="0%" stop-color="#1a1410"/>
                    <stop offset="100%" stop-color="#14100c"/>
                </linearGradient>
            </defs>
            <rect width="${W}" height="${H}" fill="url(#bg3)"/>

            <!-- Header -->
            <text x="${W / 2}" y="200" text-anchor="middle" font-family="'Noto Sans Tamil', sans-serif" font-size="28" fill="${colours.primary}" opacity="0.7">திசை</text>
            <text x="${W / 2}" y="260" text-anchor="middle" font-family="'Playfair Display', serif" font-size="48" font-weight="700" fill="#f0e6d6" letter-spacing="6">YOUR COMPASS</text>

            <!-- Name -->
            <text x="${W / 2}" y="320" text-anchor="middle" font-family="'Inter', sans-serif" font-size="22" fill="${colours.primary}" opacity="0.5">${esc(profile.name || 'Student')}</text>

            <!-- Compass grid -->
            <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${colours.primary}" stroke-width="0.5" opacity="0.15"/>
            <circle cx="${cx}" cy="${cy}" r="${R * 0.66}" fill="none" stroke="${colours.primary}" stroke-width="0.5" opacity="0.1"/>
            <circle cx="${cx}" cy="${cy}" r="${R * 0.33}" fill="none" stroke="${colours.primary}" stroke-width="0.5" opacity="0.05"/>
            <line x1="${cx}" y1="${cy - R - 10}" x2="${cx}" y2="${cy + R + 10}" stroke="${colours.primary}" stroke-width="0.5" opacity="0.1"/>
            <line x1="${cx - R - 10}" y1="${cy}" x2="${cx + R + 10}" y2="${cy}" stroke="${colours.primary}" stroke-width="0.5" opacity="0.1"/>

            <!-- Shape -->
            <polygon points="${points}" fill="${colours.primary}" fill-opacity="0.15" stroke="${colours.primary}" stroke-width="2"/>

            <!-- Direction dots -->
            <circle cx="${cx}" cy="${cy - nR}" r="6" fill="${colours.primary}"/>
            <circle cx="${cx + eR}" cy="${cy}" r="6" fill="${colours.primary}"/>
            <circle cx="${cx}" cy="${cy + sR}" r="6" fill="${colours.primary}"/>
            <circle cx="${cx - wR}" cy="${cy}" r="6" fill="${colours.primary}"/>

            <!-- Direction labels -->
            <text x="${dirLabels.north.x}" y="${dirLabels.north.y}" text-anchor="middle" font-family="'Inter', sans-serif" font-size="18" fill="#f0e6d6" opacity="0.8">${dirLabels.north.label}</text>
            <text x="${dirLabels.north.x}" y="${dirLabels.north.y + 24}" text-anchor="middle" font-family="'Inter', sans-serif" font-size="24" font-weight="700" fill="${colours.primary}">${n}</text>

            <text x="${dirLabels.east.x}" y="${dirLabels.east.y}" text-anchor="start" font-family="'Inter', sans-serif" font-size="18" fill="#f0e6d6" opacity="0.8">${dirLabels.east.label}</text>
            <text x="${dirLabels.east.x}" y="${dirLabels.east.y + 24}" text-anchor="start" font-family="'Inter', sans-serif" font-size="24" font-weight="700" fill="${colours.primary}">${e}</text>

            <text x="${dirLabels.south.x}" y="${dirLabels.south.y}" text-anchor="middle" font-family="'Inter', sans-serif" font-size="18" fill="#f0e6d6" opacity="0.8">${dirLabels.south.label}</text>
            <text x="${dirLabels.south.x}" y="${dirLabels.south.y + 24}" text-anchor="middle" font-family="'Inter', sans-serif" font-size="24" font-weight="700" fill="${colours.primary}">${s}</text>

            <text x="${dirLabels.west.x}" y="${dirLabels.west.y}" text-anchor="end" font-family="'Inter', sans-serif" font-size="18" fill="#f0e6d6" opacity="0.8">${dirLabels.west.label}</text>
            <text x="${dirLabels.west.x}" y="${dirLabels.west.y + 24}" text-anchor="end" font-family="'Inter', sans-serif" font-size="24" font-weight="700" fill="${colours.primary}">${w}</text>

            <!-- Primary direction -->
            <text x="${W / 2}" y="1400" text-anchor="middle" font-family="'Inter', sans-serif" font-size="18" fill="#666" letter-spacing="2">PRIMARY DIRECTION</text>
            <text x="${W / 2}" y="1460" text-anchor="middle" font-family="'Playfair Display', serif" font-size="40" font-weight="700" fill="${colours.primary}">
                ${(dir.primary || 'NORTH').toUpperCase()}
            </text>

            <!-- Footer -->
            <text x="${W / 2}" y="${H - 120}" text-anchor="middle" font-family="'Inter', sans-serif" font-size="16" fill="#444" letter-spacing="2">ARIVAR · YOUR MIND IS YOURS</text>
        </svg>`;
    }

    // ─── Helper: render pillar block for overview slide ───
    function renderSlidePillar(emoji, tamil, english, value, y, colours) {
        return `
            <text x="120" y="${y}" font-family="'Noto Sans Tamil', sans-serif" font-size="18" fill="${colours.primary}" opacity="0.6">${tamil}</text>
            <text x="120" y="${y + 30}" font-family="'Inter', sans-serif" font-size="16" fill="${colours.primary}" opacity="0.4" letter-spacing="2">${english}</text>
            <text x="120" y="${y + 65}" font-family="'Inter', sans-serif" font-size="22" fill="#d4c8b4">${trunc(esc(value || '...'), 50)}</text>
            <line x1="120" y1="${y + 85}" x2="960" y2="${y + 85}" stroke="${colours.primary}" stroke-width="0.5" opacity="0.1"/>
        `;
    }

    // ─── Helper: wrap text ───
    function wrapText(text, x, startY, lineH, maxChars, fill, fontFamily) {
        const words = text.split(' ');
        let lines = [];
        let line = '';
        for (const word of words) {
            if ((line + ' ' + word).length > maxChars) {
                lines.push(line.trim());
                line = word;
            } else {
                line += ' ' + word;
            }
        }
        if (line.trim()) lines.push(line.trim());

        return lines.slice(0, 8).map((l, i) =>
            `<text x="${x}" y="${startY + i * lineH}" text-anchor="middle" font-family="${fontFamily}" font-size="28" fill="${fill}">${esc(l)}</text>`
        ).join('\n');
    }

    function esc(str) {
        return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function trunc(str, max) {
        return str.length > max ? str.substring(0, max - 2) + '...' : str;
    }

    // ─── Generate all slides ───
    function generateAll(profile) {
        const colours = getColours(profile);
        return [
            { type: 'overview', svg: renderOverview(profile, colours), label: 'CORE Profile' },
            { type: 'calling', svg: renderPillarSlide(profile, 'calling', colours), label: 'Calling' },
            { type: 'origin', svg: renderPillarSlide(profile, 'origin', colours), label: 'Origin' },
            { type: 'reason', svg: renderPillarSlide(profile, 'reason', colours), label: 'Reason' },
            { type: 'endurance', svg: renderPillarSlide(profile, 'endurance', colours), label: 'Endurance' },
            { type: 'compass', svg: renderCompassSlide(profile, colours), label: 'Compass' }
        ];
    }

    // ─── Download a single slide as PNG ───
    async function downloadSlide(svgString, filename) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            canvas.width = W * SCALE;
            canvas.height = H * SCALE;
            const ctx = canvas.getContext('2d');

            const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const img = new Image();

            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                URL.revokeObjectURL(url);

                canvas.toBlob(pngBlob => {
                    const pngUrl = URL.createObjectURL(pngBlob);
                    const a = document.createElement('a');
                    a.href = pngUrl;
                    a.download = filename || 'arivar-story.png';
                    a.click();
                    URL.revokeObjectURL(pngUrl);
                    resolve();
                }, 'image/png');
            };
            img.src = url;
        });
    }

    // ─── Share via Web Share API ───
    async function shareSlide(svgString, title) {
        const canvas = document.createElement('canvas');
        canvas.width = W * SCALE;
        canvas.height = H * SCALE;
        const ctx = canvas.getContext('2d');

        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        return new Promise((resolve) => {
            const img = new Image();
            img.onload = async () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                URL.revokeObjectURL(url);

                canvas.toBlob(async (pngBlob) => {
                    if (navigator.share && navigator.canShare) {
                        const file = new File([pngBlob], 'arivar-profile.png', { type: 'image/png' });
                        try {
                            await navigator.share({
                                title: title || 'My ARIVAR Profile',
                                text: 'I discovered my CORE identity with ARIVAR. What\'s yours?',
                                files: [file]
                            });
                        } catch (e) { /* user cancelled */ }
                    } else {
                        // Fallback: download
                        const pngUrl = URL.createObjectURL(pngBlob);
                        const a = document.createElement('a');
                        a.href = pngUrl;
                        a.download = 'arivar-profile.png';
                        a.click();
                        URL.revokeObjectURL(pngUrl);
                    }
                    resolve();
                }, 'image/png');
            };
            img.src = url;
        });
    }

    return { generateAll, downloadSlide, shareSlide, renderOverview, renderPillarSlide, renderCompassSlide };
})();
