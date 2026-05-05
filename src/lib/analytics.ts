const SESSION_KEY = 'mor_session_id';
const START_TIME = Date.now();
const PAGE_ID = crypto.randomUUID();
const VIDEO_MILESTONES = [25, 50, 75, 90];

type AnalyticsEventType =
  | 'start'
  | 'heartbeat'
  | 'end'
  | 'unit_select'
  | 'video_loaded'
  | 'video_play'
  | 'video_pause'
  | 'video_progress'
  | 'video_ended';

type AnalyticsMetadata = Record<string, unknown>;

type AnalyticsOptions = {
  videoUnit?: number;
  useBeacon?: boolean;
  metadata?: AnalyticsMetadata;
};

type NetworkInformation = {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
};

const navigatorWithConnection = navigator as Navigator & {
  connection?: NetworkInformation;
};

let visibleStartedAt = document.visibilityState === 'visible' ? Date.now() : null;
let visibleMilliseconds = 0;
let maxScrollDepth = 0;

const clampPercent = (value: number) => Math.max(0, Math.min(100, Math.round(value)));

const getSessionId = () => {
  let sessionId = null;

  try {
    sessionId = sessionStorage.getItem(SESSION_KEY);
  } catch {
    return crypto.randomUUID();
  }

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    try {
      sessionStorage.setItem(SESSION_KEY, sessionId);
    } catch {
      // Keep analytics non-blocking if storage is unavailable.
    }
  }

  return sessionId;
};

const getSecondsSinceStart = () => Math.floor((Date.now() - START_TIME) / 1000);

const getVisibleSeconds = () => {
  const currentVisibleMilliseconds = visibleStartedAt
    ? Date.now() - visibleStartedAt
    : 0;

  return Math.floor((visibleMilliseconds + currentVisibleMilliseconds) / 1000);
};

const updateVisibilityTime = () => {
  if (document.visibilityState === 'visible' && visibleStartedAt === null) {
    visibleStartedAt = Date.now();
    return;
  }

  if (document.visibilityState !== 'visible' && visibleStartedAt !== null) {
    visibleMilliseconds += Date.now() - visibleStartedAt;
    visibleStartedAt = null;
  }
};

const getScrollDepth = () => {
  const root = document.documentElement;
  const scrollableHeight = root.scrollHeight - window.innerHeight;

  if (scrollableHeight <= 0) {
    return 100;
  }

  return clampPercent((window.scrollY / scrollableHeight) * 100);
};

const updateMaxScrollDepth = () => {
  maxScrollDepth = Math.max(maxScrollDepth, getScrollDepth());
};

const getTimezone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return null;
  }
};

const getConnectionMetadata = () => {
  const connection = navigatorWithConnection.connection;

  if (!connection) {
    return {};
  }

  return {
    connection_effective_type: connection.effectiveType ?? null,
    connection_downlink: connection.downlink ?? null,
    connection_rtt: connection.rtt ?? null,
    connection_save_data: connection.saveData ?? null,
  };
};

const getPageMetadata = (): AnalyticsMetadata => {
  updateMaxScrollDepth();

  return {
    page_id: PAGE_ID,
    page_title: document.title,
    page_url: window.location.href,
    search: window.location.search || null,
    hash: window.location.hash || null,
    viewport_width: window.innerWidth,
    viewport_height: window.innerHeight,
    screen_width: window.screen.width,
    screen_height: window.screen.height,
    pixel_ratio: window.devicePixelRatio,
    language: navigator.language,
    languages: navigator.languages,
    timezone: getTimezone(),
    timezone_offset_minutes: new Date().getTimezoneOffset(),
    online: navigator.onLine,
    visibility_state: document.visibilityState,
    visible_seconds: getVisibleSeconds(),
    max_scroll_depth_percent: maxScrollDepth,
    color_scheme: window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light',
    reduced_motion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    ...getConnectionMetadata(),
  };
};

const getVideoMetadata = (video?: HTMLVideoElement): AnalyticsMetadata => {
  if (!video) {
    return {};
  }

  const duration = Number.isFinite(video.duration) ? video.duration : null;
  const currentTime = Number.isFinite(video.currentTime) ? video.currentTime : 0;
  const percentWatched = duration ? clampPercent((currentTime / duration) * 100) : null;

  return {
    video_current_time_seconds: Math.round(currentTime),
    video_duration_seconds: duration ? Math.round(duration) : null,
    video_percent_watched: percentWatched,
    video_muted: video.muted,
    video_volume: video.volume,
    video_playback_rate: video.playbackRate,
    video_ready_state: video.readyState,
  };
};

