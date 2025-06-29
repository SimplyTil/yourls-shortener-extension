# Chrome Extension for YOURLS

A modern, Manifest V3 compatible Chrome extension for interacting with your [YOURLS](http://yourls.org/) (Your Own URL Shortener) instance.

## ✨ Features

### Core Functionality
- **Quick URL Shortening**: Shorten the current page URL with one click
- **Context Menu Integration**: Right-click on any link to shorten it directly
- **Custom Keywords**: Optionally specify custom keywords for your shortened URLs
- **Auto-Copy**: Automatically copy shortened URLs to clipboard
- **Multi-Server Support**: Configure and switch between multiple YOURLS servers

### Modern Interface
- **Redesigned Settings**: Clean, modern interface with improved accessibility and visual hierarchy
- **Tabbed Organization**: Settings organized into Servers, Dashboard, and General tabs
- **Live Dashboard**: View real-time statistics from your YOURLS server including:
  - Total links created
  - Total clicks across all links
  - Average clicks per link
  - Server status monitoring
  - Recent links with click counts and **copy functionality**
  - **Server selector** to view stats from different servers
- **Enhanced Accessibility**: Full keyboard navigation, screen reader support, and proper ARIA labels
- **Responsive Design**: Mobile-first approach with fluid layouts
- **Multi-language Support**: Available in 14+ languages with RTL support

### New in Latest Version
- **🎨 Complete UI Modernization**: Rebuilt with modern design system and CSS best practices
- **📊 Interactive Dashboard**: Copy shortened URLs directly from the dashboard with visual feedback
- **🔄 Server Toggle**: Switch between primary and additional servers in the dashboard
- **♿ Accessibility Improvements**: Enhanced keyboard navigation and screen reader support
- **🎯 Better UX**: Improved visual feedback, loading states, and error handling
- **💾 Auto-Save Settings**: Settings are automatically saved as you make changes (can be disabled)

## Setup Instructions

### Installation
1. Download the extension from the [Chrome Web Store](https://lyxo.link/l4kzv) or install it manually by loading the unpacked extension in developer mode
2. Click on the extension icon and select "Settings" (or right-click the icon and choose "Options")

### Configuration

#### Server Configuration
Navigate to the **Servers** tab in settings to configure your YOURLS instances:

**Primary Server:**
- **YOURLS Server URL**: Enter the base URL of your YOURLS installation
  - Format: `https://your-domain.com/yourls` or `http://your-domain.com/path-to-yourls`
  - Do NOT include `yourls-api.php` at the end - the extension handles this automatically
  - Make sure to include the correct protocol (http:// or https://)

- **Signature Token**: Enter your personal signature token
  - This can be found in your YOURLS admin dashboard under "Tools" → "API"
  - Using a signature token is more secure than using your admin credentials

**Additional Server (Optional):**
- **Enable additional YOURLS server**: Toggle to add a second server
- Configure the URL, signature token, and display name for the additional server
- Use the server selector dropdown in the extension popup to choose which server to use

#### General Settings
Navigate to the **General** tab to configure behavior and interface:

**Behavior Settings:**
- **Always ask for a keyword**: Toggle whether to prompt for custom keywords
  - When enabled: You'll be asked to provide a custom keyword each time you shorten a URL
  - When disabled: URLs will be shortened immediately using YOURLS' automatic keyword generation

- **Auto-copy shortened URL to clipboard**: Toggle automatic clipboard copying
  - When enabled: Short URL will always be saved in clipboard without clicking copy manually
  - When disabled: You'll have to click copy manually

- **Auto-save settings**: Toggle automatic saving of settings as you make changes
  - When enabled: Settings are saved automatically 2 seconds after you stop making changes
  - When disabled: You must manually click "Save Settings" to save changes

**Interface Settings:**
- **Language**: Choose your preferred interface language from 14+ available options

**What's New:**
- **Changelog**: View recent updates and improvements to the extension
- **Version History**: Track feature additions, improvements, and bug fixes

#### Dashboard
The **Dashboard** tab provides real-time insights with enhanced functionality:

- **Server Selection**: Use the dropdown to view statistics from different servers
- **Server Statistics**: View total links, clicks, and averages with modern card layout
- **Server Status**: Monitor if your YOURLS server is online with visual indicators
- **Recent Links**: See your most recently created short links with:
  - Click counts displayed
  - **One-click copy buttons** for each shortened URL
  - Visual feedback when copying
- **Refresh**: Update dashboard data manually with improved loading states

### Saving Your Settings
After configuring all options, click the "Save Settings" button. A confirmation message will appear when your settings are successfully saved.

To verify your configuration, use the "Test Connection" button or try shortening a URL using the extension.

## Usage

### Toolbar Icon
Click on the YOURLS extension icon in your browser toolbar to shorten the URL of the current tab. The popup shows:
- The current page's favicon and URL
- Server selector (if multiple servers are configured)
- Optional keyword input field
- Shorten button and results

### Context Menu Options
Right-click on any link on a webpage to access the context menu, then select "Shorten with YOURLS" to create a shortened version of that specific link without navigating to it first.

### Multi-Server Support
If you have multiple YOURLS servers configured:
1. Use the dropdown in the popup to select which server to use
2. Each server maintains its own statistics in the dashboard
3. The "to YOURLS" link adapts to show the correct admin panel

### Dashboard Features
- **Copy Links**: Click the copy icon next to any shortened URL in the recent links list
- **Server Switching**: Use the server selector to view statistics from different YOURLS instances
- **Real-time Updates**: Click refresh to get the latest statistics and recent links

## Technical Features

- **Manifest V3**: Built with the latest Chrome extension standards
- **Modern CSS Architecture**: Complete rewrite using CSS custom properties, design tokens, and modern layout techniques
- **Accessibility First**: WCAG 2.1 AA compliant with keyboard navigation and screen reader support
- **Performance Optimized**: Efficient CSS with reduced repaints and optimized selectors
- **CORS Handling**: Background script manages API requests to avoid cross-origin issues
- **Responsive Design**: Mobile-first approach with fluid breakpoints
- **RTL Support**: Full support for right-to-left languages
- **Error Handling**: Comprehensive error messages with troubleshooting guidance
- **Reduced Motion**: Respects user's motion preferences for accessibility

## Planned Features
- **QR Code Generation**: Generate QR codes for shortened URLs with SVG download capability
- **Link Analytics**: Enhanced statistics and click tracking
- **Bulk Operations**: Shorten multiple URLs at once
- **Custom Domains**: Support for custom short domains
- **Export/Import**: Backup and restore settings

## Development

This extension is built with:
- Vanilla JavaScript (ES6+)
- Modern CSS with CSS Grid, Flexbox, and Custom Properties
- Chrome Extension Manifest V3
- Internationalization (i18n) support
- Accessibility-first design principles

### Design System
The extension uses a comprehensive design system featuring:
- **Color System**: Semantic color tokens for consistent theming
- **Typography Scale**: Consistent font sizing and spacing
- **Component Library**: Reusable UI components
- **Animation System**: Smooth transitions with reduced motion support

## Acknowledgments

Many thanks to [binfalse](https://github.com/binfalse) for the initial idea and helpful code foundation that inspired this modern implementation.

## License
    Copyright 2025 SimplyTil
    
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
