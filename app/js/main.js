/* ═══════════════════════════════════════
   Main — App Shell & Navigation
   View routing, event binding, state management
   ═══════════════════════════════════════ */

(async function main() {
    // ─── State ───
    let currentView = 'home';

    // ─── Init ───
    await ProfileStore.open();
    await refreshHome();

    // ─── Navigation ───
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;
            navigateTo(view);
        });
    });

    function navigateTo(viewId) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

        const viewEl = document.getElementById(`view-${viewId}`);
        if (viewEl) {
            viewEl.classList.add('active');
            currentView = viewId;
        }

        const navBtn = document.querySelector(`.nav-item[data-view="${viewId}"]`);
        if (navBtn) navBtn.classList.add('active');

        // Refresh view content
        if (viewId === 'home') refreshHome();
        if (viewId === 'card') refreshCard();
        if (viewId === 'passport') refreshPassport();

        // Show/hide bottom nav in chat view
        document.getElementById('bottom-nav').style.display =
            viewId === 'chat' ? 'none' : 'flex';
    }

    // ─── Back buttons ───
    document.getElementById('btn-chat-back').addEventListener('click', () => navigateTo('home'));
    document.getElementById('btn-card-back').addEventListener('click', () => navigateTo('home'));
    document.getElementById('btn-passport-back').addEventListener('click', () => navigateTo('card'));
    document.getElementById('btn-settings-back').addEventListener('click', () => navigateTo('home'));

    // ─── Start CORE button ───
    document.getElementById('btn-start-core').addEventListener('click', startCOREFlow);

    // ─── Chat input ───
    const chatInput = document.getElementById('chat-input');
    const btnSend = document.getElementById('btn-send');

    btnSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Auto-resize textarea
    chatInput.addEventListener('input', () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
    });

    // ─── Voice Controls ───
    VoiceEngine.init();

    // TTS toggle (ARIVAR speaks questions)
    const btnVoiceToggle = document.getElementById('btn-voice-toggle');
    const savedTTS = await ProfileStore.getSetting('tts-enabled', true);
    VoiceEngine.setTTSEnabled(savedTTS);
    if (!savedTTS) btnVoiceToggle.classList.add('muted');

    btnVoiceToggle.addEventListener('click', async () => {
        const nowEnabled = !VoiceEngine.isTTSEnabled;
        VoiceEngine.setTTSEnabled(nowEnabled);
        btnVoiceToggle.classList.toggle('muted', !nowEnabled);
        btnVoiceToggle.textContent = nowEnabled ? '🔊' : '🔇';
        await ProfileStore.setSetting('tts-enabled', nowEnabled);
    });

    // Voice-note recording (hold to record)
    const btnMic = document.getElementById('btn-mic');
    const micDot = document.getElementById('mic-dot');
    const overlay = document.getElementById('voice-recording-overlay');
    const waveformEl = document.getElementById('recording-waveform');
    const timerEl = document.getElementById('recording-timer');
    const playbackPanel = document.getElementById('voice-playback');
    const btnPlay = document.getElementById('btn-voice-play');
    const btnDiscard = document.getElementById('btn-voice-discard');
    const btnUse = document.getElementById('btn-voice-use');
    const durationEl = document.getElementById('voice-duration');
    const waveformStatic = document.getElementById('voice-waveform-static');

    let recordingTimer = null;
    let recordingSeconds = 0;
    let currentAudioBlob = null;
    let currentAudioURL = null;
    let audioPlayer = null;

    // Create waveform bars for recording visualization
    for (let i = 0; i < 30; i++) {
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = '4px';
        waveformEl.appendChild(bar);
    }
    const waveformBars = waveformEl.querySelectorAll('.bar');

    async function startMicRecording() {
        const ok = await VoiceEngine.startRecording((level) => {
            // Update waveform bars
            waveformBars.forEach((bar, i) => {
                const h = Math.max(4, level * 40 * (0.5 + Math.random() * 0.5));
                bar.style.height = h + 'px';
            });
        });

        if (!ok) return;

        btnMic.classList.add('recording');
        micDot.style.display = 'block';
        overlay.style.display = 'flex';
        recordingSeconds = 0;
        timerEl.textContent = '0:00';

        recordingTimer = setInterval(() => {
            recordingSeconds++;
            timerEl.textContent = VoiceEngine.formatDuration(recordingSeconds);
        }, 1000);
    }

    async function stopMicRecording() {
        clearInterval(recordingTimer);
        btnMic.classList.remove('recording');
        micDot.style.display = 'none';
        overlay.style.display = 'none';

        const blob = await VoiceEngine.stopRecording();
        if (!blob || recordingSeconds < 1) return; // Too short

        currentAudioBlob = blob;
        currentAudioURL = VoiceEngine.createPlaybackURL(blob);
        durationEl.textContent = VoiceEngine.formatDuration(recordingSeconds);

        // Generate static waveform bars for playback panel
        waveformStatic.innerHTML = '';
        for (let i = 0; i < 40; i++) {
            const bar = document.createElement('div');
            bar.className = 'bar';
            bar.style.height = Math.max(3, Math.random() * 20) + 'px';
            waveformStatic.appendChild(bar);
        }

        playbackPanel.style.display = 'flex';
        chatInput.focus();
    }

    // Touch events for hold-to-record (mobile)
    btnMic.addEventListener('touchstart', (e) => { e.preventDefault(); startMicRecording(); });
    btnMic.addEventListener('touchend', (e) => { e.preventDefault(); stopMicRecording(); });

    // Mouse events for hold-to-record (desktop)
    btnMic.addEventListener('mousedown', (e) => { if (e.button === 0) startMicRecording(); });
    btnMic.addEventListener('mouseup', stopMicRecording);
    btnMic.addEventListener('mouseleave', () => { if (VoiceEngine.isRecording) stopMicRecording(); });

    // Playback controls
    btnPlay.addEventListener('click', () => {
        if (!currentAudioURL) return;
        if (audioPlayer) { audioPlayer.pause(); audioPlayer = null; btnPlay.textContent = '▶'; return; }
        audioPlayer = new Audio(currentAudioURL);
        audioPlayer.play();
        btnPlay.textContent = '⏸';
        audioPlayer.onended = () => { btnPlay.textContent = '▶'; audioPlayer = null; };
    });

    btnDiscard.addEventListener('click', () => {
        if (currentAudioURL) VoiceEngine.revokePlaybackURL(currentAudioURL);
        currentAudioBlob = null;
        currentAudioURL = null;
        playbackPanel.style.display = 'none';
        if (audioPlayer) { audioPlayer.pause(); audioPlayer = null; }
    });

    btnUse.addEventListener('click', () => {
        // Play the recording back so student can listen while they type
        if (currentAudioURL && !audioPlayer) {
            audioPlayer = new Audio(currentAudioURL);
            audioPlayer.play();
            audioPlayer.onended = () => { audioPlayer = null; };
        }
        chatInput.focus();
        chatInput.placeholder = 'Listened to your voice note. Now type what you said...';
    });

    // ─── Card actions ───
    document.getElementById('btn-download-card').addEventListener('click', () => {
        CardRenderer.downloadAsPNG(document.getElementById('card-container'));
    });

    document.getElementById('btn-view-passport').addEventListener('click', () => {
        navigateTo('passport');
    });

    document.getElementById('btn-share').addEventListener('click', async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'My ARIVAR Profile',
                    text: 'I discovered my cognitive identity with ARIVAR. Get yours:',
                    url: window.location.href
                });
            } catch (err) {
                // User cancelled share
            }
        }
    });

    // ─── Story Slides ───
    let currentSlides = [];
    let currentSlideIndex = 0;

    document.getElementById('btn-view-stories').addEventListener('click', async () => {
        const section = document.getElementById('story-slides-section');
        const isVisible = section.style.display !== 'none';

        if (isVisible) {
            section.style.display = 'none';
            return;
        }

        // Load profile and generate slides
        const profile = await ProfileStore.loadProfile('core');
        if (!profile || !profile.core) {
            alert('Complete your CORE profile first.');
            return;
        }

        currentSlides = StorySlides.generateAll(profile);
        currentSlideIndex = 0;

        // Render tabs
        const tabsEl = document.getElementById('slide-tabs');
        tabsEl.innerHTML = currentSlides.map((s, i) =>
            `<button class="slide-tab ${i === 0 ? 'active' : ''}" data-idx="${i}">${s.label}</button>`
        ).join('');

        // Tab click handlers
        tabsEl.querySelectorAll('.slide-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                currentSlideIndex = parseInt(tab.dataset.idx);
                showSlide(currentSlideIndex);
                tabsEl.querySelectorAll('.slide-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
            });
        });

        showSlide(0);
        section.style.display = 'flex';
    });

    function showSlide(idx) {
        const preview = document.getElementById('slide-preview');
        preview.innerHTML = currentSlides[idx].svg;
    }

    document.getElementById('btn-slide-download').addEventListener('click', async () => {
        if (!currentSlides.length) return;
        const slide = currentSlides[currentSlideIndex];
        await StorySlides.downloadSlide(slide.svg, `arivar-${slide.type}.png`);
    });

    document.getElementById('btn-slide-share').addEventListener('click', async () => {
        if (!currentSlides.length) return;
        const slide = currentSlides[currentSlideIndex];
        await StorySlides.shareSlide(slide.svg, `My ARIVAR ${slide.label}`);
    });

    // ─── Passport export ───
    document.getElementById('btn-export-json').addEventListener('click', () => {
        Passport.exportJSON();
    });

    // ─── Settings: BYOK ───
    const byokProviderSelect = document.getElementById('setting-byok-provider');
    const byokKeyGroup = document.getElementById('setting-byok-key-group');
    const byokKeyInput = document.getElementById('setting-byok-key');
    const byokKeyLabel = document.getElementById('setting-byok-key-label');
    const byokKeyHint = document.getElementById('setting-byok-hint');
    const byokStatus = document.getElementById('setting-byok-status');

    const providerHints = {
        gemini: { label: 'Gemini API Key', placeholder: 'AIzaSy...', hint: 'Get yours free at aistudio.google.com → API Keys' },
        openrouter: { label: 'OpenRouter API Key', placeholder: 'sk-or-...', hint: 'Get yours at openrouter.ai → Keys' },
        openai: { label: 'OpenAI API Key', placeholder: 'sk-proj-...', hint: 'Get yours at platform.openai.com → API Keys' }
    };

    // Restore saved BYOK settings
    const savedBYOKProvider = await ProfileStore.getSetting('byok-provider', '');
    const savedBYOKKey = await ProfileStore.getSetting('byok-key', '');

    if (savedBYOKProvider && savedBYOKKey) {
        byokProviderSelect.value = savedBYOKProvider;
        LLMClient.setBYOK(savedBYOKProvider, savedBYOKKey);
        showBYOKUI(savedBYOKProvider, true);
    }

    byokProviderSelect.addEventListener('change', async () => {
        const provider = byokProviderSelect.value;
        await ProfileStore.setSetting('byok-provider', provider);

        if (!provider) {
            byokKeyGroup.style.display = 'none';
            LLMClient.setBYOK(null, null);
            updateBYOKStatus('proxy');
        } else {
            showBYOKUI(provider, false);
        }
    });

    byokKeyInput.addEventListener('change', async () => {
        const key = byokKeyInput.value.trim();
        const provider = byokProviderSelect.value;
        if (key && provider) {
            LLMClient.setBYOK(provider, key);
            await ProfileStore.setSetting('byok-key', key);
            updateBYOKStatus('byok', provider);
        }
    });

    function showBYOKUI(provider, hasKey) {
        const hints = providerHints[provider];
        if (!hints) return;

        byokKeyGroup.style.display = 'flex';
        byokKeyLabel.textContent = hints.label;
        byokKeyInput.placeholder = hints.placeholder;
        byokKeyHint.textContent = hints.hint;

        if (hasKey) {
            byokKeyInput.value = '••••••••';
            updateBYOKStatus('byok', provider);
        } else {
            updateBYOKStatus('proxy');
        }
    }

    function updateBYOKStatus(mode, provider) {
        const names = { gemini: 'Gemini', openrouter: 'OpenRouter', openai: 'OpenAI' };
        if (mode === 'byok' && provider) {
            byokStatus.innerHTML = `<span class="status-dot status-byok"></span><span>Using your ${names[provider]} key</span>`;
        } else {
            byokStatus.innerHTML = `<span class="status-dot status-proxy"></span><span>Using ARIVAR free proxy</span>`;
        }
    }

    document.getElementById('btn-clear-data').addEventListener('click', async () => {
        if (confirm('Delete all profile data from this device? This cannot be undone.')) {
            await ProfileStore.clearAll();
            DirectionDetector.reset();
            await refreshHome();
            navigateTo('home');
        }
    });

    // ═══ Functions ═══

    async function refreshHome() {
        const profile = await ProfileStore.getProfile();

        // Update progress track
        const phases = ['core', 'personal', 'social', 'professional'];
        phases.forEach((phase, i) => {
            const el = document.querySelector(`.progress-item[data-phase="${phase}"]`);
            if (!el) return;

            el.classList.remove('active', 'complete', 'locked');

            if (profile && profile[phase]) {
                el.classList.add('complete');
            } else if (profile && profile.stage >= i) {
                el.classList.add('active');
            } else {
                el.classList.add('locked');
            }
        });

        // Update card preview
        const preview = document.getElementById('home-card-preview');
        if (profile && profile.core) {
            CardRenderer.render(profile, preview);
            document.getElementById('btn-start-core').textContent = 'Continue Profiling';
        }

        // Update start button
        const btn = document.getElementById('btn-start-core');
        if (profile && profile.core) {
            if (!profile.personal) {
                btn.textContent = 'Unlock Personal Profile →';
                btn.onclick = () => startPICFlow('personal');
            } else if (!profile.social) {
                btn.textContent = 'Unlock Social Profile →';
                btn.onclick = () => startPICFlow('social');
            } else if (!profile.professional) {
                btn.textContent = 'Unlock Professional Profile →';
                btn.onclick = () => startPICFlow('professional');
            } else {
                btn.textContent = '★ ★ ★ ★ Full Profile Complete';
                btn.disabled = true;
                btn.style.opacity = '0.6';
            }
        }
    }

    async function refreshCard() {
        const profile = await ProfileStore.getProfile();
        const container = document.getElementById('card-container');
        CardRenderer.render(profile, container);

        // Show tier info
        const tierInfoEl = document.getElementById('tier-info');
        if (profile && profile.core && typeof RarityEngine !== 'undefined') {
            const tier = RarityEngine.getTierFromProfile(profile);
            const breakdown = RarityEngine.getBreakdown(profile);

            document.getElementById('tier-badge').innerHTML =
                `<span style="color:${tier.colour};border:1px solid ${tier.colour};padding:4px 12px;border-radius:12px;">${tier.tamil} ${tier.english}</span>`;
            document.getElementById('tier-score').textContent =
                `Rarity Score: ${tier.score}/100 · ${tier.description}`;

            const bdEl = document.getElementById('tier-breakdown');
            bdEl.innerHTML = breakdown.map(b =>
                `<span class="label">${b.label}</span><span class="value">${b.value}</span><span class="pts">+${b.points}</span>`
            ).join('');

            tierInfoEl.style.display = 'block';
        } else {
            tierInfoEl.style.display = 'none';
        }

        // Show upgrade button if not all PICs done
        const upgradeBtn = document.getElementById('btn-upgrade-profile');
        if (profile && profile.stage < 4) {
            upgradeBtn.style.display = 'block';
            upgradeBtn.onclick = () => navigateTo('home');
        } else {
            upgradeBtn.style.display = 'none';
        }
    }

    async function refreshPassport() {
        const profile = await ProfileStore.getProfile();
        Passport.render(profile);
    }

    // ─── Chat Flow ───
    async function startCOREFlow() {
        navigateTo('chat');
        document.getElementById('chat-phase-name').textContent = 'CORE Discovery';
        document.getElementById('chat-phase-tamil').textContent = 'அடிப்படை';

        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML = '';

        // Show greeting
        const greeting = await CoreEngine.start();
        addBotMessage(greeting);
    }

    function startPICFlow(phase) {
        // PIC flows use the same chat UI but different engines
        // Placeholder for Phase 1 expansion
        navigateTo('chat');
        const names = {
            personal: { en: 'Personal Profile', ta: 'தனிப்பட்ட' },
            social: { en: 'Social Profile', ta: 'சமூக' },
            professional: { en: 'Professional Profile', ta: 'தொழில்முறை' }
        };
        document.getElementById('chat-phase-name').textContent = names[phase].en;
        document.getElementById('chat-phase-tamil').textContent = names[phase].ta;

        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML = '';
        addBotMessage(`Let's build your ${names[phase].en}. This will add a new dimension to your ARIVAR card.\n\n(Coming soon — this profile engine is being built.)`);
    }

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Show user message
        addUserMessage(text);
        chatInput.value = '';
        chatInput.style.height = 'auto';
        btnSend.disabled = true;

        // Show typing indicator
        const typingEl = addTypingIndicator();

        // Process answer
        const result = await CoreEngine.processAnswer(text);

        // Remove typing indicator
        typingEl.remove();
        btnSend.disabled = false;

        if (result) {
            // Update progress bar
            document.getElementById('chat-progress-bar').style.width = result.progress + '%';

            // Show bot response
            addBotMessage(result.text);

            if (result.done) {
                // Show "View Card" button in chat
                setTimeout(() => {
                    const btn = document.createElement('button');
                    btn.className = 'btn-primary';
                    btn.textContent = 'View Your ARIVAR Card →';
                    btn.style.margin = '16px 0';
                    btn.addEventListener('click', () => {
                        navigateTo('card');
                        refreshHome();
                    });
                    document.getElementById('chat-messages').appendChild(btn);
                    scrollToBottom();
                }, 800);
            }
        }

        chatInput.focus();
    }

    function addBotMessage(text) {
        const el = document.createElement('div');
        el.className = 'message message-bot';
        el.textContent = text;
        document.getElementById('chat-messages').appendChild(el);
        scrollToBottom();

        // ARIVAR speaks the question aloud (on-device, free)
        if (typeof VoiceEngine !== 'undefined') {
            VoiceEngine.speak(text);
        }
    }

    function addUserMessage(text) {
        const el = document.createElement('div');
        el.className = 'message message-user';
        el.textContent = text;
        document.getElementById('chat-messages').appendChild(el);
        scrollToBottom();
    }

    function addTypingIndicator() {
        const el = document.createElement('div');
        el.className = 'message-typing';
        el.innerHTML = '<span class="typing-dot"></span><span class="typing-dot"></span><span class="typing-dot"></span>';
        document.getElementById('chat-messages').appendChild(el);
        scrollToBottom();
        return el;
    }

    function scrollToBottom() {
        const container = document.getElementById('chat-messages');
        requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight;
        });
    }

})();
