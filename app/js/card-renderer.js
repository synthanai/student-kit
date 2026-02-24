/* ═══════════════════════════════════════
   Card Renderer — Profile Card Generator
   SVG-based, direction-coloured, stage-evolving
   ═══════════════════════════════════════ */

const CardRenderer = (() => {

    const CARD_WIDTH = 300;
    const CARD_HEIGHT = 420;

    function render(profile, container) {
        if (!profile || !profile.core) {
            container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">Complete your CORE to see your card.</p>';
            return;
        }

        const colours = DirectionDetector.getColourPalette();
        const stage = profile.stage || 1;
        const coreText = `${profile.core.calling}|${profile.core.origin}|${profile.core.reason}|${profile.core.endurance}`;
        const kolamSVG = KolamHash.generate(coreText, colours, stage);

        const tierInfo = getTier(stage);

        const card = document.createElement('div');
        card.className = 'profile-card';
        card.style.background = colours.base;

        card.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}"
                 width="${CARD_WIDTH}" height="${CARD_HEIGHT}" style="width:100%;height:100%;">
                <defs>
                    <linearGradient id="card-bg" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="${hexToRgba(colours.primary, 0.08)}"/>
                        <stop offset="50%" stop-color="transparent"/>
                        <stop offset="100%" stop-color="${hexToRgba(colours.secondary, 0.08)}"/>
                    </linearGradient>
                    <linearGradient id="border-grad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="${colours.primary}"/>
                        <stop offset="100%" stop-color="${colours.secondary}"/>
                    </linearGradient>
                </defs>

                <!-- Background -->
                <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="16" fill="#1a1410"/>
                <rect width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="16" fill="url(#card-bg)"/>

                <!-- Border -->
                <rect x="2" y="2" width="${CARD_WIDTH - 4}" height="${CARD_HEIGHT - 4}" rx="14"
                    fill="none" stroke="url(#border-grad)" stroke-width="1" opacity="0.5"/>

                <!-- Header -->
                <text x="${CARD_WIDTH / 2}" y="28" text-anchor="middle"
                    font-family="'Noto Sans Tamil', sans-serif" font-size="11" fill="${colours.primary}" opacity="0.8">
                    அறிவர்
                </text>
                <text x="${CARD_WIDTH / 2}" y="45" text-anchor="middle"
                    font-family="'Playfair Display', serif" font-size="16" font-weight="700" fill="#f0e6d6"
                    letter-spacing="4">
                    ARIVAR
                </text>

                <!-- Kolam (positioned center) -->
                <g transform="translate(${(CARD_WIDTH - 120) / 2}, 55) scale(0.43)">
                    ${stripSVGWrapper(kolamSVG)}
                </g>

                <!-- Name -->
                <text x="${CARD_WIDTH / 2}" y="190" text-anchor="middle"
                    font-family="'Inter', sans-serif" font-size="14" font-weight="600" fill="#f0e6d6">
                    ${escapeXML(profile.core.name || 'Student')}
                </text>

                <!-- CORE Pillars -->
                ${renderPillar('🔥', 'CALLING', profile.core.calling, 210, colours)}
                ${renderPillar('🌱', 'ORIGIN', profile.core.origin, 240, colours)}
                ${renderPillar('⚡', 'REASON', profile.core.reason, 270, colours)}
                ${renderPillar('🛡️', 'ENDURE', profile.core.endurance, 300, colours)}

                <!-- Essence -->
                <text x="${CARD_WIDTH / 2}" y="335" text-anchor="middle"
                    font-family="'Playfair Display', serif" font-size="10" font-style="italic"
                    fill="${colours.primary}" opacity="0.9">
                    ${truncate(escapeXML(profile.core.essence || ''), 45)}
                </text>

                <!-- Stage Stars -->
                ${renderStars(stage, 360, colours)}

                <!-- Tier -->
                <text x="${CARD_WIDTH / 2}" y="400" text-anchor="middle"
                    font-family="'Noto Sans Tamil', sans-serif" font-size="9" fill="${tierInfo.colour}" opacity="0.7">
                    ${tierInfo.tamil}
                </text>
            </svg>
        `;

        container.innerHTML = '';
        container.appendChild(card);
    }

    function renderPillar(emoji, label, value, y, colours) {
        const displayValue = truncate(value || '...', 35);
        return `
            <text x="16" y="${y}" font-family="'Inter', sans-serif" font-size="8"
                font-weight="600" fill="${colours.primary}" opacity="0.7" letter-spacing="1">
                ${label}
            </text>
            <text x="16" y="${y + 13}" font-family="'Inter', sans-serif" font-size="9" fill="#d4c8b4">
                ${escapeXML(displayValue)}
            </text>
        `;
    }

    function renderStars(stage, y, colours) {
        const labels = ['CORE', 'PER', 'SOC', 'PRO'];
        let stars = '';
        for (let i = 0; i < 4; i++) {
            const x = 75 + i * 45;
            const filled = i < stage;
            stars += `
                <text x="${x}" y="${y}" text-anchor="middle" font-size="14"
                    fill="${filled ? colours.primary : '#333'}" opacity="${filled ? 1 : 0.3}">
                    ${filled ? '★' : '☆'}
                </text>
                <text x="${x}" y="${y + 14}" text-anchor="middle"
                    font-family="'Inter', sans-serif" font-size="6" fill="#666"
                    letter-spacing="0.5">
                    ${labels[i]}
                </text>
            `;
        }
        return stars;
    }

    function getTier(stage) {
        const tiers = [
            { tamil: 'சாதாரண', english: 'Common', colour: '#7a6e5e' },
            { tamil: 'அரிய', english: 'Uncommon', colour: '#5d8a4e' },
            { tamil: 'விரும்ப', english: 'Rare', colour: '#4a6fa5' },
            { tamil: 'கதிர்', english: 'Epic', colour: '#c28840' },
            { tamil: 'புராண', english: 'Legendary', colour: '#f5a623' }
        ];
        return tiers[Math.min(stage, 4)];
    }

    function stripSVGWrapper(svgString) {
        return svgString
            .replace(/<svg[^>]*>/, '')
            .replace(/<\/svg>/, '');
    }

    function escapeXML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function truncate(str, max) {
        return str.length > max ? str.substring(0, max - 2) + '...' : str;
    }

    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    // Download card as PNG
    async function downloadAsPNG(container) {
        const svg = container.querySelector('svg');
        if (!svg) return;

        const canvas = document.createElement('canvas');
        canvas.width = CARD_WIDTH * 2;
        canvas.height = CARD_HEIGHT * 2;
        const ctx = canvas.getContext('2d');

        const data = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            URL.revokeObjectURL(url);

            canvas.toBlob(pngBlob => {
                const pngUrl = URL.createObjectURL(pngBlob);
                const a = document.createElement('a');
                a.href = pngUrl;
                a.download = 'arivar-profile-card.png';
                a.click();
                URL.revokeObjectURL(pngUrl);
            }, 'image/png');
        };
        img.src = url;
    }

    return { render, downloadAsPNG };
})();
