# Sonkil - Emacs-style Text Operations for Obsidian

In Korean, 'Sonkil' means a helping hand with care or a delicate touch.
This plugin aims to be a gentle assistant that respects your notes and provides help just where needed.

## Features

### Core Emacs-Style Features

| Keystrokes | Description |
|------------|-------------|
| `C-Space` | Set mark at current cursor position |
| `C-k` | Cut text from cursor position to end of line (Kill Line) |
| `C-w` | Cut text between mark and cursor (Kill Region) |
| `M-w` | Copy text between mark and cursor (Copy Region) |
| `C-y` | Paste most recent text from kill ring (Yank, imports from system clipboard if kill ring is empty) |
| `M-y` | Cycle through previously cut text after yank (Yank Pop) |
| `C-l` | Recenter editor view (cycles through Center/Top/Bottom) |
| `C-g` | Cancel current operation (mark, yank mode, multi-cursor) |

### Modern Editor Features

| Keystrokes | Description |
|------------|-------------|
| `Ctrl + Alt + ↑` | Move the current line up |
| `Ctrl + Alt + ↓` | Move the current line down |
| `Ctrl + Shift + ↑` | Add a cursor on the line above |
| `Ctrl + Shift + ↓` | Add a cursor on the line below |

### Features
- Hotkeys work properly even when using non-English input methods
- Kill ring system with 120 entry storage capacity
- Cut/copied text automatically syncs with system clipboard

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
>
> - `.env` file is added to `.gitignore` to prevent committing sensitive information
> - After installing in development mode, you need to restart Obsidian or reload the plugin for changes to take effect

## Translations

- [한국어 (Korean)](README.ko.md)
