export interface SkillEntry {
  id: string;
  title: string;
  summary: string;
  trigger: string;
  tags: string[];
  sourceUrl: string;
  status: "shipped" | "submitted" | "draft";
  publishedAt: string;
}

export const SKILLS: SkillEntry[] = [];
