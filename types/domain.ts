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

export type Annotation = {
  frameId: string;
  answer: AnnotationAnswer;
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
  conventional: number;
  unconventional: number;
  notSure: number;
};

export type ParticipantDetail = ParticipantSummary & {
  totalFrames: number;
  responses: Array<{
    frameId: string;
    movie: string;
    frameImage: string;
    timecode: string;
    answer: AnnotationAnswer;
    timestamp: string;
  }>;
};

export type Statistics = {
  participants: number;
  professions: Array<{
    profession: string;
    participants: number;
    conventional: number;
    unconventional: number;
    notSure: number;
  }>;
  totalFrames: number;
  totalAnnotations: number;
  completionPercent: number;
  conventionalPercent: number;
  unconventionalPercent: number;
  notSurePercent: number;
  movies: Array<{
    movie: string;
    frames: number;
    annotations: number;
    conventional: number;
    unconventional: number;
    notSure: number;
  }>;
};
