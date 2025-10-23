import { useState, useCallback, useRef, useEffect } from 'react';

export interface VoiceInputOptions {
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  language?: string;
  confidenceThreshold?: number;
}

export interface VoiceInputState {
  isListening: boolean;
  isSupported: boolean;
  transcript: string;
  confidence: number;
  error: string | null;
}

export interface VoiceInputReturn extends VoiceInputState {
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  setLanguage: (language: string) => void;
}

export function useVoiceInput(options: VoiceInputOptions = {}): VoiceInputReturn {
  const {
    continuous = false,
    interimResults = true,
    maxAlternatives = 1,
    language = 'en-US',
    confidenceThreshold = 0.7
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');

  // Check for browser support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);
    
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
    }
  }, []);

  // Configure recognition
  useEffect(() => {
    if (!recognitionRef.current) return;

    const recognition = recognitionRef.current;
    
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = maxAlternatives;
    recognition.lang = language;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = finalTranscriptRef.current;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        const confidence = result[0].confidence || 0;

        if (result.isFinal) {
          finalTranscript += transcript;
          setConfidence(confidence);
        } else {
          interimTranscript += transcript;
        }
      }

      finalTranscriptRef.current = finalTranscript;
      setTranscript(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setError(`Speech recognition error: ${event.error}`);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onnomatch = () => {
      setError('No speech was recognized. Please try again.');
    };

    recognition.onspeechstart = () => {
      setError(null);
    };

    recognition.onspeechend = () => {
      if (!continuous) {
        setIsListening(false);
      }
    };

  }, [continuous, interimResults, maxAlternatives, language]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      setError('Speech recognition is not supported in this browser');
      return;
    }

    if (isListening) {
      return;
    }

    try {
      setError(null);
      finalTranscriptRef.current = '';
      recognitionRef.current.start();
    } catch (err) {
      setError(`Failed to start speech recognition: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) {
      return;
    }

    try {
      recognitionRef.current.stop();
    } catch (err) {
      setError(`Failed to stop speech recognition: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    finalTranscriptRef.current = '';
    setConfidence(0);
    setError(null);
  }, []);

  const setLanguage = useCallback((newLanguage: string) => {
    if (recognitionRef.current) {
      recognitionRef.current.lang = newLanguage;
    }
  }, []);

  // Auto-stop if confidence threshold is met and not continuous
  useEffect(() => {
    if (!continuous && confidence >= confidenceThreshold && transcript.trim()) {
      const timer = setTimeout(() => {
        stopListening();
      }, 1000); // Wait 1 second after high confidence result

      return () => clearTimeout(timer);
    }
  }, [confidence, confidenceThreshold, continuous, transcript, stopListening]);

  return {
    isListening,
    isSupported,
    transcript,
    confidence,
    error,
    startListening,
    stopListening,
    resetTranscript,
    setLanguage
  };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}
