export function parseTimestamp(timestamp: string): number | null {
  if (!timestamp || typeof timestamp !== 'string') return null;

  const parts = timestamp.trim().split(':');

  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    const mins = parseInt(minutes, 10);
    const secs = parseFloat(seconds);
    if (!isNaN(mins) && !isNaN(secs)) {
      return mins * 60 + secs;
    }
  }

  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    const hrs = parseInt(hours, 10);
    const mins = parseInt(minutes, 10);
    const secs = parseFloat(seconds);
    if (!isNaN(hrs) && !isNaN(mins) && !isNaN(secs)) {
      return hrs * 3600 + mins * 60 + secs;
    }
  }

  const numericValue = parseFloat(timestamp);
  if (!isNaN(numericValue)) {
    return numericValue;
  }

  return null;
}

export function formatTimestamp(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00';

  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
