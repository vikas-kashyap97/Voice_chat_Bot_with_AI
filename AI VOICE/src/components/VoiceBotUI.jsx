import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

const VoiceBotUI = () => {
  const initialMessage = {
    id: Date.now(),
    role: 'assistant',
    content: 'Hi, how can I help you today?',
    displayText: 'Hi, how can I help you today?',
  };

  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([initialMessage]);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const [voicesLoaded, setVoicesLoaded] = useState(false);
  const typingSpeed = 0.0002;

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
  
    groq_token: 70,  // Set to 100 for short but complete responses
    groq_temperature: 0.7,  // Ensures the response is straightforward and concise
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

    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const typeMessage = async (message) => {
    let displayText = '';
    const messageId = message.id;
  
    // Calculate typing speed to complete typing in 1 second
    const totalDuration = 500; // 1 second in milliseconds
    const typingSpeed = totalDuration / message.content.length;
  
    for (let i = 0; i < message.content.length; i++) {
      displayText += message.content[i];
  
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId
            ? { ...msg, displayText }
            : msg
        )
      );
  
      // Wait for the dynamically calculated typing speed
      await new Promise(resolve => setTimeout(resolve, typingSpeed));
    }
  
    // Speak the complete response after typing is finished
    if (message.role === 'assistant') {
      speakResponse(message.content);
    }
  };
  

  const speakResponse = (text) => {
    if ('speechSynthesis' in window && voicesLoaded && text) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const selectedVoice = voices.find(voice => voice.name === 'Google UK English Male') || voices[0];
      utterance.voice = selectedVoice;
      utterance.rate = 1.3;
      speechSynthesis.speak(utterance);
    }
  };

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
      const userMessage = {
        id: Date.now(),
        role: 'user',
        content: transcription.text,
        displayText: transcription.text,
      };
      
      setMessages(prev => [...prev, userMessage]);

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
      const botMessage = {
        id: Date.now(),
        role: 'assistant',
        content: aiResponse,
        displayText: '',
      };
      
      setMessages(prev => [...prev, botMessage]);
      await typeMessage(botMessage);

    } catch (error) {
      console.error('Error processing audio:', error);
      const errorMessage = {
        id: Date.now(),
        role: 'assistant',
        content: 'Sorry, I encountered an error.',
        displayText: '',
      };
      setMessages(prev => [...prev, errorMessage]);
      await typeMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="voice-bot-container p-4">
      <div className="header mb-4">
        <h1 className="text-2xl font-bold text-center">Voice AI Assistant</h1>
      </div>

      <div className="chat-messages space-y-4 mb-4 h-[400px] overflow-y-auto">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message p-3 rounded-lg ${
              message.role === 'assistant'
                ? 'bg-blue-100 ml-auto max-w-[80%]'
                : 'bg-gray-100 mr-auto max-w-[80%]'
            }`}
          >
            <p>{message.displayText}</p>
          </div>
        ))}
      </div>

      <div className="input-area">
        <div className="input-wrapper relative">
          <input
            type="text"
            placeholder="Click the mic to speak"
            value={isListening ? 'Listening...' : ''}
            readOnly
            className="w-full p-3 pr-12 rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <Button
            onClick={isListening ? stopListening : startListening}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full ${
              isListening ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
            }`}
            disabled={isLoading}
          >
            {isListening ? (
              <MicOff className="w-5 h-5 text-white" />
            ) : (
              <Mic className="w-5 h-5 text-white" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VoiceBotUI;












