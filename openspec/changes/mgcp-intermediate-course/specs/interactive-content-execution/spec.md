## ADDED Requirements

### Requirement: Command syntax supports RUN action
The system SHALL support [[command]]{{RUN}} syntax to execute shell commands or SQL statements within the learning environment.

#### Scenario: Execute shell command with RUN
- **WHEN** content contains [[gs_om -t status --detail]]{{RUN}}
- **THEN** the system SHALL execute the gs_om command in the container
- **AND** the system SHALL display the command output to the learner
- **AND** the system SHALL capture the exit status of the command

### Requirement: Command syntax supports PRINT action
The system SHALL support [[command]]{{PRINT}} syntax to display command output without execution, useful for example commands or reference.

#### Scenario: Display command with PRINT
- **WHEN** content contains [[echo "MogDB生态：包括openGauss内核、MogDB Manager工具"]]{{PRINT}}
- **THEN** the system SHALL display the command text without executing
- **AND** the system SHALL show the command in a formatted code block

### Requirement: Command execution captures and validates output
When a command is executed with RUN action, the system SHALL capture the output and support validation based on expected results.

#### Scenario: Validate command output
- **WHEN** a command is executed with expected output criteria defined
- **THEN** the system SHALL compare actual output against expected criteria
- **AND** the system SHALL indicate success or failure of the validation
- **AND** the system SHALL provide feedback to the learner

### Requirement: Command errors are handled gracefully
When a command execution fails, the system SHALL display error messages and provide troubleshooting guidance.

#### Scenario: Handle command execution failure
- **WHEN** a command executed with RUN fails (non-zero exit code)
- **THEN** the system SHALL display the error message and output
- **AND** the system SHALL provide context-specific troubleshooting suggestions
- **AND** the learner SHALL be able to retry the command

### Requirement: Multiple commands in sequence are supported
The system SHALL support executing multiple commands in sequence within a single step.

#### Scenario: Execute command sequence
- **WHEN** content contains multiple [[command]]{{RUN}} entries
- **THEN** the system SHALL execute commands in the order they appear
- **AND** the system SHALL display output for each command
- **AND** if a command fails, subsequent commands SHALL not execute
