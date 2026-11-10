export type TopicId =
  | "office"
  | "hr"
  | "sales"
  | "travel"
  | "finance"
  | "events"
  | "production"
  | "common";

export type PartOfSpeech = "n." | "v." | "adj." | "adv.";

export interface Word {
  /** The headword doubles as the stable id — it is unique across the list. */
  id: string;
  word: string;
  pos: PartOfSpeech;
  meaning: string;
  example: string;
  exampleMeaning: string;
  topic: TopicId;
}

export interface Topic {
  id: TopicId;
  name: string;
}

export type GrammarTag =
  | "word_form"
  | "verb_form"
  | "tense"
  | "passive"
  | "preposition"
  | "pronoun"
  | "conjunction"
  | "comparison"
  | "vocabulary"
  | "quantifier";

export type ListeningTag = "wh" | "yesno" | "choice" | "request" | "statement";

export type QuestionTag = GrammarTag | ListeningTag;

export interface Part5Question {
  id: `p5-${string}`;
  level: 1 | 2;
  tag: GrammarTag;
  /** Sentence with exactly one `___` blank. */
  sentence: string;
  options: readonly [string, string, string, string];
  answer: 0 | 1 | 2 | 3;
  translation: string;
  explanation: string;
}

export interface Part2Question {
  id: `p2-${string}`;
  tag: ListeningTag;
  prompt: string;
  options: readonly [string, string, string];
  answer: 0 | 1 | 2;
  promptMeaning: string;
  optionMeanings: readonly [string, string, string];
  explanation: string;
}

export type QuestionKind = "p5" | "p2";
export type Question = Part5Question | Part2Question;
