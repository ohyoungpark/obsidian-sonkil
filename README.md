# Sonkil - Emacs-style Text Operations for Obsidian

In Korean, 'Sonkil' means a helping hand with care or a delicate touch.
This plugin aims to be a gentle assistant that respects your notes and provides help just where needed.

## Features

### Features

- **Kill Ring**: Storage system with 120 entry capacity
- **Clipboard Sync**: Cut/copied text automatically syncs with system clipboard
- **Multi-cursor Kill Line**: Cut text from multiple cursor positions and store as a single paragraph
- **Visual Mark Selection**: Selected text between mark and cursor is highlighted with a subtle background color
- **Multi-cursor Yank**: Paste text at multiple cursor positions simultaneously
- **Status Bar Feedback**: Shows current operation status in the status bar

### Available Commands and Suggested Hotkeys

**Important Note:** Default hotkeys have been removed based on Obsidian's plugin guidelines to avoid potential conflicts with existing user configurations and ensure cross-OS compatibility. You can manually configure the hotkeys for Sonkil commands in Obsidian's settings (Settings > Hotkeys).

Here are the suggested key combinations based on the original defaults:

| Suggested Keystrokes   | Command Name                           | Description                                                                                       |
| ---------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `Ctrl+Shift+ArrowDown` | `Sonkil: Add cursor down`              | Add a cursor on the line below                                                                    |
| `Ctrl+Shift+ArrowUp`   | `Sonkil: Add cursor up`                | Add a cursor on the line above                                                                    |
| `Ctrl+g`               | `Sonkil: Cancel mark and exit yank mode` | Cancel current operation (mark, yank mode, multi-cursor)                                          |
| `Alt+w`                | `Sonkil: Copy region`                  | Copy text between mark and cursor (Copy Region)                                                   |
| `Ctrl+k`               | `Sonkil: Kill line`                    | Cut text from cursor position to end of line (Kill Line)                                          |
| `Ctrl+w`               | `Sonkil: Kill region`                  | Cut text between mark and cursor (Kill Region)                                                    |
| `Ctrl+l`               | `Sonkil: Recenter editor view`         | Recenter editor view (cycles through Center/Top/Bottom)                                           |
| `Ctrl+Space`           | `Sonkil: Set mark`                     | Set mark at current cursor position                                                               |
| `Ctrl+y`               | `Sonkil: Yank`                         | Paste most recent text from kill ring (Yank, imports from system clipboard if kill ring is empty) |
| `Alt+y`                | `Sonkil: Yank pop`                     | Cycle through previously cut text after yank (Yank Pop)                                           |

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

### Configuring Hotkeys

Since default hotkeys are not provided due to Obsidian's plugin guidelines, you need to set them manually:

1.  Go to **Settings** (gear icon in the bottom-left corner).
2.  Navigate to the **Hotkeys** section in the left sidebar.
3.  In the search bar at the top of the Hotkeys section, type `Sonkil:` to filter the commands provided by this plugin.
4.  Find the command you want to configure (e.g., `Sonkil: Set mark`).
5.  Click the `+` icon next to the command name.
6.  Press the key combination you want to assign (e.g., `Ctrl+Space`). You can use the combinations suggested in the table above or choose your own.
7.  Repeat steps 4-6 for all the Sonkil commands you wish to use with hotkeys.

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

## License

This project is released into the public domain using The Unlicense. See the [LICENSE](LICENSE) file for details.

## Translations

- [한국어 (Korean)](README.ko.md)
