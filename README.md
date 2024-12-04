# AI Voice & OCR Assistant

## Overview
This project is an advanced web application built using **React**, **Vite**, and **Tailwind CSS**. It integrates voice interaction and Optical Character Recognition (OCR) to create an intelligent assistant capable of processing voice commands and extracting text from images. The assistant supports real-time transcription, AI-powered responses, and can convert images into Markdown-formatted text.

## Project Features
- **Voice Interaction**: Records user audio and provides voice responses using browser APIs and Deepgram.
- **AI-Powered Responses**: Integrates with **Groq** for natural language processing and generating intelligent responses.
- **OCR Integration**: Uses **Together.ai's Llama-3 model** for text extraction from uploaded images.
- **Real-Time Transcription**: Supports speech-to-text functionality for live transcription.
- **Responsive Design**: Works seamlessly across desktop and mobile devices.

## Tech Stack
- **React**: JavaScript library for building user interfaces.
- **Vite**: Development tool for fast build and optimized production.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Deepgram**: Voice SDK for speech recognition.
- **Groq**: AI service for generating text responses.
- **Together.ai**: API for OCR and image-to-text conversion.
- **Axios**: Promise-based HTTP client for requests.

## Installation and Setup

### Prerequisites
Ensure that **Node.js** and **npm** are installed on your machine.

### Step-by-step Guide
1. **Clone the repository**:
    ```bash
    git clone https://github.com/vikas-kashyap97/Voice_chat_Bot_with_AI.git
    ```

2. **Navigate to the project directory**:
    ```bash
    cd Voice_chat_Bot_with_AI
    ```

3. **Install dependencies**:
    ```bash
    npm install
    ```

4. **Set up environment variables**:
   Create a `.env` file in the root directory and add the following:
    ```plaintext
    VITE_GROQ_API_KEY=your_groq_api_key
    VITE_TOGETHER_API_KEY=your_together_api_key
    ```

5. **Run the development server**:
    ```bash
    npm run dev
    ```
   Visit `http://localhost:3000` in your browser to view the app.

6. **Build the project for production**:
    ```bash
    npm run build
    ```

7. **Preview the production build**:
    ```bash
    npm run preview
    ```

## Project Structure
- **`/src`**: Contains the main React components and logic.
- **`/public`**: Static assets and public-facing files.
- **`/node_modules`**: Project dependencies.
- **`package.json`**: Project configuration, scripts, and dependencies.
- **`vite.config.js`**: Vite configuration for development and build.

## Code Overview
### Key Components:
- **VoiceBotUI Component**: Main component that handles voice recording, AI response, and speech synthesis.
- **OCRComponent**: Handles image uploads and processes OCR to extract text.

### Code Highlights:
- **Voice Recording**: Captures audio input using `navigator.mediaDevices.getUserMedia()` and sends it to Deepgram for transcription.
- **AI Response Handling**: Communicates with Groq API for generating context-aware responses.
- **OCR Processing**: Sends image data to Together.ai's API and formats the text into Markdown.

### Sample Code:
```jsx
useEffect(() => {
  const myChart = echarts.init(document.getElementById('mainChart'));
  // ECharts series setup and option configuration
  myChart.setOption(option);
  // Event listeners and cleanup
  window.addEventListener('resize', resizeChart);
  return () => {
    window.removeEventListener('resize', resizeChart);
    myChart.dispose();
  };
}, [isSmallScreen]);
