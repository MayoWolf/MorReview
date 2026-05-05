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

  useEffect(() => {
    progressMilestones.current.clear();
  }, [unit.id]);

  return (
    <div className="video-player-container">
      <div className="video-wrapper">
        <video 
          key={unit.videoUrl} 
          controls 
          autoPlay 
          className="main-video"
          onLoadedMetadata={(event) => (
            trackVideoLoaded(unit.id, unit.title, unit.videoUrl, event.currentTarget)
          )}
          onPlay={(event) => (
            trackVideoPlay(unit.id, unit.title, unit.videoUrl, event.currentTarget)
          )}
          onPause={(event) => (
            trackVideoPause(unit.id, unit.title, unit.videoUrl, event.currentTarget)
          )}
          onTimeUpdate={(event) => (
            trackVideoProgress(
              unit.id,
              unit.title,
              unit.videoUrl,
              event.currentTarget,
              progressMilestones.current,
            )
          )}
          onEnded={(event) => (
            trackVideoEnded(unit.id, unit.title, unit.videoUrl, event.currentTarget)
          )}
        >
          <source src={unit.videoUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
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
