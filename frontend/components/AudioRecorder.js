// frontend/components/AudioRecorder.js
'use client';
import { useState, useRef } from 'react';

export default function AudioRecorder({ onRecordingComplete }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState('');
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        onRecordingComplete(audioBlob); // Pass the blob to the parent
        audioChunksRef.current = [];
      };
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-4 border rounded-lg">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`px-6 py-3 text-white font-semibold rounded-full ${isRecording ? 'bg-red-500' : 'bg-blue-500'}`}
      >
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      {audioURL && <audio src={audioURL} controls className="mt-4" />}
    </div>
  );
}