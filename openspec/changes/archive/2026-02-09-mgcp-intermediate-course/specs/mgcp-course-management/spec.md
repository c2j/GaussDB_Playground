## ADDED Requirements

### Requirement: Course registry supports intermediate-level courses
The course-list.json file SHALL support adding intermediate-level courses with extended metadata including course ID, content directory, and status flags (online, test).

#### Scenario: Add intermediate course to registry
- **WHEN** a new course entry is added to courses/course-list.json with id "mgcp-intermediate-201"
- **THEN** the system SHALL recognize the course as available for enrollment
- **AND** the course SHALL be marked with status flags for online and test availability

### Requirement: Course metadata supports extended container times
The course-content.json file SHALL support specifying container_live_time field with values up to 180 minutes for intermediate-level courses requiring longer experiment durations.

#### Scenario: Configure 180-minute container time
- **WHEN** course-content.json specifies container_live_time as "180"
- **THEN** the system SHALL provision a container with a 180-minute timeout
- **AND** the container SHALL remain active for the full duration unless manually terminated

### Requirement: Course metadata supports mixed exam types
The course-content.json file SHALL support defining exam configuration with type "mixed", duration in minutes, and pass_score percentage.

#### Scenario: Configure mixed exam
- **WHEN** course-content.json includes exam.type as "mixed", exam.duration as "90", and exam.pass_score as "85"
- **THEN** the system SHALL create an exam structure supporting both written and practical components
- **AND** the exam SHALL enforce a 90-minute time limit
- **AND** the system SHALL require a minimum score of 85% to pass

### Requirement: Course metadata supports chapter-based structure
The course-content.json file SHALL support defining multiple chapters, each with content_dir, title, description, and estimated_time fields.

#### Scenario: Define 6 chapters in course metadata
- **WHEN** course-content.json defines chapters array with 6 chapter entries
- **THEN** each chapter SHALL have a unique content_dir identifier
- **AND** each chapter SHALL include title, description, and estimated_time fields
- **AND** the system SHALL render chapters in the order specified in the array
