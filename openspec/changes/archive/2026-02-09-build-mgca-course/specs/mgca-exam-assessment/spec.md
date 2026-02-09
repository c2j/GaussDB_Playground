## ADDED Requirements

### Requirement: Mixed exam format
The system SHALL support both written tests (pen_test) and practical exams (practice) with configurable exam types (pen, practice, mixed) in the course exam configuration.

#### Scenario: Exam type configuration
- **WHEN** exam configuration is defined
- **THEN** the system supports:
  - `type: "pen"` - written test only
  - `type: "practice"` - practical exam only
  - `type: "mixed"` - combination of written and practical
  - `duration` - exam duration in minutes
  - `pass_score` - minimum passing score percentage

#### Scenario: Mixed exam execution
- **WHEN** learner takes a mixed exam
- **THEN** the system:
  - Presents written test questions first
  - Follows with practical exam tasks
  - Provides time allocation for each section
  - Calculates combined score

### Requirement: Written test question bank
The system SHALL provide a structured question bank for written tests with multiple question types including multiple choice, single choice, and analysis questions.

#### Scenario: Question bank structure
- **WHEN** exam questions are defined
- **THEN** the system includes in `exams/exam-questions.json`:
  - `pen_test` array with question objects
  - Each question has: `question`, `type`, `options` (for choice questions), `answer`
  - Support for types: `single_choice`, `multiple_choice`, `analysis`

#### Scenario: Question types
- **WHEN** different question types are used
- **THEN** the system supports:
  - Single choice: one correct answer from options
  - Multiple choice: multiple correct answers
  - Analysis: open-ended scenario questions requiring written response

### Requirement: Practical exam tasks
The system SHALL define practical exam tasks with scoring rubrics covering correctness, performance, and compliance norms.

#### Scenario: Practical task definition
- **WHEN** practical exams are configured
- **THEN** the system includes:
  - `practice` array with task objects
  - Each task has: `task` description and `scoring` object
  - Scoring dimensions: `correctness`, `performance`, `norm`
  - Each dimension has weight values (sum to 100%)

#### Scenario: Task execution environment
- **WHEN** learner attempts practical exam
- **THEN** the system:
  - Provides isolated lab environment
  - Sets up initial data and schema
  - Allows access to required tools
  - Captures execution logs

### Requirement: Automated scoring system
The system SHALL provide automated scoring for both written tests and practical exams where objective evaluation is possible.

#### Scenario: Written test scoring
- **WHEN** written test is submitted
- **THEN** the system:
  - Compares answers to correct responses
  - Calculates score per question
  - Provides total score and pass/fail indication
  - Shows correct answers for incorrect responses

#### Scenario: Practical exam scoring
- **WHEN** practical exam is evaluated
- **THEN** the system:
  - Executes validation scripts on submitted solutions
  - Measures performance metrics (execution time, resource usage)
  - Checks compliance with enterprise norms (best practices)
  - Calculates weighted score across dimensions

### Requirement: Exam report generation
The system SHALL generate detailed exam reports in PDF and Excel formats for individual learners and classes.

#### Scenario: Individual report
- **WHEN** individual exam is completed
- **THEN** the system generates report with:
  - Overall score and pass/fail status
  - Performance breakdown by section and question
  - Strengths and weaknesses analysis
  - Time spent per section
  - Recommendations for improvement

#### Scenario: Class report
- **WHEN** class exams are aggregated
- **THEN** the system generates report with:
  - Class average and distribution
  - Individual learner performance comparison
  - Common knowledge gaps
  - Leaderboard (optional)
  - Training effectiveness metrics

### Requirement: Question randomization
The system SHALL support randomization of exam questions to prevent cheating and ensure fairness across multiple exam attempts.

#### Scenario: Question pool selection
- **WHEN** exam is generated
- **THEN** the system:
  - Selects questions from a larger pool
  - Randomizes question order
  - Randomizes option order for choice questions
  - Ensures balanced difficulty distribution

#### Scenario: Exam attempts
- **WHEN** learner retakes exam
- **THEN** the system:
  - Generates different question set
  - Maintains same difficulty and coverage
  - Tracks all attempt records
  - Shows best score or average based on policy

### Requirement: Weakness identification
The system SHALL analyze exam performance to identify learner weaknesses and provide targeted recommendations for remediation.

#### Scenario: Performance analysis
- **WHEN** exam results are analyzed
- **THEN** the system:
  - Identifies low-performing topic areas
  - Maps weak areas to course modules
  - Provides specific module recommendations
  - Suggests relevant lab exercises for practice

#### Scenario: Self-assessment prompts
- **WHEN** learners complete chapters
- **THEN** the system:
  - Prompts learners to self-assess confidence
  - Records subjective difficulty ratings
  - Correlates with exam performance
  - Adjusts future recommendations

### Requirement: Time management features
The system SHALL enforce exam time limits and provide countdown timers with warnings as time approaches expiration.

#### Scenario: Time tracking
- **WHEN** exam is in progress
- **THEN** the system:
  - Displays countdown timer
  - Provides time warnings at 50%, 25%, and 10% remaining
  - Automatically submits when time expires
  - Allows time extensions for accommodations

#### Scenario: Section time allocation
- **WHEN** mixed exam is configured
- **THEN** the system:
  - Allows time allocation per section
  - Shows section-specific timers
  - Prevents spending too much time on early sections
  - Allows navigation between sections

### Requirement: Assessment integration
The system SHALL integrate assessment results with learning progress tracking and adaptive learning recommendations.

#### Scenario: Progress tracking integration
- **WHEN** exam results are recorded
- **THEN** the system:
  - Updates learner proficiency profile
  - Adjusts learning path based on performance
  - Unlocks advanced content when prerequisites met
  - Recommends additional practice for weak areas

#### Scenario: Adaptive learning
- **WHEN** learner performance patterns emerge
- **THEN** the system:
  - Suggests alternative learning resources
  - Adjusts lab difficulty dynamically
  - Provides targeted practice exercises
  - Recommends peer collaboration opportunities
