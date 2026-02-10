## Why

The current MGCA and MGCP-Intermediate-201 courses use a monolithic structure where chapters are nested within a single course directory, which doesn't align with the reference OpenGauss course structure. This inconsistency creates maintenance complexity and limits modularity. Restructuring to the modular course package pattern will improve scalability, allow individual chapter-based courses to be reused independently, and standardize the course hierarchy across the platform.

## What Changes

- **Restructure MGCA course package**: Break apart the monolithic `courses/mgca/courses/` structure into modular independent courses
  - Move `mgca/courses/architecture/` → `mgca/courses/mgca-architecture/` (independent course)
  - Move `mgca/courses/installation/` → `mgca/courses/mgca-installation/` (independent course)
  - Move `mgca/courses/sql-development/` → `mgca/courses/mgca-sql-development/` (independent course)
  - Move `mgca/courses/performance-tuning/` → `mgca/courses/mgca-performance-tuning/` (independent course)
  - Move `mgca/courses/backup-recovery/` → `mgca/courses/mgca-backup-recovery/` (independent course)
  - Move `mgca/courses/high-availability/` → `mgca/courses/mgca-high-availability/` (independent course)
  - Move `mgca/courses/security/` → `mgca/courses/mgca-security/` (independent course)
  - Update `mgca/courses/course-list.json` to list all 7 independent courses
  - Convert `mgca/course-content.json` from a course metadata to a course package catalog (optional, or keep as course package overview)

- **Restructure MGCP-Intermediate-201 course package**: Break apart the monolithic `courses/mgcp-intermediate-201/courses/` structure into modular independent courses
  - Move `mgcp-intermediate-201/courses/ecosystem-and-architecture/` → `mgcp-intermediate-201/courses/mgcp-ecosystem-architecture/` (independent course)
  - Move `mgcp-intermediate-201/courses/maintenance-and-data-management/` → `mgcp-intermediate-201/courses/mgcp-maintenance-data/` (independent course)
  - Move `mgcp-intermediate-201/courses/features-and-security/` → `mgcp-intermediate-201/courses/mgcp-features-security/` (independent course)
  - Move `mgcp-intermediate-201/courses/performance-and-advanced-sql/` → `mgcp-intermediate-201/courses/mgcp-performance-sql/` (independent course)
  - Move `mgcp-intermediate-201/courses/backup-recovery-and-ha/` → `mgcp-intermediate-201/courses/mgcp-backup-ha/` (independent course)
  - Move `mgcp-intermediate-201/courses/management-tools-and-case/` → `mgcp-intermediate-201/courses/mgcp-management-tools/` (independent course)
  - Update `mgcp-intermediate-201/courses/course-list.json` to list all 6 independent courses
  - Convert `mgcp-intermediate-201/course-content.json` from a course metadata to a course package catalog (optional, or keep as course package overview)

- **BREAKING**: Any references to course chapters using the old structure (e.g., `mgca/courses/architecture/step1.md`) will need to be updated to the new independent course paths

## Capabilities

### New Capabilities
- `modular-course-package`: Define the structure and behavior of course packages containing multiple independent courses, including course-list.json format, course package metadata, and how individual courses can be enrolled in and completed independently or as part of a package

### Modified Capabilities
- `mgcp-course-management`: Update requirements to support both monolithic course structures (for backward compatibility) and modular course package structures with independent courses

## Impact

- **Course directories**: Restructure directory hierarchy for `courses/mgca/courses/` and `courses/mgcp-intermediate-201/courses/`
- **Course-list.json files**: Update to list multiple independent courses instead of a single monolithic course
- **Course-content.json files**: Convert from course metadata to course package catalog/overview
- **Frontend course loading**: May need updates to handle course packages vs. individual courses (verify existing implementation)
- **Existing enrollments/progress**: Any user progress tracking tied to the old structure will need migration or reset (verify current tracking implementation)
- **Documentation**: Update MGCA/MGCP instructor guides, learner guides, and any other documentation referencing the course structure
