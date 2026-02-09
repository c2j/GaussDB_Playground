## ADDED Requirements

### Requirement: Course directory structure
The system SHALL create a standardized directory structure for the MGCA course at `courses/mgca/` following the framework defined in `courses/课程建设思路指南.md`.

#### Scenario: Course root directory creation
- **WHEN** the course is initialized
- **THEN** the system creates `courses/mgca/` directory with the following subdirectories:
  - `courses/` - containing individual course modules
  - `environments/` - containing training environment configurations
  - `assets/` - containing course resources (logos, posters, covers)

#### Scenario: Course module structure
- **WHEN** a new course module is created
- **THEN** the system creates a directory structure including:
  - `course-content.json` - course metadata and chapter list
  - `assets/` - module-specific resources
  - `exams/` - exam questions and report templates
  - `chapter-name/` directories for each chapter

#### Scenario: Chapter structure
- **WHEN** a chapter is created
- **THEN** the system creates:
  - `index.json` - chapter metadata and step configuration
  - `intro.md` - chapter introduction
  - `stepN.md` files for each step
  - `finish.md` - chapter summary

### Requirement: Course list registration
The system SHALL register the MGCA course in `courses/course-list.json` without modifying existing course entries.

#### Scenario: Course registration
- **WHEN** the course structure is created
- **THEN** the system adds an entry to `course-list.json` with:
  - A unique course ID
  - `content_dir` pointing to `mgca`
  - `status` set to `["online", "test"]`
  - Existing course entries remain unchanged

### Requirement: Course metadata configuration
The system SHALL provide a `course-content.json` file defining course metadata, chapter list, and exam configuration.

#### Scenario: Course metadata definition
- **WHEN** course configuration is created
- **THEN** the system includes:
  - `title` - course title
  - `description` - course description
  - `logo`, `poster`, `cover` - paths to visual resources
  - `container_live_time` - container lifetime in minutes
  - `chapters` - ordered list of chapter directories with titles, descriptions, and estimated times
  - `exam` - exam configuration with type, duration, and passing score

### Requirement: Four-stage training model
The system SHALL implement the enterprise training framework with theory, labs, cases, and assessment stages.

#### Scenario: Stage distribution
- **WHEN** course structure is organized
- **THEN** the system allocates content as:
  - Theory foundation: 20-25% of total course time
  - Beginner training ground (labs): 35-40% of total course time
  - Production case analysis: 25-30% of total course time
  - Assessment: 10-15% of total course time

#### Scenario: Stage progression
- **WHEN** learners progress through the course
- **THEN** the system enforces the order: theory → labs → cases → assessment
  - Learners can review completed stages
  - Learners cannot skip required stages without completion

### Requirement: Modular course architecture
The system SHALL organize course content into independent topic modules that can be consumed separately or as part of a complete curriculum.

#### Scenario: Module independence
- **WHEN** a learner selects a module
- **THEN** the system allows module completion without requiring other modules
  - Each module has its own prerequisites listed clearly
  - Modules can be studied in any order respecting prerequisites

#### Scenario: Module structure
- **WHEN** modules are defined
- **THEN** the system includes modules for:
  - GaussDB Architecture
  - Installation and Configuration
  - SQL Development
  - Performance Tuning
  - Backup and Recovery
  - High Availability
  - Security and Compliance

### Requirement: Chapter configuration
The system SHALL provide `index.json` for each chapter defining steps, introduction, and finish files with backend environment specification.

#### Scenario: Chapter metadata
- **WHEN** a chapter is configured
- **THEN** the system includes:
  - `title` - chapter title
  - `description` - chapter description
  - `details.steps` - ordered list of steps with titles and md_file references
  - `details.introduction` - reference to intro.md
  - `details.finish` - reference to finish.md
  - `backend.image_id` - container image specification for lab environment

### Requirement: Progressive learning paths
The system SHALL support progressive difficulty levels (L1-L4) for hands-on labs.

#### Scenario: Difficulty level assignment
- **WHEN** labs are designed
- **THEN** the system assigns levels:
  - L1: Entry-level - basic operations
  - L2: Intermediate - common tasks
  - L3: Advanced - complex scenarios
  - L4: Expert - production-grade challenges

#### Scenario: Difficulty progression
- **WHEN** learners complete labs
- **THEN** the system recommends next levels based on:
  - Completion of current level
  - Performance metrics (time, accuracy)
  - Prerequisite requirements

### Requirement: Enterprise training features
The system SHALL support enterprise-specific training features including class management, progress tracking, and report generation.

#### Scenario: Class creation
- **WHEN** an administrator creates a class
- **THEN** the system enables:
  - Assigning learners to the class
  - Setting class-wide deadlines
  - Viewing class progress statistics
  - Generating class comparison reports

#### Scenario: Individual progress tracking
- **WHEN** a learner completes course activities
- **THEN** the system records:
  - Time spent on each module
  - Assessment scores
  - Lab completion status
  - Weakness identification based on performance
