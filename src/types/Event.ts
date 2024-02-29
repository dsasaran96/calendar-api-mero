export type Duration = {
  start: Date;
  end: Date;
};

export interface CalendarEvent {
  id: string;
  title: string;
  duration: Duration;
  seriesId?: string;
}
