# Sonkil - Emacs-style Text Operations for Obsidian

In Korean, 'Sonkil' means a helping hand with care or a delicate touch.
This plugin aims to be a gentle assistant that respects your notes and provides help just where needed.

## Features

### Features

- **Non-English Input Support**: Hotkeys work properly even when using non-English input methods
- **Kill Ring**: Storage system with 120 entry capacity
- **Clipboard Sync**: Cut/copied text automatically syncs with system clipboard
- **Multi-cursor Kill Line**: Cut text from multiple cursor positions and store as a single paragraph
- **Visual Mark Selection**: Selected text between mark and cursor is highlighted with a subtle background color
- **Multi-cursor Yank**: Paste text at multiple cursor positions simultaneously
- **Status Bar Feedback**: Shows current operation status in the status bar

### Emacs-style Keystrokes

| Keystrokes | Description                                                                                       |
| ---------- | ------------------------------------------------------------------------------------------------- |
| `C-Space`  | Set mark at current cursor position                                                               |
| `C-k`      | Cut text from cursor position to end of line (Kill Line)                                          |
| `C-w`      | Cut text between mark and cursor (Kill Region)                                                    |
| `M-w`      | Copy text between mark and cursor (Copy Region)                                                   |
| `C-y`      | Paste most recent text from kill ring (Yank, imports from system clipboard if kill ring is empty) |
| `M-y`      | Cycle through previously cut text after yank (Yank Pop)                                           |
| `C-l`      | Recenter editor view (cycles through Center/Top/Bottom)                                           |
| `C-g`      | Cancel current operation (mark, yank mode, multi-cursor)                                          |

### Other Keystrokes

| Keystrokes         | Description                    |
| ------------------ | ------------------------------ |
| `Ctrl + Alt + ↑`   | Move the current line up       |
| `Ctrl + Alt + ↓`   | Move the current line down     |
| `Ctrl + Shift + ↑` | Add a cursor on the line above |
| `Ctrl + Shift + ↓` | Add a cursor on the line below |

## Installation

### For Regular Users

**Method 1: Community Plugins (Recommended)**

1. Enable "Community Plugins" in Obsidian settings.
2. Disable "Safe Mode".
3. Search for "Sonkil", install, and enable the plugin.

**Method 2: Manual Installation**

Alternatively, you can install manually:

1.  Go to the [GitHub Releases page](https://github.com/ohyoungpark/obsidian-sonkil/releases) for this repository.
2.  Download the `main.js`, `manifest.json`, and `styles.css` (if present) files for the desired version.
3.  Create a new folder named `obsidian-sonkil` inside your Obsidian Vault's plugins folder (`YourVault/.obsidian/plugins/`). (You can find the Vault path in Obsidian's Settings > About tab.)
4.  Copy the downloaded files into the newly created `obsidian-sonkil` folder.
5.  Completely quit and restart Obsidian.
6.  Go to Obsidian Settings > Community Plugins, **ensure Safe Mode is disabled**, and enable the "Sonkil" plugin.

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
