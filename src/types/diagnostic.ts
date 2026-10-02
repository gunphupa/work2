export type Locale = 'en' | 'th';
export type Text = { en: string; th: string };
export const t = (en: string, th: string): Text => ({ en, th });
export type Category = 'performance' | 'network' | 'audio' | 'hardware' | 'windows';
export type CauseStatus = 'very_likely' | 'likely' | 'possible' | 'unlikely' | 'ruled_out';
export type Outcome = 'in_progress' | 'solved' | 'partially_solved' | 'solution_not_found';
export type FixResult = 'fixed' | 'improved' | 'no_change' | 'worse' | 'could_not_complete';
export type Destination = string;
export interface Effect {
  cause: string;
  status: CauseStatus;
}
export interface Option {
  id: string;
  label: Text;
  next: Destination;
  effects?: Effect[];
  detail?: boolean;
}
export interface Question {
  id: string;
  kind: 'question';
  title: Text;
  why: Text;
  guide: Text[];
  options: Option[];
  input?: 'single' | 'range';
  unit?: string;
  min?: number;
  max?: number;
  ranges?: { max: number; option: string }[];
}
export interface Fix {
  id: string;
  kind: 'fix';
  title: Text;
  cause: string;
  why: Text;
  steps: Text[];
  verify: Text;
  confidenceOnSuccess?: CauseStatus;
  risk: 'safe' | 'caution';
  warning?: Text;
  undo: Text;
  onFailure: Destination;
}
export type Node = Question | Fix;
export interface FlowMeta {
  id: string;
  category: Category;
  title: Text;
  description: Text;
  time: Text;
  icon: string;
  symptoms: Text[];
}
export interface Flow extends FlowMeta {
  start: string;
  causes: { id: string; title: Text }[];
  nodes: Node[];
}
export interface Evidence {
  nodeId: string;
  answerId?: string;
  title: Text;
  answer: Text;
  detail?: string;
  timestamp: number;
}
export interface CauseState {
  id: string;
  status: CauseStatus;
  evidence: Evidence[];
}
export interface FixAttempt {
  fixId: string;
  result: FixResult;
  timestamp: number;
}
export interface Session {
  id: string;
  flowId: string;
  startedAt: number;
  endedAt?: number;
  platform: 'windows10' | 'windows11' | 'unknown';
  symptoms: string[];
  change: string;
  context?: string;
  current: string;
  history: Evidence[];
  causes: CauseState[];
  fixes: FixAttempt[];
  notes: { text: string; symptoms: string[] }[];
  outcome: Outcome;
  stopReason?: 'exhausted' | 'worse' | 'ended' | 'invalid' | 'safety';
}
export interface Intake {
  platform: Session['platform'];
  symptoms: string[];
  change: string;
  context?: string;
}
