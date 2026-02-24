/* ═══════════════════════════════════════
   Passport — Cross-LLM Profile Formatter
   One-tap copy for ChatGPT, Gemini, Claude, Perplexity
   ═══════════════════════════════════════ */

const Passport = (() => {

    const providers = [
        {
            id: 'chatgpt',
            name: 'ChatGPT',
            icon: '💬',
            instructions: 'Settings → Personalization → Custom Instructions → paste into "How would you like ChatGPT to respond?"',
            format: formatChatGPT
        },
        {
            id: 'gemini',
            name: 'Gemini',
            icon: '✨',
            instructions: 'Open a Gem → paste into Gem instructions',
            format: formatGemini
        },
        {
            id: 'claude',
            name: 'Claude',
            icon: '🟠',
            instructions: 'Projects → New Project → paste into Project Instructions',
            format: formatClaude
        },
        {
            id: 'perplexity',
            name: 'Perplexity',
            icon: '🔍',
            instructions: 'Spaces → New Space → paste into System Prompt',
            format: formatPerplexity
        }
    ];

    function formatChatGPT(profile) {
        const p = profile;
        if (!p || !p.core) return 'Complete your CORE profile first.';

        let text = `# Who I Am (ARIVAR Profile)\n\n`;
        text += `## My CORE\n`;
        text += `- CALLING: ${p.core.calling}\n`;
        text += `- ORIGIN: ${p.core.origin}\n`;
        text += `- REASON: ${p.core.reason}\n`;
        text += `- ENDURANCE: ${p.core.endurance}\n\n`;
        text += `## My Essence\n${p.core.essence || ''}\n\n`;

        if (p.personal) {
            text += `## How I Learn & Think (Personal)\n`;
            text += formatPIC(p.personal);
        }

        if (p.social) {
            text += `## How I Relate (Social)\n`;
            text += formatPIC(p.social);
        }

        if (p.professional) {
            text += `## How I Work (Professional)\n`;
            text += formatPIC(p.professional);
        }

        text += `\n## Growth Rule\n`;
        text += `70% of the time: serve me in my comfort zone. Match my preferences.\n`;
        text += `30% of the time: gently stretch me in ONE area at a time.\n`;
        text += `When I say "just give me the answer," don't stretch. When I'm curious, stretch.\n`;

        return text;
    }

    function formatGemini(profile) {
        // Gemini prefers more concise instructions
        return formatChatGPT(profile);
    }

    function formatClaude(profile) {
        // Claude handles longer instructions well
        return formatChatGPT(profile);
    }

    function formatPerplexity(profile) {
        // Perplexity Spaces are shorter, focus on identity
        const p = profile;
        if (!p || !p.core) return 'Complete your CORE profile first.';

        let text = `I am a student. Here is my identity profile:\n\n`;
        text += `CALLING: ${p.core.calling}\n`;
        text += `ORIGIN: ${p.core.origin}\n`;
        text += `REASON: ${p.core.reason}\n`;
        text += `ENDURANCE: ${p.core.endurance}\n\n`;
        text += `ESSENCE: ${p.core.essence || ''}\n\n`;
        text += `Match your responses to my identity. Use my communication style. Respect my values.`;

        return text;
    }

    function formatPIC(pic) {
        if (!pic) return '';
        if (typeof pic === 'string') return pic + '\n\n';
        // If PIC is a structured object, format it
        let text = '';
        if (pic.persona) text += `Persona: ${pic.persona}\n`;
        if (pic.interface) text += `Interface: ${pic.interface}\n`;
        if (pic.compass) text += `Compass: ${pic.compass}\n`;
        return text + '\n';
    }

    function render(profile) {
        const container = document.getElementById('passport-providers');
        if (!container) return;

        container.innerHTML = providers.map(prov => {
            const formatted = prov.format(profile);
            const preview = formatted.substring(0, 200) + (formatted.length > 200 ? '...' : '');

            return `
                <div class="provider-card" data-provider="${prov.id}">
                    <div class="provider-card-header">
                        <span class="provider-name">${prov.icon} ${prov.name}</span>
                        <button class="provider-copy-btn" onclick="Passport.copy('${prov.id}')">Copy</button>
                    </div>
                    <p class="provider-instructions">${prov.instructions}</p>
                    <div class="provider-preview">${preview}</div>
                    <textarea class="hidden" id="passport-text-${prov.id}">${formatted}</textarea>
                </div>
            `;
        }).join('');
    }

    async function copy(providerId) {
        const textarea = document.getElementById(`passport-text-${providerId}`);
        if (!textarea) return;

        try {
            await navigator.clipboard.writeText(textarea.value);
            const btn = document.querySelector(`[data-provider="${providerId}"] .provider-copy-btn`);
            if (btn) {
                btn.textContent = '✓ Copied';
                btn.classList.add('copied');
                setTimeout(() => {
                    btn.textContent = 'Copy';
                    btn.classList.remove('copied');
                }, 2000);
            }
        } catch (err) {
            // Fallback for older browsers
            textarea.classList.remove('hidden');
            textarea.select();
            document.execCommand('copy');
            textarea.classList.add('hidden');
        }
    }

    // Export as .arivar JSON file
    async function exportJSON() {
        const data = await ProfileStore.exportProfile();
        if (!data) return;

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `arivar-profile-${Date.now()}.arivar`;
        a.click();
        URL.revokeObjectURL(url);
    }

    return { render, copy, exportJSON, providers };
})();
