-- FairGrade AI — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor

-- One row per exam
CREATE TABLE exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_name TEXT NOT NULL,
  subject TEXT,
  mode TEXT NOT NULL,              -- 'AI_ONLY' or 'AUDIT'
  question_paper_url TEXT,
  questions_json JSONB,            -- [{q_no, question_text, max_marks}]
  created_at TIMESTAMPTZ DEFAULT now()
);

-- One row per student per exam
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id),
  student_id TEXT,
  student_name TEXT,
  answer_sheet_url TEXT,
  extracted_text TEXT,
  total_max_marks FLOAT,
  ai_total_marks FLOAT,
  teacher_total_marks FLOAT,        -- NULL in Mode A
  delta FLOAT,                      -- NULL in Mode A
  flagged BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- One row per question per student (the detailed breakdown)
CREATE TABLE question_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_row_id UUID REFERENCES students(id),
  q_no TEXT,
  max_marks FLOAT,
  ai_marks FLOAT,
  teacher_marks FLOAT,              -- NULL in Mode A
  delta FLOAT,                      -- NULL in Mode A
  key_points_covered JSONB,
  key_points_missing JSONB,
  reasoning TEXT
);

-- Final generated report (Mode B only, or summary report in Mode A)
CREATE TABLE audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES exams(id),
  report_markdown TEXT,
  bias_summary JSONB,               -- per-question bias stats
  flagged_students JSONB,           -- list of student_ids needing recheck
  generated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Realtime on key tables
ALTER PUBLICATION supabase_realtime ADD TABLE students;
ALTER PUBLICATION supabase_realtime ADD TABLE audit_reports;

-- Indexes for performance
CREATE INDEX idx_students_exam_id ON students(exam_id);
CREATE INDEX idx_question_scores_student ON question_scores(student_row_id);
CREATE INDEX idx_audit_reports_exam ON audit_reports(exam_id);
