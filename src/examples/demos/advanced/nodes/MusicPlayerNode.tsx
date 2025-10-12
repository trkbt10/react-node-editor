/**
 * @file Music Player Node - Interactive music player with visualizer
 */
import * as React from "react";
import type {
  NodeDefinition,
  NodeRenderProps,
  InspectorRenderProps,
  ExternalDataReference,
} from "../../../../types/NodeDefinition";
import { getTextColor } from "./colorUtils";
import classes from "./MusicPlayerNode.module.css";

export type MusicData = {
  id: string;
  title: string;
  artist: string;
  duration: number; // in seconds
  currentTime: number;
  isPlaying: boolean;
  volume: number; // 0-100
  visualizerData: number[]; // amplitude data for visualizer
};

export const MusicPlayerRenderer = ({ node, isSelected, isDragging, externalData }: NodeRenderProps) => {
  const musicData = externalData as MusicData | undefined;
  const [localTime, setLocalTime] = React.useState(musicData?.currentTime || 0);

  React.useEffect(() => {
    setLocalTime(musicData?.currentTime || 0);
  }, [musicData?.currentTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = musicData ? (localTime / musicData.duration) * 100 : 0;
  const playerColor = "#ec4899";

  return (
    <div
      className={`${classes.container} ${isSelected ? classes.selected : ""} ${isDragging ? classes.dragging : ""}`}
      style={{
        width: node.size?.width,
        height: node.size?.height,
        border: `2px solid ${playerColor}`,
      }}
    >
      <div className={classes.header}>
        <div className={classes.titleInfo}>
          <div className={classes.title}>🎵 {musicData?.title || "No Track"}</div>
          <div className={classes.artist}>{musicData?.artist || "Unknown Artist"}</div>
        </div>
        <div className={classes.statusBadge} style={{ backgroundColor: playerColor, color: getTextColor(playerColor) }}>
          {musicData?.isPlaying ? "▶ PLAYING" : "⏸ PAUSED"}
        </div>
      </div>

      <div className={classes.visualizer}>
        {musicData?.visualizerData?.map((amplitude, index) => (
          <div
            key={index}
            className={classes.visualizerBar}
            style={{
              height: `${amplitude}%`,
              backgroundColor: playerColor,
              opacity: musicData.isPlaying ? 1 : 0.3,
            }}
          />
        ))}
      </div>

      <div className={classes.controls}>
        <div className={classes.progressBar}>
          <div className={classes.progressFill} style={{ width: `${progress}%`, backgroundColor: playerColor }} />
        </div>
        <div className={classes.timeDisplay}>
          <span>{formatTime(localTime)}</span>
          <span>{formatTime(musicData?.duration || 0)}</span>
        </div>
      </div>

      <div className={classes.volumeControl}>
        <span className={classes.volumeIcon}>🔊</span>
        <div className={classes.volumeBar}>
          <div
            className={classes.volumeFill}
            style={{ width: `${musicData?.volume || 0}%`, backgroundColor: playerColor }}
          />
        </div>
      </div>
    </div>
  );
};

export const MusicPlayerInspectorRenderer = ({ externalData, onUpdateExternalData }: InspectorRenderProps) => {
  const musicData = externalData as MusicData | undefined;
  const [editedData, setEditedData] = React.useState<MusicData>({
    id: musicData?.id || "",
    title: musicData?.title || "New Track",
    artist: musicData?.artist || "Unknown Artist",
    duration: musicData?.duration || 180,
    currentTime: musicData?.currentTime || 0,
    isPlaying: musicData?.isPlaying || false,
    volume: musicData?.volume || 75,
    visualizerData: musicData?.visualizerData || Array.from({ length: 20 }, () => Math.random() * 100),
  });

  const handleSave = async () => {
    if (onUpdateExternalData) {
      await onUpdateExternalData(editedData);
    }
  };

  const togglePlayback = () => {
    setEditedData((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
  };

  const randomizeVisualizer = () => {
    setEditedData((prev) => ({
      ...prev,
      visualizerData: Array.from({ length: 20 }, () => Math.random() * 100),
    }));
  };

  return (
    <div className={classes.inspector}>
      <h3>Music Player</h3>

      <div className={classes.formGroup}>
        <label htmlFor="music-title" className={classes.label}>
          Track Title:
        </label>
        <input
          id="music-title"
          name="musicTitle"
          type="text"
          value={editedData.title}
          onChange={(e) => setEditedData({ ...editedData, title: e.target.value })}
          className={classes.input}
        />
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="music-artist" className={classes.label}>
          Artist:
        </label>
        <input
          id="music-artist"
          name="musicArtist"
          type="text"
          value={editedData.artist}
          onChange={(e) => setEditedData({ ...editedData, artist: e.target.value })}
          className={classes.input}
        />
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="music-duration" className={classes.label}>
          Duration (seconds): {editedData.duration}s
        </label>
        <input
          id="music-duration"
          name="musicDuration"
          type="range"
          min="30"
          max="600"
          value={editedData.duration}
          onChange={(e) => setEditedData({ ...editedData, duration: Number(e.target.value) })}
          className={classes.slider}
        />
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="music-time" className={classes.label}>
          Current Time: {editedData.currentTime}s
        </label>
        <input
          id="music-time"
          name="musicTime"
          type="range"
          min="0"
          max={editedData.duration}
          value={editedData.currentTime}
          onChange={(e) => setEditedData({ ...editedData, currentTime: Number(e.target.value) })}
          className={classes.slider}
        />
      </div>

      <div className={classes.formGroup}>
        <label htmlFor="music-volume" className={classes.label}>
          Volume: {editedData.volume}%
        </label>
        <input
          id="music-volume"
          name="musicVolume"
          type="range"
          min="0"
          max="100"
          value={editedData.volume}
          onChange={(e) => setEditedData({ ...editedData, volume: Number(e.target.value) })}
          className={classes.slider}
        />
      </div>

      <div className={classes.actionButtons}>
        <button onClick={togglePlayback} className={classes.playButton}>
          {editedData.isPlaying ? "⏸ Pause" : "▶ Play"}
        </button>
        <button onClick={randomizeVisualizer} className={classes.randomButton}>
          🎲 Randomize
        </button>
      </div>

      <button onClick={handleSave} className={classes.saveButton}>
        Save Changes
      </button>
    </div>
  );
};

export const MusicPlayerNodeDefinition: NodeDefinition = {
  type: "music-player",
  displayName: "Music Player",
  description: "Interactive music player with visualizer",
  category: "Media",
  defaultData: {
    title: "Music Player",
  },
  defaultSize: { width: 300, height: 180 },
  ports: [
    {
      id: "audio-input",
      type: "input",
      label: "Audio Source",
      position: "left",
    },
    {
      id: "audio-output",
      type: "output",
      label: "Audio Stream",
      position: "right",
    },
    {
      id: "visualization",
      type: "output",
      label: "Visual Data",
      position: "bottom",
    },
  ],
  renderNode: MusicPlayerRenderer,
  renderInspector: MusicPlayerInspectorRenderer,
  loadExternalData: async (ref: ExternalDataReference) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    return {
      id: ref.id,
      title: "Epic Journey",
      artist: "Digital Dreams",
      duration: 210,
      currentTime: 45,
      isPlaying: true,
      volume: 75,
      visualizerData: Array.from({ length: 20 }, () => Math.random() * 100),
    };
  },
  updateExternalData: async (_ref: ExternalDataReference, data: unknown) => {
    await new Promise((resolve) => setTimeout(resolve, 200));
    console.log("Updated music player data:", data);
  },
};
