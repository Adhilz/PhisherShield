# Phishing Detector Extension

This project is a browser extension designed to scan URLs for phishing attempts using a 10-layer security engine. It integrates with WHOIS, Google Safe Browsing, and PhishTank to calculate a Trust Score for each URL and provides users with the ability to report phishing links.

## Features

- **10-Layer Security Engine**: Utilizes multiple security checks to assess the safety of URLs.
- **Trust Score Calculation**: Computes a Trust Score based on various security integrations.
- **Integration with WHOIS**: Gathers domain registration information to help identify potential phishing sites.
- **Google Safe Browsing Integration**: Checks URLs against known phishing sites.
- **PhishTank Integration**: Verifies reported phishing URLs to enhance security.
- **User Reporting**: Allows users to report phishing links directly through the extension.
- **User Alerts**: Displays alerts to users about unsafe sites based on the Trust Score.

## Project Structure

```
phishing-detector-extension
├── extension
│   ├── public
│   │   └── manifest.json
│   ├── src
│   │   ├── components
│   │   │   ├── TrustScoreDisplay.tsx
│   │   │   ├── AlertBanner.tsx
│   │   │   └── ReportPhishingForm.tsx
│   │   ├── pages
│   │   │   └── Popup.tsx
│   │   ├── utils
│   │   │   └── trustScore.ts
│   │   ├── index.tsx
│   │   └── types
│   │       └── index.ts
│   └── package.json
├── backend
│   ├── src
│   │   ├── engine
│   │   │   └── securityEngine.ts
│   │   ├── integrations
│   │   │   ├── whois.ts
│   │   │   ├── googleSafeBrowsing.ts
│   │   │   └── phishTank.ts
│   │   ├── routes
│   │   │   ├── trustScore.ts
│   │   │   └── report.ts
│   │   ├── controllers
│   │   │   ├── trustScoreController.ts
│   │   │   └── reportController.ts
│   │   └── types
│   │       └── index.ts
│   ├── package.json
│   └── tsconfig.json
├── README.md
```

## Setup Instructions

1. **Clone the Repository**: 
   ```
   git clone <repository-url>
   cd phishing-detector-extension
   ```

2. **Install Dependencies**:
   - For the frontend:
     ```
     cd extension
     npm install
     ```
   - For the backend:
     ```
     cd backend
     npm install
     ```

3. **Run the Backend Server**:
   ```
   cd backend
   npm start
   ```

4. **Load the Extension**:
   - Open your browser and navigate to the extensions page.
   - Enable "Developer mode".
   - Click "Load unpacked" and select the `extension` directory.

## Usage

- Once the extension is loaded, navigate to any URL you wish to check.
- The extension will automatically calculate the Trust Score and display alerts if the site is deemed unsafe.
- Users can report phishing links through the provided form in the extension.

## Contributing

Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.