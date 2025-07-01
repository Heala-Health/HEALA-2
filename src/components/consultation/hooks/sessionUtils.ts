
export const formatDuration = (minutes: number): string => {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
};

export const calculateSessionDuration = (startedAt: string): number => {
  const startTime = new Date(startedAt).getTime();
  const now = new Date().getTime();
  return Math.floor((now - startTime) / 1000 / 60);
};
