// ─────────────────────────────────────────────
// ARIVAR Voice Engine
// Phase 1: SpeechSynthesis output + Voice-note recorder
// All audio stays on device. Nothing leaves.
// ─────────────────────────────────────────────

const VoiceEngine = (() => {
    // ─── State ───
    let mediaRecorder = null;
    let audioChunks = [];
    let recordingStream = null;
    let isRecording = false;
    let ttsEnabled = true;
    let currentUtterance = null;

    // ─── TTS: ARIVAR speaks questions aloud ───
    function speak(text, lang = 'en-IN') {
        if (!ttsEnabled || !('speechSynthesis' in window)) return Promise.resolve();

        return new Promise((resolve) => {
            // Cancel any current speech
            window.speechSynthesis.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            currentUtterance = utterance;

            // Pick best voice for the language
            const voices = window.speechSynthesis.getVoices();
            const preferred = voices.find(v => v.lang === lang && v.localService) ||
                voices.find(v => v.lang.startsWith(lang.split('-')[0])) ||
                voices.find(v => v.lang.startsWith('en'));

            if (preferred) utterance.voice = preferred;
            utterance.rate = 0.95;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;

            utterance.onend = () => { currentUtterance = null; resolve(); };
            utterance.onerror = () => { currentUtterance = null; resolve(); };

            window.speechSynthesis.speak(utterance);
        });
    }

    function stopSpeaking() {
        window.speechSynthesis.cancel();
        currentUtterance = null;
    }

    function setTTSEnabled(enabled) {
        ttsEnabled = enabled;
        if (!enabled) stopSpeaking();
    }

    // ─── Voice Note: Record, playback, type ───
    async function startRecording(onVisualize) {
        if (isRecording) return;

        try {
            recordingStream = await navigator.mediaDevices.getUserMedia({
                audio: { echoCancellation: true, noiseSuppression: true }
            });

            audioChunks = [];
            mediaRecorder = new MediaRecorder(recordingStream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
                    ? 'audio/webm;codecs=opus'
                    : 'audio/webm'
            });

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunks.push(e.data);
            };

            // Visualizer: feed audio levels to callback
            if (onVisualize) {
                const ctx = new AudioContext();
                const source = ctx.createMediaStreamSource(recordingStream);
                const analyser = ctx.createAnalyser();
                analyser.fftSize = 256;
                source.connect(analyser);

                const dataArray = new Uint8Array(analyser.frequencyBinCount);
                const pump = () => {
                    if (!isRecording) return;
                    analyser.getByteFrequencyData(dataArray);
                    const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                    onVisualize(avg / 255);
                    requestAnimationFrame(pump);
                };
                pump();
            }

            mediaRecorder.start(100); // 100ms chunks for smooth visualization
            isRecording = true;
            return true;
        } catch (err) {
            console.warn('Mic access denied or unavailable:', err);
            return false;
        }
    }

    function stopRecording() {
        return new Promise((resolve) => {
            if (!isRecording || !mediaRecorder) { resolve(null); return; }

            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunks, { type: 'audio/webm' });
                audioChunks = [];
                isRecording = false;

                // Stop all tracks
                if (recordingStream) {
                    recordingStream.getTracks().forEach(t => t.stop());
                    recordingStream = null;
                }

                resolve(blob);
            };

            mediaRecorder.stop();
        });
    }

    function createPlaybackURL(blob) {
        return URL.createObjectURL(blob);
    }

    function revokePlaybackURL(url) {
        URL.revokeObjectURL(url);
    }

    // ─── Duration formatter ───
    function formatDuration(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    // ─── Store voice note in IndexedDB for future playback ───
    async function storeVoiceNote(questionId, blob) {
        try {
            // Store as arraybuffer in ProfileStore
            const buffer = await blob.arrayBuffer();
            await ProfileStore.setSetting(`voice-${questionId}`, {
                data: Array.from(new Uint8Array(buffer)),
                type: blob.type,
                timestamp: Date.now()
            });
        } catch (e) {
            console.warn('Failed to store voice note:', e);
        }
    }

    // ─── Preload voices (needed on some browsers) ───
    function init() {
        if ('speechSynthesis' in window) {
            // Chrome needs this event to populate voices
            window.speechSynthesis.onvoiceschanged = () => {
                const voices = window.speechSynthesis.getVoices();
                const tamil = voices.filter(v => v.lang.startsWith('ta'));
                const english = voices.filter(v => v.lang.startsWith('en'));
                console.log(`[VoiceEngine] Loaded ${voices.length} voices (${tamil.length} Tamil, ${english.length} English)`);
            };
            // Trigger initial load
            window.speechSynthesis.getVoices();
        }
    }

    // ─── Public API ───
    return {
        init,
        speak,
        stopSpeaking,
        setTTSEnabled,
        get isTTSEnabled() { return ttsEnabled; },
        get isSpeaking() { return currentUtterance !== null; },
        startRecording,
        stopRecording,
        get isRecording() { return isRecording; },
        createPlaybackURL,
        revokePlaybackURL,
        storeVoiceNote,
        formatDuration
    };
})();
