-- ==========================================================================
-- AviLearn — lesson_versions table
-- Regulatory-grade version history for AI-edited lesson content.
-- Run this migration AFTER the base schema.sql has been applied.
-- ==========================================================================

CREATE TABLE IF NOT EXISTS lesson_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  version_number INT NOT NULL,
  storage_path TEXT NOT NULL,             -- Supabase Storage path to the versioned HTML
  summary TEXT,                           -- Human-readable description of the edit
  edit_instruction TEXT,                  -- The AI prompt that produced this version
  html_char_count INT,                    -- Size of the HTML content
  edited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,  -- Who triggered the edit
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE (lesson_id, version_number)
);

CREATE INDEX idx_lesson_versions_lesson ON lesson_versions(lesson_id);
CREATE INDEX idx_lesson_versions_created ON lesson_versions(created_at);

-- Add a comment for documentation
COMMENT ON TABLE lesson_versions IS 'Audit trail of all AI edits to lesson HTML content. Required for aviation training regulatory compliance.';
COMMENT ON COLUMN lesson_versions.edit_instruction IS 'The natural-language instruction sent to the AI Slide Designer agent.';
COMMENT ON COLUMN lesson_versions.storage_path IS 'Path in the scorm-packages Supabase Storage bucket.';
