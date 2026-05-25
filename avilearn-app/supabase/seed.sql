-- ==========================================================================
-- AviLearn Engine — Database Seed Script
-- Populate profiles, courses, modules, lessons, flight logs, and simulation types.
-- Run this in your Supabase SQL Editor.
-- ==========================================================================

-- Clear existing data to avoid duplicates (order matters due to foreign keys)
DELETE FROM grades;
DELETE FROM flight_logs;
DELETE FROM enrollments;
DELETE FROM lessons;
DELETE FROM modules;
DELETE FROM courses;
DELETE FROM profiles;
DELETE FROM simulation_types;

-- 1. Seed Simulation Types
INSERT INTO simulation_types (id, name, display_name, description, template_path, xapi_verb, content_domains) VALUES
('a0000000-0000-0000-0000-000000000001', 'ishikawa-builder', 'Ishikawa Builder', 'Interactive fishbone diagram builder for root cause analysis.', 'templates/ishikawa.html', 'completed', ARRAY['rca']),
('a0000000-0000-0000-0000-000000000002', 'five-why-chain', '5-Why Chain', 'Iterative questioning builder to trace root causes.', 'templates/five_why.html', 'completed', ARRAY['rca']),
('a0000000-0000-0000-0000-000000000003', 'decision-tree', 'Decision Tree', 'Choose-your-own-path branching scenarios for crew resource management.', 'templates/decision_tree.html', 'passed', ARRAY['human_factors']),
('a0000000-0000-0000-0000-000000000004', 'step-sequencer', 'Step Sequencer', 'Drag-and-drop sequencing for operational checklists.', 'templates/step_sequencer.html', 'completed', ARRAY['procedure']),
('a0000000-0000-0000-0000-000000000005', 'drag-drop-matcher', 'Drag & Drop Matcher', 'Matching term-to-category associations.', 'templates/drag_drop.html', 'completed', ARRAY['regulatory']),
('a0000000-0000-0000-0000-000000000006', 'hotspot-diagram', 'Hotspot Diagram', 'Clickable regions on diagrams for component and defect identification.', 'templates/hotspot.html', 'completed', ARRAY['ndt_inspection']),
('a0000000-0000-0000-0000-000000000007', 'timed-scenario', 'Timed Scenario', 'Time-pressured branching scenarios for emergency operations.', 'templates/timed_scenario.html', 'passed', ARRAY['emergency']),
('a0000000-0000-0000-0000-000000000008', 'form-validator', 'Form Validator', 'Interactive forms with verification for paperwork and release certs.', 'templates/form_validator.html', 'completed', ARRAY['data_entry']),
('a0000000-0000-0000-0000-000000000009', 'branching-story', 'Branching Story', 'Narrative-driven branching case studies.', 'templates/branching_story.html', 'completed', ARRAY['hazard_id']);

