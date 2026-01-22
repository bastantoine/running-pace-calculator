class Duration {
  hours?: number;
  minutes?: number;
  seconds?: number;

  constructor({
    hours = 0,
    minutes = 0,
    seconds = 0,
  }: { hours?: number; minutes?: number; seconds?: number } = {}) {
    this.hours = hours;
    this.minutes = minutes;
    this.seconds = seconds;
  }

  format(): string {
    const h = this.hours ? String(this.hours).padStart(2, "0") : "00";
    const m = this.minutes ? String(this.minutes).padStart(2, "0") : "00";
    const s = this.seconds ? String(this.seconds).padStart(2, "0") : "00";
    if (h === "00") {
      return `${m}m ${s}s`;
    }
    return `${h}h ${m}m ${s}s`;
  }

  static fromSeconds(total_seconds: number): Duration {
    const hours = Math.floor(total_seconds / 3600);
    const minutes = Math.floor((total_seconds - hours * 3600) / 60);
    const seconds = Math.floor(total_seconds - hours * 3600 - minutes * 60);
    return new Duration({ hours: hours, minutes: minutes, seconds: seconds });
  }
}

// Helper to round to 2 decimals
const round = (num: number) => Math.round(num * 100) / 100;

export { Duration, round };
