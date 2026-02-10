## ADDED Requirements

### Requirement: Course package contains multiple independent courses
The course-list.json file at the package level SHALL support listing multiple independent courses, each with a unique id, content_dir, and status flags. Each course in the list SHALL be enrollable and completable independently.

#### Scenario: List 7 independent courses in MGCA package
- **WHEN** mgca/courses/course-list.json contains 7 course entries with ids "1" through "7"
- **THEN** each course SHALL have a unique content_dir value corresponding to an independent course directory
- **AND** each course SHALL include status flags for availability (online, test)
- **AND** the system SHALL allow learners to enroll in any individual course from the list

#### Scenario: List 6 independent courses in MGCP-Intermediate-201 package
- **WHEN** mgcp-intermediate-201/courses/course-list.json contains 6 course entries with ids "1" through "6"
- **THEN** each course SHALL have a unique content_dir value corresponding to an independent course directory
- **AND** each course SHALL include status flags for availability (online, test)
- **AND** the system SHALL allow learners to enroll in any individual course from the list

### Requirement: Course package catalog metadata
The course-content.json file at the package level SHALL serve as a catalog/overview, listing all available courses in the certification path with titles, descriptions, and estimated times, without defining chapter-based course structure internally.

#### Scenario: Display MGCA course package catalog
- **WHEN** the system loads mgca/course-content.json
- **THEN** the content SHALL include package-level metadata (title, description, logo, poster, cover)
- **AND** the content SHALL list all 7 independent courses with their titles, descriptions, and estimated times
- **AND** the system SHALL render this as a catalog/overview rather than a single course with chapters

#### Scenario: Display MGCP-Intermediate-201 course package catalog
- **WHEN** the system loads mgcp-intermediate-201/course-content.json
- **THEN** the content SHALL include package-level metadata (title, description, logo, poster, cover)
- **AND** the content SHALL list all 6 independent courses with their titles, descriptions, and estimated times
- **AND** the system SHALL render this as a catalog/overview rather than a single course with chapters

### Requirement: Independent course enrollment and progress
Each course listed in the package's course-list.json SHALL be independently enrollable and completable, with separate progress tracking. Completion of individual courses SHALL be tracked independently from other courses in the package.

#### Scenario: Enroll in single MGCA course
- **WHEN** a learner enrolls in "mgca-architecture" course from the MGCA package
- **THEN** the system SHALL create a separate enrollment record for this specific course
- **AND** the learner's progress in "mgca-architecture" SHALL NOT affect progress in other MGCA courses
- **AND** the system SHALL track completion status independently for each course

#### Scenario: Complete individual MGCP course
- **WHEN** a learner completes all steps and finish.md in "mgcp-ecosystem-architecture"
- **THEN** the system SHALL mark this specific course as completed
- **AND** the learner SHALL still be able to enroll in and complete other MGCP courses
- **AND** the package catalog SHALL display the completed course with a completion indicator

### Requirement: Course package completion tracking
The system SHALL track overall completion status for a course package based on completion of all individual courses in the package. When all courses in a package are completed, the package SHALL be marked as fully completed.

#### Scenario: Track MGCA package completion progress
- **WHEN** a learner completes 3 out of 7 MGCA courses
- **THEN** the system SHALL display overall package progress as 3/7 courses completed
- **AND** the package completion status SHALL remain incomplete until all 7 courses are finished
- **WHEN** all 7 courses are completed
- **THEN** the system SHALL mark the MGCA package as fully completed

#### Scenario: Track MGCP-Intermediate-201 package completion progress
- **WHEN** a learner completes 6 out of 6 MGCP courses
- **THEN** the system SHALL display overall package progress as 6/6 courses completed
- **AND** the system SHALL mark the MGCP-Intermediate-201 package as fully completed
- **AND** the learner SHALL be eligible for certification based on package completion

### Requirement: Independent course directory structure
Each independent course in a package SHALL have its own course directory containing all course content files (intro.md, step*.md, finish.md, index.json, assets/) and optionally its own course-content.json for course-specific metadata.

#### Scenario: Access independent course content
- **WHEN** a learner navigates to "mgca-architecture" course
- **THEN** the system SHALL load content from mgca/courses/mgca-architecture/
- **AND** the system SHALL load course metadata from mgca/courses/mgca-architecture/index.json
- **AND** the system SHALL display course-specific assets from mgca/courses/mgca-architecture/assets/

#### Scenario: Load course-specific metadata
- **WHEN** a learner views "mgcp-maintenance-data" course details
- **THEN** the system SHALL load course-specific metadata from mgcp-intermediate-201/courses/mgcp-maintenance-data/index.json
- **AND** if mgcp-intermediate-201/courses/mgcp-maintenance-data/course-content.json exists
- **THEN** the system SHALL load course-specific content from that file
- **OR** the system SHALL use package-level metadata as a fallback

### Requirement: Backward compatibility with monolithic course structure
The system SHALL continue to support monolithic course structures where course-list.json contains a single entry with content_dir pointing to "." (current directory), ensuring existing courses like OpenGauss-101 and Git-101 continue to function.

#### Scenario: Load monolithic OpenGauss-101 course
- **WHEN** the system loads opengauss/courses/openGauss-101/index.json
- **AND** opengauss/courses/course-list.json contains an entry with content_dir "openGauss-101"
- **THEN** the system SHALL treat this as a monolithic course structure
- **AND** the system SHALL load course content from opengauss/courses/openGauss-101/
- **AND** the system SHALL NOT require multiple independent courses for this entry

#### Scenario: Load monolithic Git-101 course
- **WHEN** the system loads opengauss/courses/git-101/index.json
- **AND** opengauss/courses/course-list.json contains an entry with content_dir "git-101"
- **THEN** the system SHALL treat this as a monolithic course structure
- **AND** the system SHALL load course content from opengauss/courses/git-101/
- **AND** the system SHALL NOT require multiple independent courses for this entry
