/** Database enum types (see db/migrations). */
export type Visibility = "PUBLIC" | "PRIVATE";
export type ModerationStatus = "VISIBLE" | "HIDDEN" | "REMOVED";
export type ReportReason = "INAPPROPRIATE" | "OFFENSIVE" | "SPAM" | "OTHER";
export type ReportResolution = "RESTORED" | "REMOVED";