const getUnitMetadata = (unitTitle: string, videoUrl: string) => ({
  unit_title: unitTitle,
  video_url: videoUrl,
});

const sendEvent = (
  eventType: AnalyticsEventType,
  { videoUnit, useBeacon = false, metadata = {} }: AnalyticsOptions = {},
) => {
  const payload = {
    session_id: getSessionId(),
    event_type: eventType,
    path: `${window.location.pathname}${window.location.search}`,
    video_unit: videoUnit ?? null,
    seconds_since_start: getSecondsSinceStart(),
    referrer: document.referrer || null,
    metadata: {
      ...getPageMetadata(),
      ...metadata,
    },
  };

  const url = '/.netlify/functions/analytics';
  const body = JSON.stringify(payload);

  if (useBeacon && navigator.sendBeacon) {
    navigator.sendBeacon(url, body);
  } else {
    fetch(url, {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch((err) => console.error('Failed to send analytics', err));
  }
};

export const startAnalytics = () => {
  sendEvent('start');

  const heartbeatInterval = setInterval(() => {
    if (document.visibilityState === 'visible') {
      sendEvent('heartbeat');
    }
  }, 15000);

  const handlePageHide = () => {
    updateVisibilityTime();
    sendEvent('end', { useBeacon: true });
    clearInterval(heartbeatInterval);
  };

  window.addEventListener('scroll', updateMaxScrollDepth, { passive: true });
  document.addEventListener('visibilitychange', updateVisibilityTime);
  window.addEventListener('pagehide', handlePageHide);

  return () => {
    clearInterval(heartbeatInterval);
    window.removeEventListener('scroll', updateMaxScrollDepth);
    document.removeEventListener('visibilitychange', updateVisibilityTime);
    window.removeEventListener('pagehide', handlePageHide);
  };
};

export const trackUnitSelect = (unit: number, title: string) => {
  sendEvent('unit_select', {
    videoUnit: unit,
    metadata: { unit_title: title },
  });
};

export const trackVideoLoaded = (
  unit: number,
  unitTitle: string,
  videoUrl: string,
  video: HTMLVideoElement,
) => {
  sendEvent('video_loaded', {
    videoUnit: unit,
    metadata: {
      ...getUnitMetadata(unitTitle, videoUrl),
      ...getVideoMetadata(video),
    },
  });
};

export const trackVideoPlay = (
  unit: number,
  unitTitle: string,
  videoUrl: string,
  video: HTMLVideoElement,
) => {
  sendEvent('video_play', {
    videoUnit: unit,
    metadata: {
      ...getUnitMetadata(unitTitle, videoUrl),
      ...getVideoMetadata(video),
    },
  });
};

export const trackVideoPause = (
  unit: number,
  unitTitle: string,
  videoUrl: string,
  video: HTMLVideoElement,
) => {
  if (video.ended) {
    return;
  }

  sendEvent('video_pause', {
    videoUnit: unit,
    metadata: {
      ...getUnitMetadata(unitTitle, videoUrl),
      ...getVideoMetadata(video),
    },
  });
};

export const trackVideoEnded = (
  unit: number,
  unitTitle: string,
  videoUrl: string,
  video: HTMLVideoElement,
) => {
  sendEvent('video_ended', {
    videoUnit: unit,
    metadata: {
      ...getUnitMetadata(unitTitle, videoUrl),
      ...getVideoMetadata(video),
      video_percent_watched: 100,
    },
  });
};

export const trackVideoProgress = (
  unit: number,
  unitTitle: string,
  videoUrl: string,
  video: HTMLVideoElement,
  sentMilestones: Set<number>,
) => {
  const duration = Number.isFinite(video.duration) ? video.duration : 0;

  if (duration <= 0) {
    return;
  }

  const percentWatched = (video.currentTime / duration) * 100;

  VIDEO_MILESTONES.forEach((milestone) => {
    if (percentWatched >= milestone && !sentMilestones.has(milestone)) {
      sentMilestones.add(milestone);
      sendEvent('video_progress', {
        videoUnit: unit,
        metadata: {
          ...getUnitMetadata(unitTitle, videoUrl),
          ...getVideoMetadata(video),
          video_milestone_percent: milestone,
        },
      });
    }
  });
};
