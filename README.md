# Chrome Extension for YOURLS

A Manifest V3 compatible Chrome extension for interacting with your [YOURLS](http://yourls.org/) (Your Own URL Shortener) instance.

## Setup Instructions

### Installation
1. Download the extension from the [Chrome Web Store](https://lyxo.link/l4kzv) or install it manually by loading the unpacked extension in developer mode
2. Click on the extension icon and select "Options" (or right-click the icon and choose "Options")

### Configuration
In the options page, you'll need to configure the following settings:

- **API URL**: Enter the base URL of your YOURLS installation
  - Format: `https://your-domain.com/yourls` or `http://your-domain.com/path-to-yourls`
  - Do NOT include `yourls-api.php` at the end - the extension handles this automatically
  - Make sure to include the correct protocol (http:// or https://)

- **Signature Token**: Enter your personal signature token
  - This can be found in your YOURLS admin dashboard under "Tools" → "API"
  - Using a signature token is more secure than using your admin credentials

- **Keyword Prompt**: Toggle whether to prompt for custom keywords
  - When enabled: You'll be asked to provide a custom keyword each time you shorten a URL
  - When disabled: URLs will be shortened immediately using YOURLS' automatic keyword generation

- **Auto-Copy**: Toggle whether to copy the short link automatically into clipboard
  - When enabled: Short URL will always be saved in clipboard without clicking on copy manually
  - When disabled: You'll have to click on copy manually

### Additional Server Configuration

You can optionally configure a second YOURLS server:

- Enable the "Enable additional YOURLS server" toggle
- Configure the URL, signature token, and a display name for the second server
- Use the server selector dropdown in the extension popup to choose which server to use when shortening URLs

### Saving Your Settings
After configuring all options, click the "Save" button. A confirmation message will appear when your settings are successfully saved.

To verify your configuration, click on "Test Connection" or try shortening a URL using the extension - if successful, you'll receive a shortened URL in response.

## Usage

The extension provides two different ways for interaction:

### Toolbar Icon

Click on the YOURLS extension icon in your browser toolbar to shorten the URL of the current tab. If you have enabled the "Ask for a keyword" option, you'll see a popup allowing you to enter a custom keyword for your shortened URL.

After processing, the extension will display the shortened URL which you can copy to your clipboard.

### Context Menu Option

Right-click on any link on a webpage to access the context menu, then select "Shorten with YOURLS" to create a shortened version of that specific link without navigating to it first.

If the "Ask for a keyword" option is enabled, you'll be prompted to enter a custom keyword before shortening.

## Features

- Quickly shorten the current page URL
- Shorten specific links via context menu
- Optional custom keywords for your shortened URLs
- Copy shortened URLs to clipboard with a single click
- Support for multiple YOURLS servers

## Planned Features:
- QR-Code automation to generate a QR-Code in extension popup that contains the shortened URL with ability to download SVG QR Code     

## Lastly

Many, many thanks to [binfalse](https://github.com/binfalse) for the initial idea and the helpful code, which I've looked at and am trying to make something of my own!

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
