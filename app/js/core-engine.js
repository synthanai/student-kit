/* ═══════════════════════════════════════
   CORE Engine — Conversational Profiling
   Adaptive questions, hidden direction detection
   LLM-powered with manual fallback
   ═══════════════════════════════════════ */

const CoreEngine = (() => {
    let questionBank = null;
    let currentPhase = 0;
    let currentQuestion = 0;
    let conversationHistory = [];
    let answers = {};
    let isProcessing = false;

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

        // Add system prompt to conversation
        conversationHistory.push({
            role: 'system',
            content: bank.system_prompt + '\n\nSYNTHESIS FORMAT:\n' + bank.synthesis_prompt
        });

        return bank.opening.greeting;
    }

    async function processAnswer(userText) {
        if (isProcessing) return null;
        isProcessing = true;

        try {
            const bank = await loadQuestions();
            const phases = bank.phases;

            // Store user answer
            conversationHistory.push({ role: 'user', content: userText });

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
            const isShort = userText.trim().split(/\s+/).length < 15;
            const hasPhase = currentPhase < phases.length;

            if (hasPhase) {
                const phaseQuestions = phases[currentPhase].questions;
                const currentQ = phaseQuestions[currentQuestion];

                // If answer is thin and we have a follow-up, probe deeper
                if (isShort && currentQ && currentQ.follow_up_thin && !answers[currentQ.id + '_probed']) {
                    answers[currentQ.id + '_probed'] = true;

                    const response = await getNextResponse(currentQ.follow_up_thin);
                    isProcessing = false;
                    return { text: response, done: false, progress: getProgress() };
                }

                // Move to next question in current phase
                currentQuestion++;

                // Check if question has a condition
                while (currentQuestion < phaseQuestions.length) {
                    const nextQ = phaseQuestions[currentQuestion];
                    if (nextQ.condition) {
                        // Skip conditional questions unless needed
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
                        // All phases complete, synthesize
                        const result = await synthesize();
                        isProcessing = false;
                        return { text: result.message, done: true, profile: result.profile, progress: 100 };
                    }

                    // Transition message + first question of new phase
                    const nextPhase = phases[currentPhase];
                    const nextQ = nextPhase.questions[0];
                    const transition = nextPhase.transition || '';
                    const questionText = formatQuestion(nextQ);

                    const response = await getNextResponse(transition + '\n\n' + questionText);
                    isProcessing = false;
                    return { text: response, done: false, progress: getProgress() };
                }

                // Ask next question in same phase
                const nextQ = phaseQuestions[currentQuestion];
                const questionText = formatQuestion(nextQ);

                // Use LLM for adaptive response or fallback to template
                const response = await getNextResponse(questionText);
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

    async function getNextResponse(promptText) {
        // Try LLM-enhanced response
        try {
            conversationHistory.push({ role: 'assistant', content: promptText });

            const response = await LLMClient.chat([
                ...conversationHistory,
                {
                    role: 'system',
                    content: 'You are continuing a profiling conversation. Acknowledge the student\'s previous answer briefly and naturally (1 sentence), then ask the next question. Weave example answer types naturally into the question. Be warm and curious. ONE question at a time.'
                },
                {
                    role: 'user',
                    content: `The prepared next question is: "${promptText}"\n\nAdapt this question to flow naturally from the conversation. Keep the core intent but make it conversational. Include example answer types naturally.`
                }
            ], { maxTokens: 500, temperature: 0.7 });

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
                name: answers.name || 'Student',
                ...profileJSON,
                direction
            };

            // Save to local storage
            await ProfileStore.saveProfile('core', profile);
            await ProfileStore.saveConversation('core', conversationHistory);

            const message = `Here's your CORE Profile:\n\n` +
                `🔥 CALLING: ${profile.core?.calling || profile.calling || '...'}\n` +
                `🌱 ORIGIN: ${profile.core?.origin || profile.origin || '...'}\n` +
                `⚡ REASON: ${profile.core?.reason || profile.reason || '...'}\n` +
                `🛡️ ENDURANCE: ${profile.core?.endurance || profile.endurance || '...'}\n\n` +
                `✨ ${profile.essence || ''}\n\n` +
                `Your ARIVAR Profile Card is ready. Tap "View Card" to see it.`;

            return { message, profile };
        } catch (err) {
            console.error('Synthesis failed:', err);
            // Fallback: build profile from raw answers
            const fallbackProfile = buildFallbackProfile();
            await ProfileStore.saveProfile('core', fallbackProfile);
            return {
                message: 'I\'ve captured your answers. Your Profile Card is ready, though I couldn\'t fully process them with AI. Tap "View Card" to see it.',
                profile: fallbackProfile
            };
        }
    }

    function buildFallbackProfile() {
        const direction = DirectionDetector.getAlignment();
        return {
            name: answers.name || 'Student',
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
        // Ask O3 if origin answers were thin
        const o1 = answers.O1 || '';
        const o2 = answers.O2 || '';
        return (o1.split(/\s+/).length < 20 && o2.split(/\s+/).length < 20);
    }

    function isDirectionAmbiguous() {
        const scores = DirectionDetector.getScores();
        const sorted = Object.values(scores).sort((a, b) => b - a);
        // Ambiguous if top two scores are within 10 points
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
