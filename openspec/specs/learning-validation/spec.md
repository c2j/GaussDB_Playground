## ADDED Requirements

### Requirement: Content supports CheckList components for self-assessment
Step and chapter content SHALL support CheckList sections with multiple checkbox items for learners to track completion and understanding.

#### Scenario: Create CheckList in step
- **WHEN** a step content includes a CheckList section with multiple items
- **THEN** the system SHALL render interactive checkboxes for each item
- **AND** the learner SHALL be able to toggle checkbox states
- **AND** the system SHALL persist the checkbox state for the learner's session

### Requirement: CheckList includes validation guidance
CheckList components SHALL include validation guidance to help learners assess their understanding and identify areas for review.

#### Scenario: Provide CheckList validation
- **WHEN** a learner completes all items in a CheckList
- **THEN** the system SHALL display validation guidance text
- **AND** the guidance SHALL prompt self-assessment of understanding
- **AND** the guidance SHALL suggest review areas if items were uncertain

### Requirement: Content supports verification result sections
Step content SHALL support verification sections that compare expected results with actual execution results and provide automated feedback.

#### Scenario: Validate command output with verification
- **WHEN** a step includes a verification section after a [[command]]{{RUN}}
- **THEN** the system SHALL capture the command output
- **AND** the system SHALL validate the output against expected criteria
- **AND** the system SHALL display pass/fail status with explanation

### Requirement: Verification supports automated scoring
Verification sections SHALL support automated scoring based on predefined criteria such as output matching, time constraints, or correctness thresholds.

#### Scenario: Automated scoring with threshold
- **WHEN** a verification includes a threshold criteria (e.g., "同步延迟 < 1s 为满分")
- **THEN** the system SHALL measure the actual value from command output
- **AND** the system SHALL assign a score based on threshold compliance
- **AND** the system SHALL display the score and feedback to the learner

### Requirement: Verification supports error demonstration
Verification sections SHALL support demonstrating and explaining common errors to help learners understand and troubleshoot issues.

#### Scenario: Demonstrate expected error
- **WHEN** a verification section describes a potential error scenario
- **THEN** the system SHALL show the expected error message or behavior
- **AND** the system SHALL explain why the error occurs
- **AND** the system SHALL provide corrective actions for the learner

### Requirement: Completion status is tracked across chapters
The system SHALL track learner progress through CheckList completion and verification results across all steps and chapters.

#### Scenario: Track overall completion
- **WHEN** a learner completes CheckLists and verifications in multiple steps
- **THEN** the system SHALL aggregate completion status at chapter and course level
- **AND** the system SHALL display progress indicators showing completed vs. total items
- **AND** the system SHALL enable resuming from the last incomplete step
