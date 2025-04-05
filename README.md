# Sonkil - Emacs-style Text Operations for Obsidian

Sonkil is an Obsidian plugin that provides Emacs-style text manipulation features. It brings the powerful text editing capabilities of Emacs to Obsidian.

## Key Features

### Text Manipulation
- `C-k`: Cut text from cursor position to end of line (Kill Line)
- `C-w`: Cut selected text (Kill Region)
- `M-w`: Copy selected text (Copy Region)

### Kill Ring
- `C-y`: Paste most recent text from kill ring (Yank)
- `M-y`: Cycle through previously cut text after yank (Yank Pop)
- Maximum number of kill ring entries: 60
- Maximum length of kill ring entry: 10,000 characters

### Clipboard Integration
- Paste system clipboard content with `C-y` when kill ring is empty
- Automatically copy cut/copied text to system clipboard

### Convenience Features
- Automatic truncation of kill ring entries exceeding 10,000 characters
- Automatic removal of oldest entries when kill ring is full
- Automatic deselection after text manipulation

## Installation

### For Regular Users
1. Enable "Community Plugins" in Obsidian settings
2. Disable "Safe Mode"
3. Install and enable "Sonkil" plugin

### For Developers

#### Requirements
- Node.js 18 or higher
- npm 10 or higher
- Obsidian Desktop App

#### Development Environment Setup

1. Clone the project:
```bash
git clone https://github.com/ohyoungpark/obsidian-sonkil
cd obsidian-sonkil
```

2. Set Node.js version (using nvm):
```bash
nvm use
```

3. Install dependencies:
```bash
npm install
```

4. Configure development environment:
```bash
# Create .env file
echo "OBSIDIAN_PLUGIN_DIR=/path/to/your/obsidian/plugins/obsidian-sonkil" > .env

# Modify OBSIDIAN_PLUGIN_DIR in .env file to match your Obsidian plugin directory path
```

5. Build and test:
```bash
# Build
npm run build

# Run tests
npm test

# Install in development mode (to local Obsidian vault)
npm run install-dev
```

> **Note**:
> - `.env` file is added to `.gitignore` to prevent committing sensitive information
> - After installing in development mode, you need to restart Obsidian or reload the plugin for changes to take effect

## Test Coverage

Current test coverage:
- Statements: 67.24%
- Branches: 58.97%
- Functions: 57.89%
- Lines: 67.54%

## Contributing

1. Create Issues: Report bugs or suggest features
2. Submit Pull Requests: Contribute code
3. Improve Documentation: Enhance README or comments

## License

MIT License

## Developer Information

- Developer: Ohyoung Park
- Email: ohyoung.park@mail.com
- GitHub: https://github.com/ohyoungpark/obsidian-sonkil

## Translations

- [한국어 (Korean)](README.ko.md)