import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Groq from 'groq-sdk';

// Initialize Groq client with browser support
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true, // Enable browser usage
});

const VoiceBotUI = () => {
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: 'Hi, I can help you integrate Voice AI into your business. Can you please tell me what kind of business you have?',
    },
  ]);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  const assistantConfig = {
    system_prompt: `*Identity*
    - **Name**: Vikas
    - **Role**: Personal Assistant specializing in Artificial Intelligence solutions.
    
    *Persona*
    - **Personality**: Professional, empathetic, approachable, and highly knowledgeable in Artificial Intelligence.
    
    *Behavior*
    - **Interaction Style**: 
      - Tailors responses based on the user's specific needs and emotional cues.
      - Offers clear and concise guidance with an empathetic and solutions-oriented approach.
      - Balances warmth with professionalism to ensure an engaging and helpful user experience.
    - **Communication Focus**: 
      - Explains complex concepts in simple, understandable terms.
      - Anticipates user needs and provides proactive suggestions.
  
    *Response Format*
    - **Greeting**: Always begins with a warm and welcoming tone.
    - **Structure**:
      1. Acknowledge the user's query or need.
      2. Ask relevant clarifying questions to gather details.
      3. Provide a solution tailored to the user's context.
      4. Offer additional resources or next steps if applicable.
    - **Tone**: Friendly, professional, and approachable.
    
    *Purpose*
    - To guide users in adopting and leveraging solutions effectively for their unique requirements.
    - To ensure users understand the tangible benefits and practical applications of Artificial Intelligence in their personal or professional scenarios.
    - To build trust and establish Vikas as a reliable, knowledgeable, and friendly personal assistant.`,
  
    groq_token: 100,  // Set to 100 for short but complete responses
    groq_temperature: 0.3,  // Ensures the response is straightforward and concise
    groq_model: 'llama3-70b-8192',
    welcome_message: `Hello! I’m Vikas, your personal assistant specializing in Artificial Intelligence. How can I assist you today? Whether you need guidance, insights, or solutions, I'm here to help.`,
  };
  

  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) setVoicesLoaded(true);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // Cleanup to stop speech synthesis on component unmount
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Stops any ongoing speech
      }
    };
  }, []);

  const speakResponse = (text) => {
    if ('speechSynthesis' in window && voicesLoaded) {
      window.speechSynthesis.cancel(); // Clear any ongoing speech
  
      const voices = window.speechSynthesis.getVoices();
      console.log('Available voices:', voices.map((voice) => `${voice.name} (${voice.lang})`));
  
      // Example of a sweet and light female voice, adjust the name as per your system/browser
      const preferredVoiceName = 'Google UK English Male'; // Update this to test other voices
      const selectedVoice = voices.find((voice) => voice.name === preferredVoiceName) || voices[0]; // Fallback to the first available voice
  
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 1.0; // Adjust speed for natural sound
      utterance.voice = selectedVoice;
      speechSynthesis.speak(utterance);
    } else {
      console.warn('Text-to-speech is not supported in this browser or voices are not loaded.');
    }
  };
  

  useEffect(() => {
    if (response && voicesLoaded) {
      speakResponse(response);
    }
  }, [response, voicesLoaded]);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: 'audio/wav' });
        await processAudio(audioBlob);
        audioChunks.current = [];
      };

      mediaRecorder.current.start();
      setIsListening(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopListening = () => {
    if (mediaRecorder.current && isListening) {
      mediaRecorder.current.stop();
      setIsListening(false);
      mediaRecorder.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const processAudio = async (audioBlob) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('model', 'whisper-large-v3-turbo');

      const transcriptionResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: formData,
      });

      if (!transcriptionResponse.ok) {
        throw new Error(`Transcription failed: ${transcriptionResponse.statusText}`);
      }

      const transcription = await transcriptionResponse.json();
      setInputText(transcription.text);

      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: assistantConfig.system_prompt },
          { role: 'user', content: transcription.text },
        ],
        model: assistantConfig.groq_model,
        temperature: assistantConfig.groq_temperature,
        max_tokens: assistantConfig.groq_token,
      });

      const aiResponse = completion.choices[0]?.message?.content || 'No response generated';
      setResponse(aiResponse);

      setMessages((prevMessages) => [
        ...prevMessages,
        { type: 'user', text: transcription.text },
        { type: 'bot', text: aiResponse },
      ]);
    } catch (error) {
      console.error('Error processing audio:', error);
      setResponse(`Apologies, I encountered an error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="voice-bot-container">
      <div className="header">
        <h1>Voice AI Agent</h1>
      </div>
  
      <div className="microphone-circle">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`microphone-button ${isListening ? 'listening' : ''}`}
          disabled={isLoading}
        >
          {isListening ? <MicOff className="icon" /> : <Quote className="icon" />}
        </button>
      </div>
  
      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.type === 'bot' ? 'bot' : 'user'}`}>
            <p>{message.text}</p>
          </div>
        ))}
      </div>
  
      <div className="input-area">
        <div className="input-wrapper">
          <input
            type="text"
            placeholder="Click the icon to speak"
            value={isListening ? 'Listening...' : ''}
            readOnly
            className={`text-input ${isListening ? 'listening' : ''}`}
            disabled={isLoading}
          />
        </div>
      </div>
    </div>
  );
};

export default VoiceBotUI;
