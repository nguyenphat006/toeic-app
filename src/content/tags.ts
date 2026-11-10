import type { QuestionTag } from "./types";

export const TAG_LABELS: Record<QuestionTag, string> = {
  word_form: "Từ loại",
  verb_form: "Dạng động từ",
  tense: "Thì của động từ",
  passive: "Câu bị động",
  preposition: "Giới từ",
  pronoun: "Đại từ",
  conjunction: "Liên từ",
  comparison: "So sánh",
  vocabulary: "Từ vựng",
  quantifier: "Từ chỉ số lượng",
  wh: "Câu hỏi Wh- (Ai, Ở đâu, Khi nào…)",
  yesno: "Câu hỏi Có / Không",
  choice: "Câu hỏi lựa chọn (A hay B)",
  request: "Lời đề nghị, nhờ vả",
  statement: "Câu trần thuật",
};
