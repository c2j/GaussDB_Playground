## 1. Setup and Directory Structure

- [x] 1.1 Create main course directory `courses/mgcp-intermediate-201/`
- [x] 1.2 Create subdirectories: `courses/`, `exams/`, `assets/`
- [x] 1.3 Create 6 chapter directories under `courses/`: `ecosystem-and-architecture/`, `maintenance-and-data-management/`, `features-and-security/`, `performance-and-advanced-sql/`, `backup-recovery-and-ha/`, `management-tools-and-case/`
- [x] 1.4 Create placeholder files: course-content.json, courses/course-list.json, exams/exam-questions.json
- [ ] 1.5 Copy placeholder assets (logo.png, poster.png, cover.png) to assets/ directory or create design briefs

## 2. Course Configuration

- [ ] 2.1 Configure course metadata in course-content.json with title, description, and asset paths
- [ ] 2.2 Set container_live_time to "180" minutes in course-content.json
- [ ] 2.3 Define exam configuration with type "mixed", duration "90", pass_score "85"
- [ ] 2.4 Create chapters array in course-content.json with 6 chapter entries including content_dir, title, description, estimated_time
- [ ] 2.5 Add course entry to courses/course-list.json with id, content_dir, and status flags
- [ ] 2.6 Verify course metadata structure matches MGCA format for consistency

## 3. Chapter Content Creation

### 3.1 Chapter 1: Ecosystem and Architecture
- [ ] 3.1.1 Create index.json with chapter title, description, steps, intro, finish, and backend image_id
- [ ] 3.1.2 Write intro.md with chapter overview, learning objectives, and expected outcomes
- [ ] 3.1.3 Write step1.md with MogDB ecosystem overview and interactive commands using [[command]]{{PRINT}}
- [ ] 3.1.4 Write step2.md with architecture deep analysis and [[command]]{{RUN}} for gs_om commands
- [ ] 3.1.5 Add CheckList section in step files for self-assessment
- [ ] 3.1.6 Add verification sections after [[command]]{{RUN}} with automated validation
- [ ] 3.1.7 Integrate banking/financial scenario context in intro and steps
- [ ] 3.1.8 Write finish.md with chapter summary and next chapter guidance

### 3.2 Chapter 2: Maintenance and Data Management
- [ ] 3.2.1 Create index.json with chapter details
- [ ] 3.2.2 Write intro.md introducing maintenance tools and data operations
- [ ] 3.2.3 Create step1.md on daily maintenance scripts with interactive commands
- [ ] 3.2.4 Create step2.md on data import/export with [[gs_dump]]{{RUN}} examples
- [ ] 3.2.5 Include enterprise scenario: batch data migration from legacy system
- [ ] 3.2.6 Add CheckList and verification components
- [ ] 3.2.7 Write finish.md with summary

### 3.3 Chapter 3: Features and Security
- [ ] 3.3.1 Create index.json with chapter details
- [ ] 3.3.2 Write intro.md on advanced features and security strategies
- [ ] 3.3.3 Create step1.md on vector search and advanced features
- [ ] 3.3.4 Create step2.md on row-level access control and encryption with error demonstration
- [ ] 3.3.5 Integrate financial compliance scenario (data privacy regulations)
- [ ] 3.3.6 Add CheckList for security best practices and verification
- [ ] 3.3.7 Write finish.md

### 3.4 Chapter 4: Performance and Advanced SQL
- [ ] 3.4.1 Create index.json with chapter details
- [ ] 3.4.2 Write intro.md on performance diagnosis and advanced SQL
- [ ] 3.4.3 Create step1.md on EXPLAIN ANALYZE with performance metrics
- [ ] 3.4.4 Create step2.md on slow query analysis with case study
- [ ] 3.4.5 Include banking transaction optimization scenario
- [ ] 3.4.6 Add verification for query performance thresholds (e.g., sync delay < 1s)
- [ ] 3.4.7 Write finish.md

