## Context

### Background

The current MGCA (7 chapters) and MGCP-Intermediate-201 (6 chapters) courses use a monolithic structure where each chapter is a subdirectory within a single course directory (e.g., `mgca/courses/architecture/`). This structure differs from the reference OpenGauss course structure, which uses a modular course package pattern where each chapter is an independent course (e.g., `opengauss/courses/openGauss-101/`, `opengauss/courses/git-101/`).

### Current State

- **MGCA**: `courses/mgca/course-content.json` defines 7 chapters, each implemented as a subdirectory in `courses/mgca/courses/` with `course-list.json` pointing to "." (monolithic course)
- **MGCP-Intermediate-201**: `courses/mgcp-intermediate-201/course-content.json` defines 6 chapters, each implemented as a subdirectory in `courses/mgcp-intermediate-201/courses/` with `course-list.json` pointing to "." (monolithic course)
- **OpenGauss**: Uses modular structure with `courses/opengauss/courses/course-list.json` listing multiple independent courses (openGauss-101, git-101, mgca, create-courses-101, etc.)

### Constraints

- Must not break existing OpenGauss modular course structure
- Need to determine backward compatibility requirements for MGCA/MGCP enrollments and progress
- Frontend implementation for course packages vs. individual courses needs verification
- Documentation updates required for instructor/learner guides

### Stakeholders

- Content creators: Benefit from modular, reusable course structure
- Learners: Can enroll in individual courses or complete full certification package
- Platform maintainers: Standardized course structure reduces complexity

## Goals / Non-Goals

**Goals:**
- Restructure MGCA and MGCP-Intermediate-201 to match OpenGauss modular course package structure
- Enable each chapter to be an independent, enrollable course
- Standardize course hierarchy across all course packages
- Support both individual course enrollment and full package completion

**Non-Goals:**
- Redesign the frontend course loading mechanism (verify compatibility only)
- Modify course content (step files, labs, etc.) - only structural changes
- Implement new progress tracking features
- Create automated migration tooling for existing enrollments (manual reset acceptable)

## Decisions

### 1. Directory Naming Convention

**Decision:** Use prefixed names for independent courses (e.g., `mgca-architecture`, `mgcp-ecosystem-architecture`)

**Rationale:**
- Prefixes clearly identify the course package membership
- Maintains uniqueness across course packages (prevents naming conflicts if other packages add similar topics)
- Aligns with the proposal's mapping and maintains semantic clarity

**Alternatives considered:**
- Keep original names (e.g., `architecture`, `ecosystem-and-architecture`): Rejected due to potential naming conflicts between course packages
- Use numeric suffixes (e.g., `architecture-1`, `architecture-2`): Rejected due to lack of semantic meaning

### 2. Course-Content.json Transformation

**Decision:** Keep `course-content.json` at the package level as a catalog/overview, not as course metadata

**Rationale:**
- Preserves the existing file for backward compatibility with tools that may reference it
- Serves as a package overview showing all available courses in the certification path
- Independent courses will have their own `course-content.json` files (if needed) or can use the package-level file for shared metadata

**Alternatives considered:**
- Delete `course-content.json`: Rejected to avoid breaking potential dependencies
- Split into individual course metadata files: Rejected - adds unnecessary duplication

### 3. Backward Compatibility for Enrollments

**Decision:** Reset/reinitialize existing enrollment progress (no migration)

**Rationale:**
- The structural change makes progress migration complex (old chapter paths vs. new course paths)
- Enrollment data is likely in early stages (MGCA/MGCP courses appear to be newly created based on directory structure)
- Simplifies implementation and reduces risk of corrupted progress data

**Alternatives considered:**
- Migrate progress data mapping old chapters to new courses: Rejected due to complexity and error risk
- Maintain dual structure temporarily: Rejected - adds technical debt and maintenance burden

### 4. Course-List.json Structure

**Decision:** Update `course-list.json` to list all independent courses with appropriate IDs and status flags

**Rationale:**
- Matches the OpenGauss course package pattern
- Allows frontend to discover and render all available courses
- Enables granular control over course availability (online/test flags)

**Alternatives considered:**
- Keep single course entry with "package" type: Rejected - diverges from established pattern

### 5. Documentation Approach

**Decision:** Update all references in documentation files (INSTRUCTOR_GUIDE.md, LEARNER_GUIDE.md, README.md, etc.) to reflect new structure

**Rationale:**
- Ensures documentation consistency with the new course structure
- Prevents confusion for instructors and learners using outdated paths/references
- One-time effort to bring documentation up to standard

**Alternatives considered:**
- Leave documentation as-is and add migration notes: Rejected - creates ongoing confusion and maintenance burden

## Risks / Trade-offs

### Risk 1: Frontend Compatibility Issues

