-- ==========================================================================
-- AviLearn Engine — Database Schema
-- Supabase (PostgreSQL) — All phases
-- ==========================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---- Clean Slate (Drop existing conflicting tables) ----
DROP TABLE IF EXISTS generated_simulations CASCADE;
DROP TABLE IF EXISTS agent_logs CASCADE;
DROP TABLE IF EXISTS simulation_types CASCADE;
DROP TABLE IF EXISTS scorm_packages CASCADE;
DROP TABLE IF EXISTS grades CASCADE;
DROP TABLE IF EXISTS flight_logs CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS lessons CASCADE;
DROP TABLE IF EXISTS modules CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ---- Profiles ----
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'instructor', 'student')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---- Courses ----
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,            -- e.g. 'PPL', 'IFR', 'ATPL'
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---- Modules ----
CREATE TABLE modules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  learning_objectives TEXT[],           -- array of objectives
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---- Lessons ----
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('html', 'video', 'simulation', 'quiz', 'pptx', 'pdf')),
  content_url TEXT,                     -- Supabase Storage path
  sort_order INT NOT NULL DEFAULT 0,
  duration_minutes INT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---- Enrollments ----
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'withdrawn', 'pending')),
  enrolled_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE (student_id, course_id)
);

-- ---- Flight logs ----
CREATE TABLE flight_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id),
  instructor_id UUID REFERENCES profiles(id),
  aircraft_registration TEXT NOT NULL,  -- e.g. 'N1456C'
  flight_date DATE NOT NULL,
  departure TEXT,                       -- ICAO code
  arrival TEXT,                         -- ICAO code
  duration_hours DECIMAL(5,1) NOT NULL,
  flight_type TEXT CHECK (flight_type IN ('dual', 'solo', 'cross_country', 'night', 'instrument', 'checkride')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---- Grades ----
CREATE TABLE grades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES profiles(id),
  lesson_id UUID NOT NULL REFERENCES lessons(id),
  graded_by UUID REFERENCES profiles(id),
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('quiz', 'exam', 'practical', 'assignment')),
  score DECIMAL(5,2),
  max_score DECIMAL(5,2) DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'graded', 'passed', 'failed')),
  feedback TEXT,
  graded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---- SCORM packages ----
CREATE TABLE scorm_packages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id),
  package_type TEXT NOT NULL CHECK (package_type IN ('scorm_12', 'cmi5')),
  storage_path TEXT NOT NULL,           -- Supabase Storage path
  file_size_bytes BIGINT,
  version INT NOT NULL DEFAULT 1,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---- Phase 2: Simulation types (scaffold) ----
CREATE TABLE simulation_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,            -- e.g. 'ishikawa-builder'
  display_name TEXT NOT NULL,
  description TEXT,
  template_path TEXT,                   -- path to template HTML
  xapi_verb TEXT DEFAULT 'completed',
  content_domains TEXT[],               -- e.g. ['rca', 'fault_analysis']
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---- Phase 2: Agent logs (scaffold) ----
CREATE TABLE agent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name TEXT NOT NULL,             -- e.g. 'supervisor', 'researcher'
  action TEXT NOT NULL,
  input_summary TEXT,
  output_summary TEXT,
  confidence_score DECIMAL(3,2),
  duration_ms INT,
  related_module_id UUID REFERENCES modules(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ---- Indexes ----
CREATE INDEX idx_modules_course ON modules(course_id);
CREATE INDEX idx_lessons_module ON lessons(module_id);
CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_grades_student ON grades(student_id);
CREATE INDEX idx_grades_lesson ON grades(lesson_id);
CREATE INDEX idx_flight_logs_student ON flight_logs(student_id);
CREATE INDEX idx_scorm_packages_course ON scorm_packages(course_id);
CREATE INDEX idx_agent_logs_module ON agent_logs(related_module_id);
CREATE INDEX idx_agent_logs_created ON agent_logs(created_at);

-- ---- Phase 2: Generated simulations ----
CREATE TABLE generated_simulations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
  sim_type_id UUID REFERENCES simulation_types(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  html_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'generating' CHECK (status IN ('generating', 'pending_review', 'approved', 'rejected', 'revision_requested')),
  xapi_verb TEXT NOT NULL,
  learning_objectives TEXT[],
  sme_flags TEXT[],
  agent_rationale TEXT,
  researcher_output JSONB,
  verifier_output JSONB,
  generation_cost_tokens INT,
  version INT NOT NULL DEFAULT 1,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  cmi5_package_path TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_generated_simulations_module ON generated_simulations(module_id);
CREATE INDEX idx_generated_simulations_sim_type ON generated_simulations(sim_type_id);
CREATE INDEX idx_generated_simulations_status ON generated_simulations(status);