-- 2. Seed Profiles (Instructors, Students, Admins)
INSERT INTO profiles (id, email, full_name, role, avatar_url) VALUES
('b0000000-0000-0000-0000-000000000001', 'anne.clark@avilearn.com', 'Anne Clark', 'instructor', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80'),
('b0000000-0000-0000-0000-000000000002', 'james.wilson@avilearn.com', 'James Wilson', 'instructor', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80'),
('c0000000-0000-0000-0000-000000000001', 'john.doe@avilearn.com', 'John Doe', 'student', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80'),
('c0000000-0000-0000-0000-000000000002', 'sarah.connor@avilearn.com', 'Sarah Connor', 'student', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80'),
('c0000000-0000-0000-0000-000000000003', 'david.kim@avilearn.com', 'David Kim', 'student', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=150&h=150&q=80');

-- 3. Seed Courses
INSERT INTO courses (id, code, name, description, status, created_by) VALUES
('d0000000-0000-0000-0000-000000000001', 'RCA-14', 'Root Cause Analysis ground school', 'Advanced training module covering maintenance human factors, incident investigation protocols, and root cause analysis techniques like Ishikawa diagrams and the 5-Why method, structured under EASA/FAA compliance frameworks.', 'active', 'b0000000-0000-0000-0000-000000000001'),
('d0000000-0000-0000-0000-000000000002', 'SMS-101', 'Safety Management Systems', 'Introduction to standard aviation safety management systems, hazard identification, and risk mitigation methodologies.', 'active', 'b0000000-0000-0000-0000-000000000001'),
('d0000000-0000-0000-0000-000000000003', 'HF-204', 'Human Factors in Aviation', 'Analyzing human error, situational awareness, and fatigue management in flight operations and maintenance environments.', 'draft', 'b0000000-0000-0000-0000-000000000002');

-- 4. Seed Enrollments
INSERT INTO enrollments (student_id, course_id, status, enrolled_at) VALUES
('c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'active', now() - INTERVAL '10 days'),
('c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000002', 'active', now() - INTERVAL '5 days'),
('c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'active', now() - INTERVAL '8 days'),
('c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'active', now() - INTERVAL '12 days');

-- 5. Seed Modules
INSERT INTO modules (id, course_id, title, description, sort_order, learning_objectives) VALUES
('e0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'Introduction to Root Cause Analysis', 'Overview of maintenance-related human errors and basic incident investigation methodologies.', 1, ARRAY['Understand the purpose of Root Cause Analysis (RCA) in aviation', 'Distinguish between active failures and latent conditions', 'Define the role of human error in maintenance incidents']),
('e0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'Ishikawa (Fishbone) Diagrams', 'Deep-dive into structured brainstorming and grouping of contributing factors under standard categories (Man, Machine, Material, Method, Medium, Management).', 2, ARRAY['Construct an Ishikawa (Fishbone) diagram for a maintenance incident', 'Properly categorize contributing factors', 'Identify latent systemic vulnerabilities']),
('e0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000001', 'The 5-Why Method', 'Applying the iterative 5-Why technique to drill past superficial causes down to the core organizational failures.', 3, ARRAY['Formulate valid 5-Why chains for operational defects', 'Differentiate between root causes and intermediate symptoms', 'Verify 5-Why answers with evidence']),
('e0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000002', 'SMS Components & Pillars', 'Detailed study of the four core pillars of SMS: Safety Policy, Safety Risk Management, Safety Assurance, and Safety Promotion.', 1, ARRAY['Outline the four pillars of a Safety Management System', 'Explain hazard identification reporting channels', 'Perform basic safety risk assessments']);

-- 6. Seed Lessons
INSERT INTO lessons (id, module_id, title, content_type, content_url, sort_order, duration_minutes) VALUES
('f0000000-0000-0000-0000-000000000001', 'e0000000-0000-0000-0000-000000000001', 'Aviation Incidents Overview', 'video', 'https://www.w3schools.com/html/mov_bbb.mp4', 1, 15),
('f0000000-0000-0000-0000-000000000002', 'e0000000-0000-0000-0000-000000000001', 'Latent vs Active Failures', 'html', '', 2, 20),
('f0000000-0000-0000-0000-000000000003', 'e0000000-0000-0000-0000-000000000002', 'Ishikawa Diagram Construction', 'pptx', 'courses/rca-14/ishikawa_intro.pptx', 1, 30),
('f0000000-0000-0000-0000-000000000004', 'e0000000-0000-0000-0000-000000000002', 'Ishikawa Simulation Exercise', 'simulation', '', 2, 45),
('f0000000-0000-0000-0000-000000000005', 'e0000000-0000-0000-0000-000000000003', '5-Why Mechanics', 'pdf', 'courses/rca-14/five_why_guide.pdf', 1, 25),
('f0000000-0000-0000-0000-000000000006', 'e0000000-0000-0000-0000-000000000003', '5-Why Practice Chain', 'simulation', '', 2, 35),
('f0000000-0000-0000-0000-000000000007', 'e0000000-0000-0000-0000-000000000004', 'SMS Safety Policy Basics', 'html', '', 1, 15);

-- 7. Seed Flight Logs
INSERT INTO flight_logs (student_id, instructor_id, aircraft_registration, flight_date, departure, arrival, duration_hours, flight_type, notes) VALUES
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'N172SP', CURRENT_DATE - INTERVAL '1 day', 'KSEA', 'KPDX', 1.8, 'dual', 'Excellent approach control. Worked on crosswind landing procedures.'),
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'N172SP', CURRENT_DATE - INTERVAL '3 days', 'KSEA', 'KBFI', 1.2, 'dual', 'Traffic pattern practice, touch and go exercises.'),
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'N734AV', CURRENT_DATE - INTERVAL '2 days', 'KSFO', 'KSJC', 0.8, 'dual', 'Pre-flight checklist review and basic taxi drills.'),
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000002', 'N521AL', CURRENT_DATE - INTERVAL '4 days', 'KLAX', 'KSAN', 2.1, 'dual', 'Instrument flight plans practice and VOR navigation procedures.');

-- 8. Seed Grades
INSERT INTO grades (student_id, lesson_id, graded_by, assessment_type, score, max_score, status, feedback, graded_at) VALUES
('c0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'assignment', 95.00, 100.00, 'graded', 'Well written synthesis of latent factor theory.', now() - INTERVAL '8 days'),
('c0000000-0000-0000-0000-000000000001', 'f0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'quiz', 80.00, 100.00, 'graded', 'Solid score, review active vs latent failure definitions.', now() - INTERVAL '7 days'),
('c0000000-0000-0000-0000-000000000002', 'f0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'assignment', 88.00, 100.00, 'graded', 'Good work, detail could be improved in incident timeline analysis.', now() - INTERVAL '5 days');
