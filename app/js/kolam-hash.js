/* ═══════════════════════════════════════
   Kolam Hash — Unique SVG Pattern Generator
   Deterministic: same CORE → same kolam
   No two students get the same pattern
   ═══════════════════════════════════════ */

const KolamHash = (() => {

    // Simple hash function (djb2)
    function hash(str) {
        let h = 5381;
        for (let i = 0; i < str.length; i++) {
            h = ((h << 5) + h + str.charCodeAt(i)) & 0xFFFFFFFF;
        }
        return Math.abs(h);
    }

    // Seeded pseudo-random (mulberry32)
    function seededRandom(seed) {
        let t = seed + 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    // Generate a sequence of seeded random numbers
    function randomSequence(seed, count) {
        const values = [];
        let s = seed;
        for (let i = 0; i < count; i++) {
            s = (s * 1103515245 + 12345) & 0x7FFFFFFF;
            values.push(seededRandom(s));
        }
        return values;
    }

    // Generate kolam dot grid based on stage
    function generateDotGrid(stage) {
        const sizes = { 1: 3, 2: 4, 3: 5, 4: 6 };
        return sizes[stage] || 3;
    }

    // Generate SVG kolam pattern
    function generate(coreText, colours, stage = 1) {
        const seed = hash(coreText);
        const rands = randomSequence(seed, 100);
        const gridSize = generateDotGrid(stage);
        const svgSize = 280;
        const center = svgSize / 2;
        const dotSpacing = svgSize / (gridSize + 1);

        let paths = '';
        let dots = '';
        let ri = 0;

        const nextRand = () => rands[ri++ % rands.length];

        // Generate dot positions
        const positions = [];
        for (let row = 1; row <= gridSize; row++) {
            for (let col = 1; col <= gridSize; col++) {
                const x = col * dotSpacing;
                const y = row * dotSpacing;
                positions.push({ x, y });
                dots += `<circle cx="${x}" cy="${y}" r="2" fill="${colours.kolam}" opacity="0.3"/>`;
            }
        }

        // Generate curves connecting dots (kolam loops)
        const numCurves = Math.min(stage * 3 + 2, 14);
        for (let i = 0; i < numCurves; i++) {
            const startIdx = Math.floor(nextRand() * positions.length);
            const endIdx = Math.floor(nextRand() * positions.length);
            if (startIdx === endIdx) continue;

            const start = positions[startIdx];
            const end = positions[endIdx];

            // Control point for bezier curve
            const cpx = center + (nextRand() - 0.5) * svgSize * 0.6;
            const cpy = center + (nextRand() - 0.5) * svgSize * 0.6;

            const strokeColour = nextRand() > 0.5 ? colours.kolam : colours.kolamSecondary;
            const strokeWidth = 1 + nextRand() * (stage * 0.4);
            const opacity = 0.3 + nextRand() * 0.4;

            paths += `<path d="M${start.x},${start.y} Q${cpx},${cpy} ${end.x},${end.y}"
                fill="none" stroke="${strokeColour}" stroke-width="${strokeWidth}"
                opacity="${opacity}" stroke-linecap="round"/>`;
        }

        // Add symmetry (mirror paths for kolam aesthetics)
        let mirroredPaths = '';
        for (let i = 0; i < Math.min(numCurves, 6); i++) {
            const startIdx = Math.floor(nextRand() * positions.length);
            const endIdx = Math.floor(nextRand() * positions.length);
            if (startIdx === endIdx) continue;

            const start = positions[startIdx];
            const end = positions[endIdx];
            const cpx = svgSize - (center + (nextRand() - 0.5) * svgSize * 0.5);
            const cpy = svgSize - (center + (nextRand() - 0.5) * svgSize * 0.5);

            const strokeColour = colours.kolamSecondary;
            const opacity = 0.2 + nextRand() * 0.3;

            mirroredPaths += `<path d="M${svgSize - start.x},${svgSize - start.y}
                Q${cpx},${cpy} ${svgSize - end.x},${svgSize - end.y}"
                fill="none" stroke="${strokeColour}" stroke-width="1"
                opacity="${opacity}" stroke-linecap="round"/>`;
        }

        // Central motif (grows with stage)
        const motifRadius = 8 + stage * 5;
        const motifPoints = 4 + stage * 2;
        let motif = '';
        for (let i = 0; i < motifPoints; i++) {
            const angle = (i / motifPoints) * Math.PI * 2;
            const r = motifRadius + nextRand() * 8;
            const x = center + Math.cos(angle) * r;
            const y = center + Math.sin(angle) * r;
            if (i === 0) {
                motif += `M${x},${y}`;
            } else {
                const cpAngle = angle - (Math.PI / motifPoints);
                const cpR = r * (0.6 + nextRand() * 0.4);
                const cpx = center + Math.cos(cpAngle) * cpR;
                const cpy = center + Math.sin(cpAngle) * cpR;
                motif += ` Q${cpx},${cpy} ${x},${y}`;
            }
        }
        motif += 'Z';

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgSize} ${svgSize}" width="${svgSize}" height="${svgSize}">
            <defs>
                <filter id="glow-${seed}">
                    <feGaussianBlur stdDeviation="2" result="blur"/>
                    <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
            </defs>
            <g opacity="0.6">${dots}</g>
            <g>${paths}</g>
            <g>${mirroredPaths}</g>
            <path d="${motif}" fill="none" stroke="${colours.kolam}" stroke-width="1.5"
                opacity="0.6" filter="url(#glow-${seed})"/>
            <circle cx="${center}" cy="${center}" r="3" fill="${colours.primary}" opacity="0.8"/>
        </svg>`;

        return svg;
    }

    return { generate, hash };
})();
