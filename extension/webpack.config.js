const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  // Set mode to 'development' or 'production'
  // 'development' provides more detailed error messages and faster builds.
  // 'production' minifies code for deployment.
  mode: 'development', // Change to 'production' for final build

  // Define entry points for different parts of your extension
  entry: {
    background: './src/background.ts', // Your background service worker
    popup: './src/pages/Popup.tsx',    // The script for your popup HTML
    alertPage: './src/pages/AlertPage.tsx', // The script for your alert HTML
    // You can add 'content: './src/content-script.ts',' here if you later decide to use a content script
  },

  // Define output settings
  output: {
    filename: 'dist/[name]Bundle.js', // Output files like dist/backgroundBundle.js, dist/popupBundle.js
    path: path.resolve(__dirname, 'build'), // All compiled files go into the 'build' folder
    clean: true, // Clean the 'build' folder before each build (useful to avoid old files)
  },

  // Enable sourcemaps for debugging in development mode
  devtool: 'cheap-module-source-map', // Provides good debugging experience in browser dev tools

  // Resolve extensions for easier imports (e.g., import 'App' instead of 'App.tsx')
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },

  module: {
    rules: [
      // Rule for TypeScript/TSX files
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: 'ts-loader', // Use ts-loader for compiling TypeScript and TSX files
      },
      // Rule for JavaScript/JSX files (if you have any pure JS React files)
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript'],
          },
        },
      },
      // Rule for CSS files
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'], // style-loader injects CSS into the DOM, css-loader interprets @import, url()
      },
    ],
  },

  plugins: [
    // Generates popup.html in the 'build' folder and injects the popupBundle.js script
    new HtmlWebpackPlugin({
      template: './public/popup.html', // Path to your source popup.html template
      filename: 'popup.html',          // Output filename in the 'build' folder
      chunks: ['popup'],               // Only include the 'popup' entry bundle for this HTML file
    }),
    // Generates alert.html in the 'build' folder and injects the alertPageBundle.js script
    new HtmlWebpackPlugin({
      template: './public/alert.html', // Path to your source alert.html template
      filename: 'alert.html',          // Output filename in the 'build' folder
      chunks: ['alertPage'],           // Only include the 'alertPage' entry bundle for this HTML file
    }),
    // Copies static assets to the 'build' folder
    new CopyWebpackPlugin({
      patterns: [
        { from: 'public/manifest.json', to: 'manifest.json' }, // Copy manifest.json
        { from: 'public/icons', to: 'icons' }, // Copy the entire icons folder
        // Copy a placeholder alert.css. If you start writing actual CSS for alert.html
        // in a separate file (e.g., public/alert.css), this will copy it.
        // If your alert.css is primarily handled via style-loader (React components),
        // this specific copy might not be strictly necessary, but it's safe to include.
        { from: 'public/alert.css', to: 'dist/alert.css', noErrorOnMissing: true },
      ],
    }),
  ],
};