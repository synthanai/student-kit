# 🧬 Profile Kit

**Build your 3×3 AI profile**  -  a personalised instruction set that transforms ChatGPT from a generic assistant into an AI tuned to YOUR brain.

## What It Does

Profile Kit walks you through three 15-20 minute conversations that map how you operate across every dimension:

|  | 📥 Input | ⚙️ Process | 📤 Output |
|--|----------|-----------|-----------|
| 🧠 **Personal** | How you learn | How you think | How you express |
| 🤝 **Social** | How you read people | How you navigate relationships | How you communicate |
| 💼 **Professional** | How you absorb work knowledge | How you solve work problems | How you deliver results |

At the end of each conversation, you get a **PIC AI instruction set**:
- **Layer 1: Persona**  -  who you are (your patterns)
- **Layer 2: Interface**  -  how AI should serve you (your preferences)
- **Layer 3: Compass**  -  how AI should grow you (70% serve, 30% stretch)

## Quick Start

### Step 1: Create the GPTs

You need to create 3 Custom GPTs in ChatGPT. For each one:

1. Go to [ChatGPT GPT Builder](https://chat.openai.com/gpts/editor)
2. Click **Create**
3. Go to the **Configure** tab
4. **Name** the GPT (see table below)
5. **Paste** the instructions from the `instructions.md` file (the content inside the code block)
6. **Upload** the other 5 `.md` files as **Knowledge Files**
7. Click **Save** → **Only me** (or publish if you want to share)

| GPT Name | Folder | Instructions | Knowledge Files |
|----------|--------|-------------|-----------------|
| Student GPT - Personal | [`personal/`](personal/) | [`instructions.md`](personal/instructions.md) | 5 files |
| Student GPT - Social | [`social/`](social/) | [`instructions.md`](social/instructions.md) | 5 files |
| Student GPT - Professional | [`professional/`](professional/) | [`instructions.md`](professional/instructions.md) | 5 files |

### Step 2: Run the Profiles

Open each GPT and have a 15-20 minute conversation. The GPT will:
- Ask you questions about how you operate
- Give you example answer types to help you respond
- Build your personalised instruction set

### Step 3: Load Your Profile

1. **Create a new ChatGPT Project** (e.g., "My Study Partner")
2. **Paste** your instruction set into the Project Instructions
3. **Start chatting**  -  every conversation is now personalised to you
4. **Memory does the rest**  -  your AI saves growth observations automatically

### Step 4: Evolve

- Memory adapts your AI between updates
- When you've changed, revisit the Profile GPTs to rebuild
- Paste the new version → Memory stays, nothing is lost

## File Structure

```
profile-kit/
├── README.md                          # You are here
├── personal/                          # 🧠 Personal Profile GPT
│   ├── instructions.md                # Paste into GPT Instructions
│   ├── personal_questions_input.md    # Knowledge File: how you learn
│   ├── personal_questions_process.md  # Knowledge File: how you think
│   ├── personal_questions_output.md   # Knowledge File: how you express
│   ├── personal_questions_growth.md   # Knowledge File: where you grow
│   └── personal_output_template.md    # Knowledge File: output format
├── social/                            # 🤝 Social Profile GPT
│   ├── instructions.md
│   ├── social_questions_input.md
│   ├── social_questions_process.md
│   ├── social_questions_output.md
│   ├── social_questions_growth.md
│   └── social_output_template.md
└── professional/                      # 💼 Professional Profile GPT
    ├── instructions.md
    ├── professional_questions_input.md
    ├── professional_questions_process.md
    ├── professional_questions_output.md
    ├── professional_questions_growth.md
    └── professional_output_template.md
```

## FAQ

**Do I need ChatGPT Plus?**
Yes  -  Custom GPTs and Projects require ChatGPT Plus.

**How long does each profile take?**
15-20 minutes of honest conversation.

**Can I do just one profile?**
Yes! Start with Personal. Add Social and Professional when you're ready.

**Does it work with other AI tools?**
The instruction set is plain text  -  you can paste it into any AI assistant that supports system instructions (Claude Projects, Gemini, etc.).
