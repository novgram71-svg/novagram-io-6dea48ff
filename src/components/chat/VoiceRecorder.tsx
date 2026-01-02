import { useState, useRef } from 'react';
import { Mic, Square, Play, Pause, Trash2, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useStorage } from '@/hooks/useStorage';

interface VoiceRecorderProps {
  onSend: (voiceUrl: string) => void;
  disabled?: boolean;
}

const VoiceRecorder = ({ onSend, disabled }: VoiceRecorderProps) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { uploadVoiceMessage } = useStorage();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);
      
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const playPause = () => {
    if (!audioRef.current && audioUrl) {
      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const cancelRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsPlaying(false);
  };

  const handleSend = async () => {
    if (!audioBlob) return;

    setIsUploading(true);
    try {
      const publicUrl = await uploadVoiceMessage(audioBlob);
      onSend(publicUrl);
      cancelRecording();
    } catch (error) {
      console.error('Error uploading voice message:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (audioUrl) {
    return (
      <div className="flex items-center gap-2 bg-secondary/50 rounded-full px-3 py-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full"
          onClick={playPause}
          disabled={isUploading}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>
        
        <div className="flex-1 flex items-center gap-2">
          <div className="h-1 flex-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary w-full" />
          </div>
          <span className="text-xs text-muted-foreground">{formatTime(duration)}</span>
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 rounded-full text-destructive hover:text-destructive"
          onClick={cancelRecording}
          disabled={isUploading}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
        
        <Button
          size="icon"
          className="h-8 w-8 rounded-full bg-primary hover:bg-primary/90"
          onClick={handleSend}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    );
  }

  if (isRecording) {
    return (
      <div className="flex items-center gap-3 bg-destructive/10 rounded-full px-4 py-2">
        <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
        <span className="text-sm font-medium text-destructive">{formatTime(duration)}</span>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex gap-0.5">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="w-0.5 bg-destructive rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 16 + 8}px`,
                  animationDelay: `${i * 50}ms`
                }}
              />
            ))}
          </div>
        </div>
        <Button
          size="icon"
          variant="destructive"
          className="h-10 w-10 rounded-full"
          onClick={stopRecording}
        >
          <Square className="w-4 h-4 fill-current" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-10 w-10 rounded-full hover:bg-primary/10"
      onClick={startRecording}
      disabled={disabled}
    >
      <Mic className="w-5 h-5" />
    </Button>
  );
};

export default VoiceRecorder;