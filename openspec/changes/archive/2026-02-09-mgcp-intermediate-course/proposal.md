## Why

The existing MGCA beginner course needs to be extended with an intermediate-level (MGCP) certification course to provide a complete training path from entry-level to enterprise DBA skills. This addresses the growing demand for comprehensive openGauss/MogDB training that covers advanced topics like architecture, performance optimization, high availability, and security in enterprise contexts.

## What Changes

- Add new course entry: `mgcp-intermediate-201` to `courses/course-list.json`
- Create course metadata file: `courses/mgcp-intermediate-201/course-content.json` with 6 chapters covering ecosystem/architecture, maintenance/data-management, features/security, performance/advanced-SQL, backup/HA, and management-tools/cases
- Implement chapter-level content structure with progressive steps (intro, multiple steps, finish)
- Add interactive command execution support in content using `[[command]]{{RUN/PRINT}}` syntax
- Create mixed exam system with both written (pen_test) and practical (practice) assessments
- Integrate enterprise financial/banking scenarios throughout content
- Add CheckList and verification components for learning validation

## Capabilities

### New Capabilities

- `mgcp-course-management`: Extended course management supporting intermediate-level courses with longer container times (180min), mixed exam types, and comprehensive metadata
- `chapter-based-learning`: Content structure supporting chapters with progressive step-by-step learning flow (intro → steps → finish)
- `interactive-content-execution`: Ability to embed and execute shell/SQL commands within learning content with verification support
- `mixed-assessment-system`: Exam system supporting both pen_test (multiple-choice, analysis) and practice (task-based with multi-dimensional scoring)
- `enterprise-scenario-integration`: Content framework for integrating real-world scenarios (e.g., financial banking) with context and use cases
- `learning-validation`: CheckList and verification components for self-assessment and automated scoring

### Modified Capabilities

None. This is adding a new course on top of existing capabilities.

## Impact

- Updates course registry to include intermediate-level course
- Extends course content structure to support more complex learning flows
- New exam format requiring mixed assessment scoring engine
- Content rendering must support interactive command execution and verification
- Course delivery must handle extended container times for intermediate-level experiments
