# Kit Template

Use this template when creating a new kit for Student Kit.

## Folder Structure

```
kits/your-kit-name/
├── README.md              # Required: what it does, how to use it
├── [module-folders]/       # Standalone modules (if applicable)
│   ├── instructions.md    # Core instructions (if GPT-based)
│   └── [supporting-files] # Knowledge files, templates, etc.
└── CHANGELOG.md           # Optional for v1, required from v2+
```

## README Template

Your kit README must include:

1. **Title and one-liner**  -  what the kit does in one sentence
2. **What it does**  -  expanded explanation (2-3 paragraphs max)
3. **Quick Start**  -  step-by-step guide to get running
4. **File Structure**  -  tree diagram of the kit's contents
5. **FAQ**  -  common questions (at least 3)

## Naming Conventions

- Kit folder: lowercase with hyphens (`study-kit`, `career-kit`)
- Files: lowercase with hyphens or underscores
- GPT instructions: always named `instructions.md`
- Knowledge files: descriptive names (`study_strategies_active_recall.md`)

## KIT Category

Every kit must belong to one category:
- **Knowledge**  -  helps learn and retain information
- **Intuition**  -  develops judgment and self-awareness
- **Tooling**  -  solves a specific practical problem

State the category clearly in the kit README.

## Quality Checklist

Before submitting a kit PR:
- [ ] README is complete (all 5 sections)
- [ ] All files are standalone and functional
- [ ] Tested end-to-end (if GPT-based: created GPT, uploaded files, ran a session)
- [ ] No placeholder content  -  everything works
- [ ] Added kit to root README "Available Kits" table
