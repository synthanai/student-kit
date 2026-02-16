# Contributing to Student Kit

Thank you for your interest in contributing! Student Kit is an open-source project and we welcome contributions from everyone  -  students, educators, developers, and AI enthusiasts.

## How to Contribute

### 🐛 Report Issues
Found a bug or have a suggestion? [Open an issue](../../issues/new/choose) using the appropriate template.

### 📝 Improve Existing Kits
- Fix typos, improve question wording, or clarify instructions
- Add examples or translations
- Improve workshop materials

### 💡 Propose a New Kit
Want to build a new kit? Use the [New Kit Proposal](../../issues/new?template=new-kit-proposal.md) template. Describe:
- What student problem it solves
- Which KIT category it belongs to (Knowledge, Intuition, or Tooling)
- What the kit would contain

### 🎤 Create Workshop Materials
Workshops help educators run sessions using Student Kit tools. See [Workshop Guidelines](#workshop-guidelines) below.

## Kit Template

Every kit follows the same structure. See [docs/kit-template.md](docs/kit-template.md) for the full standard.

```
kits/your-kit-name/
├── README.md              # What it does, how to use it, deployment guide
├── [domain-folders]/      # Standalone modules within the kit
│   ├── instructions.md    # Core instructions (if GPT-based)
│   └── [knowledge-files]  # Supporting files
└── CHANGELOG.md           # Version history (optional for v1)
```

**Required files:**
- `README.md`  -  must explain what the kit does, who it's for, and how to use it
- At least one functional module

## Workshop Guidelines

```
workshops/your-workshop-name/
├── README.md              # Overview, audience, duration, materials needed
├── outline.md             # Timed session outline
├── facilitator-guide.md   # How to run the session
└── assets/                # Slides, handouts, QR codes
```

## Pull Request Process

1. Fork the repo and create a branch from `main`
2. Make your changes following the kit or workshop template
3. Ensure all markdown renders correctly
4. Submit a PR with a clear description of what you changed and why

## Code of Conduct

Be kind, be constructive, be helpful. We're building tools for students  -  let's make the community as welcoming as the tools.

## Questions?

Open a [Discussion](../../discussions) or reach out via Issues.