**Description:** The frontend may not support course packages with multiple independent courses, causing enrollment or progress tracking issues.

**Mitigation:**
- Review existing frontend code for course loading logic before restructuring
- Test with one course package (e.g., MGCA) before restructuring the second (MGCP)
- Be prepared to implement minor frontend adjustments if needed

### Risk 2: Existing Enrollments Lost

**Description:** Learners who started MGCA/MGCP courses will lose progress due to enrollment reset.

**Mitigation:**
- If enrollments exist, communicate with affected learners about the restructuring
- Provide option to restart courses with new structure
- Document this as a known limitation in release notes

### Risk 3: Asset and Environment Reference Issues

**Description:** Course content (step files, labs) may reference assets or environment templates using relative paths that break after restructuring.

**Mitigation:**
- Verify asset paths in course content (e.g., `./assets/`, `../environments/`)
- Use absolute paths from package root if needed (e.g., `../../assets/`)
- Test lab environments after restructuring

### Risk 4: Exam Configuration Migration

**Description:** Exam questions in `exams/exam-questions.json` may reference specific chapters or lab IDs that no longer exist after restructuring.

**Mitigation:**
- Review exam question metadata for chapter/lab references
- Update exam configuration to reference new course IDs if needed
- Test exam functionality after restructuring

## Migration Plan

### Phase 1: Pre-Migration Validation (Verification Only)
1. Review frontend course loading logic to understand current implementation
2. Identify any hardcoded references to MGCA/MGCP course structure in code
3. Check for existing enrollment data (database, localStorage, etc.) and assess impact
4. Create backup of current MGCA and MGCP directories

### Phase 2: MGCA Restructuring
1. Create new independent course directories with prefixed names:
   - `mgca/courses/mgca-architecture/`
   - `mgca/courses/mgca-installation/`
   - `mgca/courses/mgca-sql-development/`
   - `mgca/courses/mgca-performance-tuning/`
   - `mgca/courses/mgca-backup-recovery/`
   - `mgca/courses/mgca-high-availability/`
   - `mgca/courses/mgca-security/`
2. Move content from old directories to new directories (preserve all files: intro.md, step*.md, finish.md, index.json, lab*.md, assets/)
3. Update each new course's `index.json` with appropriate course metadata (title, description, etc.)
4. Create `course-content.json` for each independent course (or reference package-level metadata)
5. Update `mgca/courses/course-list.json` to list all 7 independent courses with IDs 1-7
6. Keep `mgca/course-content.json` as package catalog/overview (update references if needed)
7. Delete old chapter directories after migration verification

### Phase 3: MGCP-Intermediate-201 Restructuring
1. Repeat steps from Phase 2 for MGCP-Intermediate-201 with 6 independent courses:
   - `mgcp-ecosystem-architecture/`
   - `mgcp-maintenance-data/`
   - `mgcp-features-security/`
   - `mgcp-performance-sql/`
   - `mgcp-backup-ha/`
   - `mgcp-management-tools/`
2. Update `mgcp-intermediate-201/courses/course-list.json` to list all 6 independent courses

### Phase 4: Documentation Updates
1. Update `courses/mgca/README.md`, `INSTRUCTOR_GUIDE.md`, `LEARNER_GUIDE.md` with new structure references
2. Update `courses/mgcp-intermediate-201/README.md` with new structure references
3. Update any cross-references in OpenGauss documentation if needed

### Phase 5: Testing and Verification
1. Test frontend course loading for both course packages
2. Verify enrollment works for individual courses
3. Test course navigation and progress tracking
4. Verify exam functionality if applicable
5. Test lab environments and asset loading

### Rollback Strategy

If critical issues arise after restructuring:
1. Restore from backup of original MGCA and MGCP directories
2. Revert course-list.json and course-content.json changes
3. Communication plan for affected learners (if any enrollments were created)

**Rollback triggers:**
- Frontend fails to load courses after restructuring
- Learners unable to enroll or complete courses
- Exam or lab functionality broken

## Open Questions

1. **Frontend course loading implementation:** Does the existing frontend support course packages with multiple independent courses, or will code changes be required?
   - *Action:* Review frontend course loading logic before implementation

2. **Enrollment data location and format:** Where is enrollment and progress data stored (database, localStorage, etc.)?
   - *Action:* Investigate current tracking implementation to assess migration impact

3. **Exam question metadata:** Do exam questions reference specific chapter IDs or lab IDs that will change?
   - *Action:* Review `exams/exam-questions.json` for dependencies on old structure

4. **Asset and environment reference patterns:** Do course content files use relative paths that assume specific directory structure?
   - *Action:* Audit step files and lab files for asset/environment references

5. **Cross-package course references:** Are there any cross-references between MGCA, MGCP, and OpenGauss courses that will break?
   - *Action:* Search codebase for hardcoded path references to these course directories
