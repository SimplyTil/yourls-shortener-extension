# Chrome Extension for YOURLS Link Shortener

A modern browser extension for quickly shortening URLs with your own [YOURLS](https://yourls.org/) (Your Own URL Shortener) instance. Built with Manifest V3 compatibility for Chrome and Chromium-based browsers.

## ✨ Features

### Core Functionality
- **One-Click Shortening**: Shorten the current page URL with a single click
- **Context Menu Integration**: Right-click on any link to shorten it directly
- **Custom Keywords**: Optionally specify custom keywords for your shortened URLs
- **Auto-Copy**: Automatically copy shortened URLs to clipboard
- **Multi-Server Support**: Configure and switch between multiple YOURLS servers

### Modern Interface
- **Clean Dashboard**: View your YOURLS statistics at a glance:
  - Total links and clicks
  - Average clicks per link
  - Recently shortened links with click counts
  - One-click copy for any shortened URL
- **Tabbed Settings**: Well-organized settings with separate tabs for Servers, Dashboard, and General options
- **Visual Feedback**: Clear success/error messages and loading states
- **Auto-Save**: Settings are saved automatically as you make changes
- **What's New**: Built-in changelog to track updates and new features

### Advanced Features
- **Internationalization**: Available in multiple languages with RTL support
- **Accessibility**: Keyboard navigation, proper ARIA attributes, and reduced motion support
- **Responsive Design**: Works well on any screen size
- **Error Handling**: Clear error messages with helpful troubleshooting info

## 🚀 Installation

### Chrome Web Store (Recommended)
1. Visit the [Chrome Web Store page](https://lyxo.link/l4kzv)
2. Click "Add to Chrome"
3. Confirm the installation

### Manual Installation
1. Download the latest release from [GitHub Releases](https://github.com/simplytil/yourls-shortener-extension/releases)
2. Extract the zip file to a folder
3. In Chrome, go to `chrome://extensions/`
4. Enable "Developer mode" in the top-right corner
5. Click "Load unpacked" and select the extracted folder

## ⚙️ Configuration

### Setting Up Your YOURLS Server

1. Click the extension icon and select "Settings" (gear icon)
2. Navigate to the "Servers" tab

#### Primary Server Configuration
- **YOURLS Server URL**: Enter the base URL of your YOURLS installation
  - Example: `https://your-domain.com/yourls` or `http://localhost/yourls`
  - Make sure to include the correct protocol (`http://` or `https://`)
  - You don't need to include `yourls-api.php` at the end
- **Signature Token**: Enter your YOURLS signature token
  - Find this in your YOURLS admin panel under Tools → API
- Click "Test Connection" to verify your settings

#### Additional Server (Optional)
- Enable the "Additional YOURLS server" toggle
- Configure URL, signature token, and display name
- Use the server selector dropdown in the popup to switch between servers

### General Settings

Navigate to the "General" tab to configure behavior and interface options:

- **Always ask for keyword**: When enabled, you'll be prompted for a custom keyword each time
- **Auto-copy shortened URL**: Automatically copy the short URL to your clipboard
- **Auto-save settings**: Save changes automatically without clicking the save button
- **Language**: Choose your preferred language from the dropdown

## 📝 Usage

### Basic Usage
1. Navigate to any webpage you want to shorten
2. Click the YOURLS extension icon in your toolbar
3. (Optional) Enter a custom keyword if the setting is enabled
4. Click "Shorten URL"
5. Copy the shortened URL or use it directly (it's automatically copied if auto-copy is enabled)

### Context Menu
- Right-click on any link
- Select "Shorten Link" from the context menu
- The extension popup will open with that link ready to be shortened

### Dashboard
Click the extension icon, then open settings and go to the "Dashboard" tab to:
- View statistics from your YOURLS server
- See your most recently created short links
- Copy any of your recent links with a single click
- Switch between servers (if you've configured multiple)

## 🛠 Technical Details

- Built with Manifest V3 for modern browser compatibility
- Uses background scripts to handle API requests and bypass CORS restrictions
- Implements modern JavaScript with async/await patterns
- Utilizes CSS custom properties for consistent theming
- Provides comprehensive error handling and user feedback

## 🔍 Troubleshooting

### Common Issues

**Connection Failed**
- Verify your YOURLS URL is correct and includes the protocol (`http://` or `https://`)
- Check that your signature token is valid
- Ensure your YOURLS server is online and accessible

**Extension Not Working**
- Check browser console for any error messages
- Verify that you have the necessary permissions enabled
- Try reinstalling the extension

**Server Not Showing in Dashboard**
- Make sure you've properly configured server settings
- Check that your YOURLS API is properly responding
- Some older YOURLS versions may not support all dashboard features

## 📚 Resources

- [YOURLS Official Website](https://yourls.org/)
- [YOURLS Documentation](https://docs.yourls.org/)
- [Report Issues](https://github.com/simplytil/yourls-shortener-extension/issues)

## 📜 License

```
Copyright 2025 YOURLS Link Shortener Contributors

Licensed under the GNU General Public License v3.0 (GPL-3.0)
You may obtain a copy of the License at

    https://www.gnu.org/licenses/gpl-3.0.html
```

## 👏 Acknowledgments

- Thanks to [binfalse](https://github.com/binfalse) for the initial idea and code foundation
- YOURLS team for creating the excellent URL shortener platform
