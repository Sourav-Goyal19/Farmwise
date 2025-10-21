import { Mic } from "lucide-react";
import { Track } from "livekit-client";
import { useEffect, useRef, useState } from "react";
import { useLocalParticipant } from "@livekit/components-react";

export const VoiceVisualizer: React.FC = () => {
  const { localParticipant } = useLocalParticipant();
  const [audioLevel, setAudioLevel] = useState(0);
  const animationFrameRef = useRef<number>(null);

  useEffect(() => {
    if (!localParticipant) return;

    const audioTrack = localParticipant.getTrackPublication(
      Track.Source.Microphone
    )?.track;
    if (!audioTrack) return;

    const mediaStreamTrack = audioTrack.mediaStreamTrack;
    if (!mediaStreamTrack) return;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.85;

    const source = audioContext.createMediaStreamSource(
      new MediaStream([mediaStreamTrack])
    );
    source.connect(analyser);

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const updateLevels = () => {
      analyser.getByteFrequencyData(dataArray);

      const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const normalized = Math.min(average / 128, 1);

      setAudioLevel(normalized);
      animationFrameRef.current = requestAnimationFrame(updateLevels);
    };

    updateLevels();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      audioContext.close();
    };
  }, [localParticipant]);

  return (
    <div className="flex items-center justify-center h-48 w-full">
      <div className="relative w-48 h-48">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute inset-0 rounded-full border-2 border-primary"
            style={{
              transform: `scale(${0.6 + audioLevel * 0.4 + i * 0.15})`,
              opacity: Math.max(0.1, audioLevel - i * 0.25),
              transition: "all 0.1s ease-out",
            }}
          />
        ))}

        <div
          className="absolute inset-0 rounded-full bg-primary flex items-center justify-center"
          style={{
            transform: `scale(${0.3 + audioLevel * 0.3})`,
            opacity: 0.4 + audioLevel * 0.6,
            transition: "all 0.1s ease-out",
          }}
        >
          <Mic className="w-12 h-12 text-primary-foreground" />
        </div>
      </div>
    </div>
  );
};
