# Delivery Prediction System - React Frontend

This is the React frontend for the Delivery Prediction System. It provides a modern, responsive UI for interacting with the Flask backend API.

## Features

- Real-time dashboard for weather, traffic, and festival conditions
- Delivery prediction interface
- Route optimization with interactive maps
- AI assistant for delivery-related queries
- Responsive design for all devices

## Getting Started

### Prerequisites

- Node.js (v14.0.0 or higher)
- npm (v6.0.0 or higher)

### Installation

1. Install dependencies:

   ```
   npm install
   ```

2. Start the development server:

   ```
   npm start
   ```

3. Build for production:
   ```
   npm run build
   ```

## Project Structure

- `/src/components` - Reusable UI components
- `/src/pages` - Page components
- `/src/services` - API service functions
- `/src/context` - React context providers
- `/src/assets` - Static assets like images

## Backend Integration

The frontend communicates with the Flask backend API running on port 5002. The proxy is configured in package.json for local development.

## Available Scripts

- `npm start` - Runs the app in development mode
- `npm test` - Launches the test runner
- `npm run build` - Builds the app for production
- `npm run eject` - Ejects from Create React App (one-way operation)

## Learn More

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).
