## MODIFIED Requirements

### Requirement: Course metadata supports chapter-based and modular course structures
The course-content.json file SHALL support defining multiple chapters, each with content_dir, title, description, and estimated_time fields for monolithic course structures. Additionally, the course-content.json file SHALL serve as a package catalog/overview for modular course packages, listing independent courses without requiring chapter definitions.

#### Scenario: Define 6 chapters in monolithic course metadata
- **WHEN** course-content.json defines chapters array with 6 chapter entries
- **THEN** each chapter SHALL have a unique content_dir identifier
- **AND** each chapter SHALL include title, description, and estimated_time fields
- **AND** the system SHALL render chapters in the order specified in the array

#### Scenario: Display package catalog for modular course structure
- **WHEN** course-content.json is used as a package catalog (no chapters array defined)
- **THEN** the system SHALL render package-level metadata (title, description, logo, poster, cover)
- **AND** the system SHALL NOT require chapter definitions for course packages
- **AND** the system SHALL use course-list.json to discover independent courses in the package

#### Scenario: Support both course structures concurrently
- **WHEN** the system encounters a course-content.json file with chapters array defined
- **THEN** the system SHALL treat the course as a monolithic structure with chapters
- **WHEN** the system encounters a course-content.json file without chapters array
- **THEN** the system SHALL treat the course-content.json as a package catalog/overview
- **AND** the system SHALL discover courses from the package's course-list.json file
