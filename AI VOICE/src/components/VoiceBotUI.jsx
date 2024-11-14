import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Groq from 'groq-sdk';

// Initialize Groq client with browser support
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true  // Enable browser usage
});

const VoiceBotUI = () => {
  const [isListening, setIsListening] = useState(false);
  const [inputText, setInputText] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const [voicesLoaded, setVoicesLoaded] = useState(false);

  // Assistant's structured prompt configuration
  const assistantConfig = {
    "system_prompt": `*Identity*
    - **Name**: Vikas Sales Agent
    - **Role**: Sales Agent for VoVikas.com, specializing in Voice AI solutions.
    
    *Persona*
    - **Personality**: Professional, empathetic, and knowledgeable.
    
    *Behavior*
    - **Interaction Style**: Structured response style with empathy, tailoring interactions based on user’s needs, emotional cues, and business requirements.

    *Response Format*
    - **Structure**: Address the user by their first name if available. Start with a warm greeting, ask clarifying questions, and offer relevant solutions based on user’s business context.
    - **Tone**: Warm and approachable yet professional.

    *Purpose*
    - To effectively guide users toward adopting Voice AI for their business needs, ensuring they understand the benefits and applicability of Voice AI solutions.`,
    "groq_token": 250,
    "groq_temperature": 0.3,
    "groq_model": "llama3-70b-8192",
    "welcome_message": "Hi, this is Vikas from VoVikas.com. I can help you integrate Voice AI into your business. Can you please tell me what kind of business you have?"
  };

  // Load voices only once to avoid browser issues
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) setVoicesLoaded(true);
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Function to handle text-to-speech with queue clearing
  const speakResponse = (text) => {
    if ('speechSynthesis' in window && voicesLoaded) {
      window.speechSynthesis.cancel(); // Clear any ongoing speech

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      speechSynthesis.speak(utterance);
    } else {
      console.warn('Text-to-speech is not supported in this browser or voices are not loaded.');
    }
  };

  // Trigger text-to-speech whenever response is updated
  useEffect(() => {
    if (response) {
      speakResponse(response);
    }
  }, [response]);

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
      mediaRecorder.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const processAudio = async (audioBlob) => {
    setIsLoading(true);
    try {
      // Create FormData for the audio file
      const formData = new FormData();
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('model', 'whisper-large-v3-turbo');

      // Transcribe audio using Groq API
      const transcriptionResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: formData
      });

      if (!transcriptionResponse.ok) {
        throw new Error(`Transcription failed: ${transcriptionResponse.statusText}`);
      }

      const transcription = await transcriptionResponse.json();
      setInputText(transcription.text);

      // Get AI response using Groq SDK with structured prompt
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: assistantConfig.system_prompt
          },
          {
            role: "user",
            content: transcription.text
          }
        ],
        model: assistantConfig.groq_model,
        temperature: assistantConfig.groq_temperature,
        max_tokens: assistantConfig.groq_token
      });

      const aiResponse = completion.choices[0]?.message?.content || 'No response generated';
      setResponse(aiResponse);
    } catch (error) {
      console.error('Error processing audio:', error);
      setResponse(`Error processing your request: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="voice-bot-container">
      <h1 className="heading">AI Voice Bot</h1>

      <div className="controls">
        <Button 
          onClick={startListening} 
          disabled={isListening || isLoading}
          className="flex items-center space-x-2 speak-button"
        >
          <Mic className="w-5 h-5" />
          <span>Speak</span>
        </Button>
        
        <Button 
          onClick={stopListening} 
          disabled={!isListening || isLoading}
          variant="destructive"
          className="flex items-center space-x-2 stop-button"
        >
          <MicOff className="w-5 h-5" />
          <span>Stop</span>
        </Button>
      </div>

      <div className="content">
        <div className="input-section">
          <h2 className="input-title">Your Input:</h2>
          <p className="input-text">{inputText || 'Speak something...'}</p>
        </div>

        <div className="response-section">
          <h2 className="response-title">AI Response:</h2>
          <p className={`response-text ${isLoading ? 'loading' : ''}`}>
            {response || 'AI response will appear here...'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceBotUI;
