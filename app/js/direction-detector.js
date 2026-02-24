/* ═══════════════════════════════════════
   Direction Detector — Hidden NEWS Compass
   Extracts elemental alignment from answers
   Never revealed to the student
   ═══════════════════════════════════════ */

const DirectionDetector = (() => {

    const scores = { north: 0, east: 0, south: 0, west: 0 };
    let totalSignals = 0;

    function reset() {
        scores.north = 0;
        scores.east = 0;
        scores.south = 0;
        scores.west = 0;
        totalSignals = 0;
    }

    // Analyze a user answer against a question's signal map
    function analyzeAnswer(answer, signalMap) {
        if (!signalMap || !signalMap.direction) return;

        const lowerAnswer = answer.toLowerCase();

        Object.entries(signalMap.direction).forEach(([direction, keywords]) => {
            // Handle both array and object formats (E2 has best/worst)
            const allKeywords = Array.isArray(keywords)
                ? keywords
                : [...(keywords.best || []), ...(keywords.worst || [])];

            allKeywords.forEach(keyword => {
                if (lowerAnswer.includes(keyword.toLowerCase())) {
                    scores[direction] += 1;
                    totalSignals += 1;
                }
            });
        });
    }

    // Get normalised direction scores (0-100)
    function getScores() {
        if (totalSignals === 0) {
            return { north: 25, east: 25, south: 25, west: 25 };
        }

        const total = scores.north + scores.east + scores.south + scores.west;
        return {
            north: Math.round((scores.north / total) * 100),
            east: Math.round((scores.east / total) * 100),
            south: Math.round((scores.south / total) * 100),
            west: Math.round((scores.west / total) * 100)
        };
    }

    // Get primary and secondary directions
    function getAlignment() {
        const normalised = getScores();
        const sorted = Object.entries(normalised)
            .sort(([, a], [, b]) => b - a);

        return {
            ...normalised,
            primary: sorted[0][0],
            secondary: sorted[1][0],
            primary_score: sorted[0][1],
            secondary_score: sorted[1][1]
        };
    }

    // Get colour palette based on direction alignment
    function getColourPalette() {
        const alignment = getAlignment();
        const palettes = {
            north: {
                primary: '#4ecdc4',
                secondary: '#a8e6cf',
                accent: '#c0d9d5',
                gradient: 'linear-gradient(135deg, #1a2f2d, #2a3f3d, #1a2f2d)'
            },
            east: {
                primary: '#e07a3a',
                secondary: '#f5a623',
                accent: '#c0392b',
                gradient: 'linear-gradient(135deg, #2f1a10, #3f2a18, #2f1a10)'
            },
            south: {
                primary: '#5d8a4e',
                secondary: '#8b7355',
                accent: '#c87941',
                gradient: 'linear-gradient(135deg, #1a2f18, #2a3f20, #1a2f18)'
            },
            west: {
                primary: '#4a6fa5',
                secondary: '#6885a5',
                accent: '#3d5a80',
                gradient: 'linear-gradient(135deg, #1a1a2f, #2a2a3f, #1a1a2f)'
            }
        };

        const p = palettes[alignment.primary];
        const s = palettes[alignment.secondary];

        return {
            base: p.gradient,
            primary: p.primary,
            secondary: s.primary,
            accent: p.accent,
            kolam: p.primary,
            kolamSecondary: s.primary,
            text: '#f0e6d6',
            textSecondary: s.secondary
        };
    }

    return { reset, analyzeAnswer, getScores, getAlignment, getColourPalette };
})();
