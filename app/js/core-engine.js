/* ═══════════════════════════════════════
   CORE Engine — Conversational Profiling
   Adaptive questions, hidden direction detection
   LLM-powered with manual fallback
   v2: Emotional warmth, name memory, phase awareness
   ═══════════════════════════════════════ */

const CoreEngine = (() => {
    let questionBank = null;
    let currentPhase = 0;
    let currentQuestion = 0;
    let conversationHistory = [];
    let answers = {};
    let isProcessing = false;
    let studentName = '';
    let studentField = '';

    async function loadQuestions() {
        if (questionBank) return questionBank;
        const response = await fetch('data/core-questions.json');
        questionBank = await response.json();
        return questionBank;
    }

    async function start() {
        const bank = await loadQuestions();
        DirectionDetector.reset();
        conversationHistory = [];
        answers = {};
        currentPhase = 0;
        currentQuestion = 0;
        studentName = '';
        studentField = '';

        // Add system prompt to conversation
        conversationHistory.push({
            role: 'system',
            content: bank.system_prompt + '\n\nSYNTHESIS FORMAT:\n' + bank.synthesis_prompt
        });

        return bank.opening.greeting;
    }

    // Extract name from the student's opening answer
    function extractStudentInfo(text) {
        // Common patterns: "I'm Ravi", "My name is Priya", "Ravi, CS, 2nd year"
        const namePatterns = [
            /(?:i'?m|my name is|i am|this is)\s+([A-Z][a-z]+)/i,
            /^([A-Z][a-z]+)[\s,]/,
            /^([A-Z][a-z]+)$/
        ];
        for (const p of namePatterns) {
            const m = text.match(p);
            if (m) { studentName = m[1]; break; }
        }

        // Extract field of study
        const fieldPatterns = [
            /(?:studying|study|course|doing|in)\s+(?:b\.?a\.?|b\.?sc\.?|b\.?e\.?|b\.?tech\.?|m\.?a\.?|m\.?sc\.?)?\s*([A-Za-z\s]+?)(?:\s*,|\s*\.|$)/i,
            /(?:CS|IT|ECE|EEE|Mech|Civil|Bio|Chem|Physics|Maths|English|Tamil|Commerce|CA|MBA)/i
        ];
        for (const p of fieldPatterns) {
            const m = text.match(p);
            if (m) { studentField = m[1] || m[0]; break; }
        }

        // Fallback: use first capitalized word as name
        if (!studentName) {
            const words = text.split(/[\s,]+/);
            const cap = words.find(w => /^[A-Z][a-z]{2,}/.test(w));
            if (cap) studentName = cap;
        }

        answers.name = studentName || 'Student';
        answers.field = studentField || '';
    }

    async function processAnswer(userText) {
        if (isProcessing) return null;
        isProcessing = true;

        try {
            const bank = await loadQuestions();
            const phases = bank.phases;

            // Store user answer
            conversationHistory.push({ role: 'user', content: userText });

            // Extract student info from first answer
            if (currentPhase === 0 && currentQuestion === 0 && !studentName) {
                extractStudentInfo(userText);
            }

            // Direction detection on user answer
            const phase = phases[currentPhase];
            if (phase) {
                const question = phase.questions[currentQuestion];
                if (question && question.signals) {
                    DirectionDetector.analyzeAnswer(userText, question.signals);
                }

                // Store answer
                const questionId = question ? question.id : `extra_${currentPhase}_${currentQuestion}`;
                answers[questionId] = userText;
            }

            // Determine next action
            const wordCount = userText.trim().split(/\s+/).length;
            const isShort = wordCount < 15;
            const isRich = wordCount > 40;
            const hasPhase = currentPhase < phases.length;

            if (hasPhase) {
                const phaseQuestions = phases[currentPhase].questions;
                const currentQ = phaseQuestions[currentQuestion];

                // If answer is thin and we have a follow-up, probe deeper
                if (isShort && currentQ && currentQ.follow_up_thin && !answers[currentQ.id + '_probed']) {
                    answers[currentQ.id + '_probed'] = true;

                    const response = await getNextResponse(currentQ.follow_up_thin, {
                        phase: phase.id,
                        isProbe: true,
                        richAnswer: false
                    });
                    isProcessing = false;
                    return { text: response, done: false, progress: getProgress() };
                }

                // Move to next question in current phase
                currentQuestion++;

                // Check if question has a condition
                while (currentQuestion < phaseQuestions.length) {
                    const nextQ = phaseQuestions[currentQuestion];
                    if (nextQ.condition) {
                        if (nextQ.condition === 'ask_if_origin_needs_depth' && !needsMoreDepth()) {
                            currentQuestion++;
                            continue;
                        }
                        if (nextQ.condition === 'ask_if_direction_ambiguous' && !isDirectionAmbiguous()) {
                            currentQuestion++;
                            continue;
                        }
                    }
                    break;
                }

                if (currentQuestion >= phaseQuestions.length) {
                    // Move to next phase
                    currentPhase++;
                    currentQuestion = 0;

                    if (currentPhase >= phases.length) {
                        // All phases complete — synthesize
                        const result = await synthesize();
                        isProcessing = false;
                        return { text: result.message, done: true, profile: result.profile, progress: 100 };
                    }

                    // Phase transition
                    const nextPhase = phases[currentPhase];
                    const nextQ = nextPhase.questions[0];
                    const transition = nextPhase.transition || '';
                    const questionText = formatQuestion(nextQ);

                    // Emotional safety nudge before sensitive phases
                    let prefix = '';
                    if (nextPhase.id === 'origin') {
                        prefix = getEmotionalSafetyNudge('origin');
                    } else if (nextPhase.id === 'endurance') {
                        prefix = getEmotionalSafetyNudge('endurance');
                    }

                    const response = await getNextResponse(
                        (prefix ? prefix + '\n\n' : '') + transition + '\n\n' + questionText,
                        { phase: nextPhase.id, isTransition: true, richAnswer: isRich }
                    );
                    isProcessing = false;
                    return { text: response, done: false, progress: getProgress() };
                }

                // Ask next question in same phase
                const nextQ = phaseQuestions[currentQuestion];
                const questionText = formatQuestion(nextQ);

                const response = await getNextResponse(questionText, {
                    phase: phase.id,
                    richAnswer: isRich
                });
                isProcessing = false;
                return { text: response, done: false, progress: getProgress() };
            }

            isProcessing = false;
            return { text: 'Something went wrong. Let me try again.', done: false, progress: getProgress() };

        } catch (err) {
            console.error('CoreEngine error:', err);
            isProcessing = false;
            return { text: 'I hit a snag. Let me continue with the next question.', done: false, progress: getProgress() };
        }
    }

    function formatQuestion(question) {
        if (!question) return '';
        let text = question.primary;
        if (question.example_types) {
            text += '\n\n' + question.example_types;
        }
        return text;
    }

    function getEmotionalSafetyNudge(phaseId) {
        if (phaseId === 'origin') {
            return `These next questions are about what shaped you. Some of this might be personal. ${studentName ? studentName + ', ' : ''}share only what feels right, and feel free to type instead of speaking if that's easier.`;
        }
        if (phaseId === 'endurance') {
            return "Almost done. This last part is about your line in the sand, the thing you'd never compromise. Be honest with yourself here.";
        }
        return '';
    }

    async function getNextResponse(promptText, context = {}) {
        try {
            conversationHistory.push({ role: 'assistant', content: promptText });

            const phaseContext = context.phase ? `Current phase: ${context.phase.toUpperCase()}.` : '';
            const nameContext = studentName ? `The student's name is ${studentName}.` : '';
            const richContext = context.richAnswer
                ? 'Their previous answer was rich and detailed — acknowledge that warmly before moving on.'
                : context.isProbe
                    ? 'Their previous answer was brief. Probe gently with curiosity, not pressure.'
                    : '';
            const transitionContext = context.isTransition
                ? 'This is a phase transition. Acknowledge what you\'ve learned so far, then introduce the new topic warmly.'
                : '';

            const systemPrompt = `You are continuing a profiling conversation. ${nameContext} ${phaseContext}

INSTRUCTIONS:
- Acknowledge the student's previous answer briefly and naturally (1-2 sentences). ${richContext} ${transitionContext}
- Then ask the next question. ONE question at a time.
- Weave example answer types naturally into the question. DO NOT list them as bullets.
- Be warm and curious, like a mentor who genuinely wants to understand.
- Use their name occasionally (not every message).
- If they shared something emotional, honor it before moving on.
- Keep your response under 100 words.
- Speak naturally, not robotically. This is a conversation, not a form.`;

            const response = await LLMClient.chat([
                ...conversationHistory,
                { role: 'system', content: systemPrompt },
                {
                    role: 'user',
                    content: `The prepared next question is: "${promptText}"\n\nAdapt this question to flow naturally from the conversation. Keep the core intent but make it conversational.`
                }
            ], { maxTokens: 500, temperature: 0.75 });

            // Replace the template with LLM-adapted version
            conversationHistory[conversationHistory.length - 1].content = response;
            return response;
        } catch (err) {
            // Fallback to template question
            console.warn('LLM unavailable, using template:', err.message);
            return promptText;
        }
    }

    async function synthesize() {
        const bank = await loadQuestions();
        const direction = DirectionDetector.getAlignment();

        try {
            const profileJSON = await LLMClient.synthesizeProfile(
                bank.system_prompt + '\n\n' + bank.synthesis_prompt,
                conversationHistory
            );

            // Merge LLM synthesis with direction detection
            const profile = {
                name: studentName || answers.name || 'Student',
                field_of_study: studentField || '',
                ...profileJSON,
                direction
            };

            // Save to local storage
            await ProfileStore.saveProfile('core', profile);
            await ProfileStore.saveConversation('core', conversationHistory);

            // Build the reveal message with Tamil phases
            const calling = profile.core?.calling || profile.calling || '...';
            const origin = profile.core?.origin || profile.origin || '...';
            const reason = profile.core?.reason || profile.reason || '...';
            const endurance = profile.core?.endurance || profile.endurance || '...';

            const message = `${studentName ? studentName + ', here' : 'Here'}'s your CORE Profile:\n\n` +
                `🔥 அழைப்பு CALLING: ${calling}\n\n` +
                `🌱 மூலம் ORIGIN: ${origin}\n\n` +
                `⚡ காரணம் REASON: ${reason}\n\n` +
                `🛡️ தாங்கும் நிலை ENDURANCE: ${endurance}\n\n` +
                (profile.essence ? `✨ ${profile.essence}\n\n` : '') +
                `Your ARIVAR Profile Card is ready. Tap "View Card" to see it.`;

            return { message, profile };
        } catch (err) {
            console.error('Synthesis failed:', err);
            const fallbackProfile = buildFallbackProfile();
            await ProfileStore.saveProfile('core', fallbackProfile);
            return {
                message: `${studentName ? studentName + ', I' : 'I'}'ve captured your answers. Your Profile Card is ready. Tap "View Card" to see it.`,
                profile: fallbackProfile
            };
        }
    }

    function buildFallbackProfile() {
        const direction = DirectionDetector.getAlignment();
        return {
            name: studentName || answers.name || 'Student',
            field_of_study: studentField || '',
            core: {
                calling: answers.C1 || answers.C2 || '(pending)',
                origin: answers.O1 || answers.O2 || '(pending)',
                reason: answers.R1 || '(pending)',
                endurance: answers.E1 || '(pending)'
            },
            essence: 'Profile generated from your answers.',
            direction,
            voice: { tone: 'natural', structure: 'conversational', energy: 'measured' },
            version: '1.0',
            created_at: new Date().toISOString()
        };
    }

    function needsMoreDepth() {
        const o1 = answers.O1 || '';
        const o2 = answers.O2 || '';
        return (o1.split(/\s+/).length < 20 && o2.split(/\s+/).length < 20);
    }

    function isDirectionAmbiguous() {
        const scores = DirectionDetector.getScores();
        const sorted = Object.values(scores).sort((a, b) => b - a);
        return (sorted[0] - sorted[1]) < 10;
    }

    function getProgress() {
        if (!questionBank) return 0;
        const totalPhases = questionBank.phases.length;
        const phaseProgress = currentPhase / totalPhases;
        const questionProgress = questionBank.phases[currentPhase]
            ? currentQuestion / questionBank.phases[currentPhase].questions.length
            : 1;
        return Math.round((phaseProgress + questionProgress / totalPhases) * 100);
    }

    // Get the opening question for the first CORE phase
    async function getFirstQuestion() {
        const bank = await loadQuestions();
        const firstPhase = bank.phases[0];
        const firstQ = firstPhase.questions[0];
        return formatQuestion(firstQ);
    }

    return { start, processAnswer, getFirstQuestion, loadQuestions };
})();
