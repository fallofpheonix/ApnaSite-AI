"use client";

import { useEffect, useRef, useState } from "react";
import { LANGUAGE_LABELS, type Language } from "@/lib/types";

interface VoiceTextCaptureProps {
  onSubmit: (description: string, language: Language) => void;
  loading: boolean;
}

// Minimal shape of the Web Speech API we rely on — not in standard TS lib.dom yet.
interface SpeechRecognitionResultEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

const MIN_WORD_COUNT = 4;
const LANGUAGES: Language[] = ["hinglish", "hi", "en"];

const LOADING_MESSAGES = [
  "Reading your description...",
  "Designing your layout...",
  "Writing your content...",
  "Almost there...",
];

// Hinglish speech (Hindi/English code-mixed, typed and spoken in Latin
// script) transcribes best against the en-IN locale - hi-IN would push the
// recognizer toward Devanagari output, which isn't what a Hinglish speaker
// wants to see. Only the Hindi selection switches to hi-IN.
function speechLangFor(language: Language): string {
  return language === "hi" ? "hi-IN" : "en-IN";
}

export default function VoiceTextCapture({ onSubmit, loading }: VoiceTextCaptureProps) {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState<Language>("hinglish");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [hasRecordedOnce, setHasRecordedOnce] = useState(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const recognitionRef = useRef<any>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setSpeechSupported(Boolean(SpeechRecognitionCtor));
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    let finalTranscript = "";

    recognition.onresult = (event: SpeechRecognitionResultEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + " ";
        } else {
          interim += result[0].transcript;
        }
      }
      setText((finalTranscript + interim).trim());
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setHasRecordedOnce(true);
      // Voice transcripts are often imperfect — put the user straight into
      // the textarea so reviewing/fixing it before generating is obvious.
      textareaRef.current?.focus();
    };

    return () => {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        // no-op
      }
    };
  }, []);

  useEffect(() => {
    if (!loading) {
      setLoadingMessageIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setLoadingMessageIndex((i) => (i + 1) % LOADING_MESSAGES.length);
    }, 1700);
    return () => clearInterval(interval);
  }, [loading]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.lang = speechLangFor(language);
      setText("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const tooShort = wordCount > 0 && wordCount < MIN_WORD_COUNT;
  const canSubmit = wordCount >= MIN_WORD_COUNT && !loading;

  return (
    <div className="flex w-full max-w-xl flex-col items-center gap-6">
      {/* Language selector */}
      <div className="flex gap-2 rounded-full border border-ink/10 bg-card/70 p-1.5 shadow-sm">
        {LANGUAGES.map((lang) => (
          <button
            key={lang}
            type="button"
            onClick={() => setLanguage(lang)}
            disabled={loading}
            aria-pressed={language === lang}
            className={`min-h-[44px] rounded-full px-5 py-2 text-sm font-medium transition-colors ${
              language === lang
                ? "bg-teal text-paper shadow-sm"
                : "text-ink-soft hover:bg-ink/5"
            }`}
          >
            {LANGUAGE_LABELS[lang]}
          </button>
        ))}
      </div>

      {/* Mic centerpiece */}
      {speechSupported && (
        <div className="relative flex items-center justify-center">
          <span
            aria-hidden
            className={`absolute h-44 w-44 rounded-full bg-marigold/30 blur-2xl transition-opacity ${
              isListening ? "opacity-90" : "opacity-60"
            }`}
          />
          {!isListening && !loading && (
            <span
              aria-hidden
              className="absolute h-32 w-32 animate-ping rounded-full bg-marigold/25"
              style={{ animationDuration: "2.6s" }}
            />
          )}
          <button
            type="button"
            onClick={toggleListening}
            disabled={loading}
            aria-label={isListening ? "Stop recording" : "Start recording"}
            className={`relative flex h-32 w-32 items-center justify-center rounded-full text-paper shadow-lg transition-transform active:scale-95 disabled:opacity-50 ${
              isListening
                ? "bg-brick shadow-brick/30"
                : "bg-marigold shadow-marigold-deep/30 hover:bg-marigold-deep"
            }`}
          >
            <MicIcon />
          </button>
        </div>
      )}

      <p className="text-center text-sm text-ink-soft">
        {speechSupported
          ? isListening
            ? "Listening... tap to stop"
            : hasRecordedOnce
              ? "Review what we heard below, fix anything odd, then generate"
              : "Tap the mic and describe your business"
          : "Voice input isn't supported in this browser — just type below"}
      </p>

      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={`e.g. "I own a bakery called Sweet Crumbs, open 8am-6pm Tue-Sun, we sell sourdough, croissants, custom cakes, located in downtown Lucknow, phone 98765-43210"`}
        rows={5}
        className="w-full rounded-2xl border border-ink/10 bg-card p-5 text-lg text-ink shadow-sm placeholder:text-ink-soft/60 focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/25"
      />

      {tooShort && (
        <p className="-mt-3 w-full text-sm text-brick">
          Add a bit more detail — your shop name, what you sell, and your hours — for a better
          result.
        </p>
      )}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={() => onSubmit(text.trim(), language)}
        className="w-full rounded-2xl bg-teal py-5 text-xl font-semibold text-paper shadow-md transition-colors hover:bg-teal-deep disabled:cursor-not-allowed disabled:bg-ink/15 disabled:text-ink-soft"
      >
        {loading ? LOADING_MESSAGES[loadingMessageIndex] : "Generate My Website"}
      </button>
    </div>
  );
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-14 w-14">
      <path d="M12 14a3 3 0 003-3V5a3 3 0 10-6 0v6a3 3 0 003 3z" />
      <path d="M19 11a1 1 0 10-2 0 5 5 0 01-10 0 1 1 0 10-2 0 7 7 0 006 6.93V20H9a1 1 0 100 2h6a1 1 0 100-2h-2v-2.07A7 7 0 0019 11z" />
    </svg>
  );
}
