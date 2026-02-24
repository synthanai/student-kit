/* ═══════════════════════════════════════
   Rarity Engine — Card Tier Calculator
   Calculates rarity from profile depth & richness
   Tamil tier names, visual effects, unlock progression
   ═══════════════════════════════════════ */

const RarityEngine = (() => {

    // ─── Tier Definitions ───
    // 5 tiers inspired by collectible card games + Tamil naming
    const TIERS = [
        {
            id: 'iron',
            tamil: 'இரும்பு',        // Irumbu (Iron)
            english: 'Iron',
            colour: '#7a6e5e',
            glow: 'none',
            border: '#5a5045',
            minScore: 0,
            description: 'Profile started'
        },
        {
            id: 'bronze',
            tamil: 'வெண்கலம்',      // Venkalam (Bronze)
            english: 'Bronze',
            colour: '#cd7f32',
            glow: '0 0 8px rgba(205,127,50,0.3)',
            border: '#cd7f32',
            minScore: 20,
            description: 'CORE pillars captured'
        },
        {
            id: 'silver',
            tamil: 'வெள்ளி',        // Velli (Silver)
            english: 'Silver',
            colour: '#c0c0c0',
            glow: '0 0 12px rgba(192,192,192,0.4)',
            border: '#c0c0c0',
            minScore: 45,
            description: 'Deep answers with emotional insight'
        },
        {
            id: 'gold',
            tamil: 'தங்கம்',         // Thangam (Gold)
            english: 'Gold',
            colour: '#f5a623',
            glow: '0 0 20px rgba(245,166,35,0.5)',
            border: '#f5a623',
            minScore: 70,
            description: 'Rich profile with clear direction'
        },
        {
            id: 'diamond',
            tamil: 'வைரம்',          // Vairam (Diamond)
            english: 'Diamond',
            colour: '#b9f2ff',
            glow: '0 0 30px rgba(185,242,255,0.6)',
            border: '#b9f2ff',
            minScore: 90,
            description: 'Complete multi-layer identity'
        }
    ];

    // ─── Score Calculation ───
    // Profile richness is scored 0-100 across multiple dimensions
    function calculateScore(profile) {
        if (!profile || !profile.core) return 0;

        let score = 0;

        // 1. Pillar completeness (max 20 pts)
        const pillars = ['calling', 'origin', 'reason', 'endurance'];
        for (const p of pillars) {
            const val = profile.core[p] || '';
            if (val && val !== '(pending)' && val !== '...') score += 5;
        }

        // 2. Pillar richness — longer/deeper answers (max 20 pts)
        for (const p of pillars) {
            const val = profile.core[p] || '';
            const words = val.split(/\s+/).length;
            if (words > 20) score += 5;
            else if (words > 10) score += 3;
            else if (words > 5) score += 1;
        }

        // 3. Essence present (max 10 pts)
        const essence = profile.essence || '';
        if (essence.length > 50) score += 10;
        else if (essence.length > 20) score += 5;

        // 4. Direction clarity (max 15 pts)
        const dir = profile.direction || {};
        const scores = [dir.north || 0, dir.east || 0, dir.south || 0, dir.west || 0];
        const maxDir = Math.max(...scores);
        const secondDir = scores.sort((a, b) => b - a)[1] || 0;
        if (maxDir > 0) {
            score += 5; // Has direction data
            if (maxDir > 30) score += 5; // Strong primary
            if (maxDir - secondDir > 15) score += 5; // Clear differentiation
        }

        // 5. Voice profile (max 10 pts)
        const voice = profile.voice || {};
        if (voice.tone) score += 3;
        if (voice.structure) score += 3;
        if (voice.energy) score += 4;

        // 6. Profile stages completed (max 15 pts)
        const stage = profile.stage || 1;
        score += Math.min(stage * 5, 15);

        // 7. Name and field present (max 10 pts)
        if (profile.name && profile.name !== 'Student') score += 5;
        if (profile.field_of_study) score += 5;

        return Math.min(score, 100);
    }

    // ─── Get Tier from Score ───
    function getTier(score) {
        let matched = TIERS[0];
        for (const tier of TIERS) {
            if (score >= tier.minScore) matched = tier;
        }
        return { ...matched, score };
    }

    // ─── Get Tier from Profile ───
    function getTierFromProfile(profile) {
        const score = calculateScore(profile);
        return getTier(score);
    }

    // ─── SVG Border Effect per Tier ───
    function getBorderSVG(tier, width, height) {
        if (tier.id === 'iron') {
            return `<rect x="2" y="2" width="${width - 4}" height="${height - 4}" rx="14" fill="none" stroke="${tier.border}" stroke-width="1" opacity="0.3"/>`;
        }
        if (tier.id === 'bronze') {
            return `
                <defs><linearGradient id="tier-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#cd7f32"/><stop offset="100%" stop-color="#8b5e3c"/>
                </linearGradient></defs>
                <rect x="2" y="2" width="${width - 4}" height="${height - 4}" rx="14" fill="none" stroke="url(#tier-grad)" stroke-width="1.5" opacity="0.6"/>`;
        }
        if (tier.id === 'silver') {
            return `
                <defs><linearGradient id="tier-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#e8e8e8"/><stop offset="50%" stop-color="#a0a0a0"/><stop offset="100%" stop-color="#e8e8e8"/>
                </linearGradient></defs>
                <rect x="2" y="2" width="${width - 4}" height="${height - 4}" rx="14" fill="none" stroke="url(#tier-grad)" stroke-width="2" opacity="0.7"/>`;
        }
        if (tier.id === 'gold') {
            return `
                <defs>
                    <linearGradient id="tier-grad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stop-color="#f5d77a"/><stop offset="30%" stop-color="#f5a623"/><stop offset="70%" stop-color="#e8941c"/><stop offset="100%" stop-color="#f5d77a"/>
                    </linearGradient>
                    <filter id="tier-glow"><feGaussianBlur stdDeviation="3" result="blur"/>
                        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                </defs>
                <rect x="2" y="2" width="${width - 4}" height="${height - 4}" rx="14" fill="none" stroke="url(#tier-grad)" stroke-width="2" filter="url(#tier-glow)"/>`;
        }
        // Diamond: animated shimmer border
        return `
            <defs>
                <linearGradient id="tier-grad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stop-color="#b9f2ff"/><stop offset="25%" stop-color="#ffffff"/><stop offset="50%" stop-color="#b9f2ff"/><stop offset="75%" stop-color="#8dd8e8"/><stop offset="100%" stop-color="#b9f2ff"/>
                </linearGradient>
                <filter id="tier-glow"><feGaussianBlur stdDeviation="4" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
            </defs>
            <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="15" fill="none" stroke="url(#tier-grad)" stroke-width="2.5" filter="url(#tier-glow)"/>`;
    }

    // ─── Tier Badge SVG (small inline badge) ───
    function getBadgeSVG(tier, x, y) {
        return `
            <g transform="translate(${x}, ${y})">
                <rect x="-30" y="-12" width="60" height="20" rx="10" fill="${tier.colour}" opacity="0.15"/>
                <text x="0" y="3" text-anchor="middle" font-family="'Noto Sans Tamil', sans-serif" font-size="9" fill="${tier.colour}" font-weight="600">
                    ${tier.tamil}
                </text>
            </g>`;
    }

    // ─── Score Breakdown (for UI display) ───
    function getBreakdown(profile) {
        if (!profile || !profile.core) return [];
        const items = [];
        const pillars = ['calling', 'origin', 'reason', 'endurance'];

        // Check each dimension
        let pillarComplete = 0;
        for (const p of pillars) {
            const val = profile.core[p] || '';
            if (val && val !== '(pending)' && val !== '...') pillarComplete++;
        }
        items.push({ label: 'Pillars completed', value: `${pillarComplete}/4`, points: pillarComplete * 5 });

        // Answer depth
        let depthPts = 0;
        for (const p of pillars) {
            const words = (profile.core[p] || '').split(/\s+/).length;
            if (words > 20) depthPts += 5;
            else if (words > 10) depthPts += 3;
            else if (words > 5) depthPts += 1;
        }
        items.push({ label: 'Answer depth', value: depthPts > 15 ? 'Rich' : depthPts > 8 ? 'Moderate' : 'Brief', points: depthPts });

        // Direction
        const dir = profile.direction || {};
        const hasDirection = (dir.north || 0) + (dir.east || 0) + (dir.south || 0) + (dir.west || 0) > 0;
        items.push({ label: 'Direction clarity', value: hasDirection ? (dir.primary || 'Detected') : 'None', points: hasDirection ? 10 : 0 });

        // Voice
        const voice = profile.voice || {};
        const voicePts = (voice.tone ? 3 : 0) + (voice.structure ? 3 : 0) + (voice.energy ? 4 : 0);
        items.push({ label: 'Voice profile', value: voicePts > 7 ? 'Complete' : voicePts > 0 ? 'Partial' : 'None', points: voicePts });

        return items;
    }

    return {
        TIERS,
        calculateScore,
        getTier,
        getTierFromProfile,
        getBorderSVG,
        getBadgeSVG,
        getBreakdown
    };
})();
