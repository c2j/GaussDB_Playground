## ADDED Requirements

### Requirement: Chapter supports introduction section
Each chapter directory SHALL contain an intro.md file that provides chapter overview, learning objectives, and expected outcomes.

#### Scenario: Load chapter introduction
- **WHEN** a learner navigates to a chapter
- **THEN** the system SHALL display the content of intro.md
- **AND** the introduction SHALL include chapter title, learning objectives, and expected benefits

### Requirement: Chapter supports multiple learning steps
Each chapter SHALL support multiple step files (step1.md, step2.md, etc.) containing theoretical content, practical tasks, and interactive commands.

#### Scenario: Navigate through chapter steps
- **WHEN** a learner completes step1.md
- **THEN** the system SHALL automatically display step2.md
- **AND** the learner SHALL be able to navigate forward and backward through all defined steps

### Requirement: Step content supports task commands
Step markdown files SHALL support embedded commands using [[command]]{{RUN/PRINT}} syntax for interactive execution in the learning environment.

#### Scenario: Execute command in step
- **WHEN** a step contains [[echo "test"]]{{PRINT}}
- **THEN** the system SHALL execute the command and display the output
- **AND** the learner SHALL see the command output in the learning interface

### Requirement: Step content supports CheckList for self-assessment
Step markdown files SHALL support CheckList sections with checkbox items for learners to self-assess understanding and completion.

#### Scenario: Complete step CheckList
- **WHEN** a step contains a CheckList with multiple items
- **THEN** the system SHALL render checkboxes for each item
- **AND** the learner SHALL be able to check items as completed
- **AND** the system SHALL track completion status

### Requirement: Chapter supports finish section
Each chapter directory SHALL contain a finish.md file that summarizes learning outcomes, provides self-assessment guidance, and links to the next chapter.

#### Scenario: Display chapter completion
- **WHEN** a learner completes all steps in a chapter
- **THEN** the system SHALL display finish.md content
- **AND** the finish section SHALL include summary of key concepts learned
- **AND** the finish section SHALL provide guidance to the next chapter
