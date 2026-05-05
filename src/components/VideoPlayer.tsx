import React, { useEffect, useRef } from 'react';
import { Unit } from '../App';
import './VideoPlayer.css';
import {
  trackVideoEnded,
  trackVideoLoaded,
  trackVideoPause,
  trackVideoPlay,
  trackVideoProgress,
} from '../lib/analytics';

interface VideoPlayerProps {
  unit: Unit;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ unit }) => {
  const progressMilestones = useRef(new Set<number>());
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [videoError, setVideoError] = React.useState<string | null>(null);

  useEffect(() => {
    progressMilestones.current.clear();
    setVideoUrl(null);
    setVideoError(null);

    const controller = new AbortController();

    fetch(`/.netlify/functions/video-url?unit=${unit.id}`, {
      signal: controller.signal,
    })
      .then(async (response) => {
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Unable to load this video.');
        }

        setVideoUrl(data.url);
      })
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }

        setVideoError(err instanceof Error ? err.message : 'Unable to load this video.');
      });

    return () => controller.abort();
  }, [unit.id]);

  return (
    <div className="video-player-container">
      <div className="video-wrapper">
        {videoUrl ? (
          <video 
            key={videoUrl} 
            controls 
            autoPlay 
            className="main-video"
            onLoadedMetadata={(event) => (
              trackVideoLoaded(unit.id, unit.title, event.currentTarget)
            )}
            onPlay={(event) => (
              trackVideoPlay(unit.id, unit.title, event.currentTarget)
            )}
            onPause={(event) => (
              trackVideoPause(unit.id, unit.title, event.currentTarget)
            )}
            onTimeUpdate={(event) => (
              trackVideoProgress(
                unit.id,
                unit.title,
                event.currentTarget,
                progressMilestones.current,
              )
            )}
            onEnded={(event) => (
              trackVideoEnded(unit.id, unit.title, event.currentTarget)
            )}
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="video-state" role="status">
            {videoError || 'Loading video...'}
          </div>
        )}
      </div>
      <div className="unit-info">
        <h2 className="unit-title">{unit.title}</h2>
        <p className="unit-description">{unit.description}</p>
        
        <div className="ced-topics">
          <h3 className="topics-title">Course Framework & Learning Objectives</h3>
          <div className="topics-grid">
            {unit.topics.map((topic) => (
              <div key={topic.id} className="topic-card">
                <h4 className="topic-name">{topic.id} {topic.name}</h4>
                <ul className="concepts-list">
                  {topic.concepts.map((concept, idx) => (
                    <li key={idx} className="concept-item">{concept}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
