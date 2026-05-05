const videoUrlsByUnit = {
  1: import.meta.env.VITE_UNIT_1_VIDEO_URL,
  2: import.meta.env.VITE_UNIT_2_VIDEO_URL,
  3: import.meta.env.VITE_UNIT_3_VIDEO_URL,
  4: import.meta.env.VITE_UNIT_4_VIDEO_URL,
  5: import.meta.env.VITE_UNIT_5_VIDEO_URL,
  6: import.meta.env.VITE_UNIT_6_VIDEO_URL,
  7: import.meta.env.VITE_UNIT_7_VIDEO_URL,
} satisfies Record<number, string | undefined>;

export const getVideoUrlForUnit = (unitId: keyof typeof videoUrlsByUnit) => {
  const videoUrl = videoUrlsByUnit[unitId];

  if (!videoUrl) {
    throw new Error(`Missing VITE_UNIT_${unitId}_VIDEO_URL environment variable.`);
  }

  return videoUrl;
};
