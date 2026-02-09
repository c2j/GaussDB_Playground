## ADDED Requirements

### Requirement: Exam configuration supports pen_test section
The exam-questions.json file SHALL support a pen_test array containing written assessment questions including single_choice, multiple_choice, and analysis types.

#### Scenario: Create single-choice question
- **WHEN** pen_test contains a question with type "single_choice"
- **THEN** the system SHALL render the question with radio button options
- **AND** the learner SHALL be able to select exactly one answer
- **AND** the system SHALL validate against the answer field

### Requirement: Exam configuration supports analysis questions
The pen_test section SHALL support analysis-type questions requiring descriptive answers and expert grading.

#### Scenario: Create analysis question
- **WHEN** pen_test contains a question with type "analysis"
- **THEN** the system SHALL render the question with a text input area
- **AND** the learner SHALL be able to provide a descriptive answer
- **AND** the system SHALL submit the answer for manual or expert review

### Requirement: Exam configuration supports practice section
The exam-questions.json file SHALL support a practice array containing task-based practical assessments with multi-dimensional scoring.

#### Scenario: Create practical task
- **WHEN** practice contains a task with description and scoring dimensions
- **THEN** the system SHALL display the task description and requirements
- **AND** the system SHALL evaluate based on correctness, performance, norm, and plan dimensions
- **AND** each dimension SHALL contribute to the total score according to defined weights

### Requirement: Multi-dimensional scoring supports performance evaluation
The practice task scoring SHALL include a performance dimension to evaluate solution efficiency and optimization.

#### Scenario: Evaluate performance dimension
- **WHEN** a practical task includes scoring.performance with value 35
- **THEN** the system SHALL assess the execution time and resource usage of the solution
- **AND** the performance score SHALL account for 35% of the total task score
- **AND** the system SHALL provide feedback on optimization opportunities

### Requirement: Multi-dimensional scoring supports norm evaluation
The practice task scoring SHALL include a norm dimension to evaluate adherence to enterprise best practices and standards.

#### Scenario: Evaluate norm dimension
- **WHEN** a practical task includes scoring.norm with value 20
- **THEN** the system SHALL assess compliance with industry standards and enterprise conventions
- **AND** the norm score SHALL account for 20% of the total task score
- **AND** the system SHALL highlight any deviations from best practices

### Requirement: Mixed exam calculates combined score
The exam system SHALL calculate a combined score from pen_test and practice sections and compare against pass_score threshold.

#### Scenario: Calculate mixed exam result
- **WHEN** a learner completes both pen_test and practice sections
- **THEN** the system SHALL calculate the weighted average of all sections
- **AND** the system SHALL compare the total score against the pass_score percentage
- **AND** the system SHALL display pass/fail result based on the threshold
