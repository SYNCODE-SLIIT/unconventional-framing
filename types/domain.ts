export type AnnotationAnswer = "UNCONVENTIONAL" | "CONVENTIONAL" | "NOT_SURE";

export type Frame = {
  id: string;
  movie: string;
  frameImage: string;
  timecode: string;
  director: string;
  dop: string;
  sequence: number;
  notes?: string;
};

/** One participant's 1-5 rating of one frame. */
export type Annotation = {
  participantId?: string;
  frameId: string;
  answer?: AnnotationAnswer;
  rating: number;
  notes?: string;
  timestamp: string;
};

export type ParticipantSummary = {
  id: string;
  name: string;
  profession: string;
  avatar?: string;
  createdAt: string;
  answered: number;
  /** Average rating given, 0 when nothing has been rated yet. */
  average: number;
};

export type ParticipantDetail = ParticipantSummary & {
  totalFrames: number;
  responses: Array<{
    frameId: string;
    movie: string;
    frameImage: string;
    timecode: string;
    answer?: AnnotationAnswer;
    rating: number;
    timestamp: string;
  }>;
};

/** How many 1,2,3,4,5 ratings there are. */
export type RatingCounts = number[];

export type Statistics = {
  participants: number;
  totalFrames: number;
  totalAnnotations: number;
  completionPercent: number;
  averageRating: number;
  distribution: RatingCounts;
  /** How participants split across the three first-step answers, with the average number they gave. */
  categories: Record<AnnotationAnswer, { count: number; percent: number; average: number }>;
  movies: Array<{
    movie: string;
    frames: number;
    annotations: number;
    average: number;
    counts: RatingCounts;
  }>;
  professions: Array<{
    profession: string;
    participants: number;
    annotations: number;
    average: number;
    counts: RatingCounts;
  }>;
};