### 3.5 Chapter 5: Backup Recovery and High Availability
- [ ] 3.5.1 Create index.json with chapter details
- [ ] 3.5.2 Write intro.md on backup strategies and HA architecture
- [ ] 3.5.3 Create step1.md on gs_basebackup with interactive commands
- [ ] 3.5.4 Create step2.md on primary-standby failover simulation
- [ ] 3.5.5 Integrate banking disaster recovery scenario (RPO=0, RTO<1min)
- [ ] 3.5.6 Include "beginner training ground" for fault injection and rollback
- [ ] 3.5.7 Add verification for backup completion and failover success
- [ ] 3.5.8 Write finish.md

### 3.6 Chapter 6: Management Tools and Cases
- [ ] 3.6.1 Create index.json with chapter details
- [ ] 3.6.2 Write intro.md on management tools and enterprise cases
- [ ] 3.6.3 Create step1.md on MogDB Manager tool usage
- [ ] 3.6.4 Create step2.md on enterprise case analysis with specification explanation
- [ ] 3.6.5 Integrate comprehensive banking system case study
- [ ] 3.6.6 Add CheckList for tool usage and best practices
- [ ] 3.6.7 Write finish.md with course completion guidance

## 4. Exam System Implementation

- [ ] 4.1 Create exam-questions.json structure with pen_test and practice sections
- [ ] 4.2 Add 3-5 pen_test questions (single_choice) covering MGCP topics
- [ ] 4.3 Add 1-2 pen_test questions (multiple_choice) on architecture and tools
- [ ] 4.4 Add 1-2 pen_test questions (analysis) requiring descriptive answers
- [ ] 4.5 Create 2-3 practice tasks with detailed descriptions
- [ ] 4.6 Configure multi-dimensional scoring for each practice task (correctness, performance, norm, plan)
- [ ] 4.7 Add checklist arrays for each practice task with evaluation criteria
- [ ] 4.8 Include scenario-based questions aligning with enterprise content (e.g., HA design for banking)

## 5. Frontend Support Implementation

- [ ] 5.1 Implement markdown parser for [[command]]{{RUN}} syntax
- [ ] 5.2 Implement markdown parser for [[command]]{{PRINT}} syntax
- [ ] 5.3 Add command execution engine for running commands in container environment
- [ ] 5.4 Implement command output capture and display in learning interface
- [ ] 5.5 Add error handling for failed command execution with troubleshooting suggestions
- [ ] 5.6 Implement CheckList rendering with interactive checkboxes
- [ ] 5.7 Add verification logic comparing command output against expected criteria
- [ ] 5.8 Implement automated scoring for verification results
- [ ] 5.9 Extend exam system to support mixed type (pen_test + practice)
- [ ] 5.10 Implement multi-dimensional scoring calculation for practice tasks
- [ ] 5.11 Add progress tracking across chapters (intro → steps → finish)

## 6. Testing and Validation

- [ ] 6.1 Test interactive command execution with RUN action (gs_om, SQL queries)
- [ ] 6.2 Test interactive command display with PRINT action
- [ ] 6.3 Test command error handling and troubleshooting guidance display
- [ ] 6.4 Test sequential command execution in steps
- [ ] 6.5 Test CheckList checkbox state persistence
- [ ] 6.6 Test verification output matching and scoring
- [ ] 6.7 Test exam loading for mixed type configuration
- [ ] 6.8 Test multi-dimensional scoring calculation
- [ ] 6.9 Verify 180-minute container time allocation
- [ ] 6.10 Test chapter navigation (intro → steps → finish)
- [ ] 6.11 Validate enterprise scenario rendering and context display
- [ ] 6.12 Conduct pilot test with small learner group (3-5 users)

## 7. Documentation and Deployment

- [ ] 7.1 Update README.md with MGCP course overview and prerequisites
- [ ] 7.2 Create learner guide specific to MGCP intermediate course
- [ ] 7.3 Create instructor guide with grading rubrics for multi-dimensional scoring
- [ ] 7.4 Document interactive command syntax and best practices
- [ ] 7.5 Add troubleshooting guide for common command execution issues
- [ ] 7.6 Deploy course to production environment
- [ ] 7.7 Monitor initial enrollment and learner feedback
- [ ] 7.8 Create rollback procedure documentation (if needed)
