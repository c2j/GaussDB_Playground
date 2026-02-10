## 1. Pre-Migration Validation

- [x] 1.1 Review frontend course loading logic to understand current implementation
- [x] 1.2 Identify any hardcoded references to MGCA/MGCP course structure in code
- [x] 1.3 Check for existing enrollment data (database, localStorage, etc.) and assess impact
- [x] 1.4 Create backup of current MGCA directory (`courses/mgca/`)
- [x] 1.5 Create backup of current MGCP-Intermediate-201 directory (`courses/mgcp-intermediate-201/`)

## 2. MGCA Restructuring

- [x] 2.1 Create `mgca/courses/mgca-architecture/` directory
- [x] 2.2 Create `mgca/courses/mgca-installation/` directory
- [x] 2.3 Create `mgca/courses/mgca-sql-development/` directory
- [x] 2.4 Create `mgca/courses/mgca-performance-tuning/` directory
- [x] 2.5 Create `mgca/courses/mgca-backup-recovery/` directory
- [x] 2.6 Create `mgca/courses/mgca-high-availability/` directory
- [x] 2.7 Create `mgca/courses/mgca-security/` directory
- [x] 2.8 Move all content from `mgca/courses/architecture/` to `mgca/courses/mgca-architecture/` (intro.md, step*.md, finish.md, index.json, lab*.md, assets/)
- [x] 2.9 Move all content from `mgca/courses/installation/` to `mgca/courses/mgca-installation/`
- [x] 2.10 Move all content from `mgca/courses/sql-development/` to `mgca/courses/mgca-sql-development/`
- [x] 2.11 Move all content from `mgca/courses/performance-tuning/` to `mgca/courses/mgca-performance-tuning/`
- [x] 2.12 Move all content from `mgca/courses/backup-recovery/` to `mgca/courses/mgca-backup-recovery/`
- [x] 2.13 Move all content from `mgca/courses/high-availability/` to `mgca/courses/mgca-high-availability/`
- [x] 2.14 Move all content from `mgca/courses/security/` to `mgca/courses/mgca-security/`
- [x] 2.15 Update `mgca/courses/mgca-architecture/index.json` with course metadata
- [x] 2.16 Update `mgca/courses/mgca-installation/index.json` with course metadata
- [x] 2.17 Update `mgca/courses/mgca-sql-development/index.json` with course metadata
- [x] 2.18 Update `mgca/courses/mgca-performance-tuning/index.json` with course metadata
- [x] 2.19 Update `mgca/courses/mgca-backup-recovery/index.json` with course metadata
- [x] 2.20 Update `mgca/courses/mgca-high-availability/index.json` with course metadata
- [x] 2.21 Update `mgca/courses/mgca-security/index.json` with course metadata
- [x] 2.22 Create `mgca/courses/mgca-architecture/course-content.json` with course-specific metadata (optional)
- [x] 2.23 Create `mgca/courses/mgca-installation/course-content.json` with course-specific metadata (optional)
- [x] 2.24 Create `mgca/courses/mgca-sql-development/course-content.json` with course-specific metadata (optional)
- [x] 2.25 Create `mgca/courses/mgca-performance-tuning/course-content.json` with course-specific metadata (optional)
- [x] 2.26 Create `mgca/courses/mgca-backup-recovery/course-content.json` with course-specific metadata (optional)
- [x] 2.27 Create `mgca/courses/mgca-high-availability/course-content.json` with course-specific metadata (optional)
- [x] 2.28 Create `mgca/courses/mgca-security/course-content.json` with course-specific metadata (optional)
- [x] 2.29 Update `mgca/courses/course-list.json` to list 7 independent courses with IDs 1-7 and status flags
- [x] 2.30 Verify asset paths in MGCA course content are correct (check for relative path references)
- [x] 2.31 Update `mgca/course-content.json` to serve as package catalog/overview (if needed)
- [x] 2.32 Delete old `mgca/courses/architecture/` directory after verification
- [x] 2.33 Delete old `mgca/courses/installation/` directory after verification
- [x] 2.34 Delete old `mgca/courses/sql-development/` directory after verification
- [x] 2.35 Delete old `mgca/courses/performance-tuning/` directory after verification
- [x] 2.36 Delete old `mgca/courses/backup-recovery/` directory after verification
- [x] 2.37 Delete old `mgca/courses/high-availability/` directory after verification
- [x] 2.38 Delete old `mgca/courses/security/` directory after verification

## 3. MGCP-Intermediate-201 Restructuring

- [x] 3.1 Create `mgcp-intermediate-201/courses/mgcp-ecosystem-architecture/` directory
- [x] 3.2 Create `mgcp-intermediate-201/courses/mgcp-maintenance-data/` directory
- [x] 3.3 Create `mgcp-intermediate-201/courses/mgcp-features-security/` directory
- [x] 3.4 Create `mgcp-intermediate-201/courses/mgcp-performance-sql/` directory
- [x] 3.5 Create `mgcp-intermediate-201/courses/mgcp-backup-ha/` directory
- [x] 3.6 Create `mgcp-intermediate-201/courses/mgcp-management-tools/` directory
- [x] 3.7 Move all content from `mgcp-intermediate-201/courses/ecosystem-and-architecture/` to `mgcp-intermediate-201/courses/mgcp-ecosystem-architecture/`
- [x] 3.8 Move all content from `mgcp-intermediate-201/courses/maintenance-and-data-management/` to `mgcp-intermediate-201/courses/mgcp-maintenance-data/`
- [x] 3.9 Move all content from `mgcp-intermediate-201/courses/features-and-security/` to `mgcp-intermediate-201/courses/mgcp-features-security/`
- [x] 3.10 Move all content from `mgcp-intermediate-201/courses/performance-and-advanced-sql/` to `mgcp-intermediate-201/courses/mgcp-performance-sql/`
- [x] 3.11 Move all content from `mgcp-intermediate-201/courses/backup-recovery-and-ha/` to `mgcp-intermediate-201/courses/mgcp-backup-ha/`
- [x] 3.12 Move all content from `mgcp-intermediate-201/courses/management-tools-and-case/` to `mgcp-intermediate-201/courses/mgcp-management-tools/`
- [x] 3.13 Update `mgcp-intermediate-201/courses/mgcp-ecosystem-architecture/index.json` with course metadata
- [x] 3.14 Update `mgcp-intermediate-201/courses/mgcp-maintenance-data/index.json` with course metadata
- [x] 3.15 Update `mgcp-intermediate-201/courses/mgcp-features-security/index.json` with course metadata
- [x] 3.16 Update `mgcp-intermediate-201/courses/mgcp-performance-sql/index.json` with course metadata
- [x] 3.17 Update `mgcp-intermediate-201/courses/mgcp-backup-ha/index.json` with course metadata
- [x] 3.18 Update `mgcp-intermediate-201/courses/mgcp-management-tools/index.json` with course metadata
- [x] 3.19 Create `mgcp-intermediate-201/courses/mgcp-ecosystem-architecture/course-content.json` with course-specific metadata (optional)
- [x] 3.20 Create `mgcp-intermediate-201/courses/mgcp-maintenance-data/course-content.json` with course-specific metadata (optional)
- [x] 3.21 Create `mgcp-intermediate-201/courses/mgcp-features-security/course-content.json` with course-specific metadata (optional)
- [x] 3.22 Create `mgcp-intermediate-201/courses/mgcp-performance-sql/course-content.json` with course-specific metadata (optional)
- [x] 3.23 Create `mgcp-intermediate-201/courses/mgcp-backup-ha/course-content.json` with course-specific metadata (optional)
- [x] 3.24 Create `mgcp-intermediate-201/courses/mgcp-management-tools/course-content.json` with course-specific metadata (optional)
- [x] 3.25 Update `mgcp-intermediate-201/courses/course-list.json` to list 6 independent courses with IDs 1-6 and status flags
- [x] 3.26 Verify asset paths in MGCP course content are correct (check for relative path references)
- [x] 3.27 Update `mgcp-intermediate-201/course-content.json` to serve as package catalog/overview (if needed)
- [x] 3.28 Delete old `mgcp-intermediate-201/courses/ecosystem-and-architecture/` directory after verification
- [x] 3.29 Delete old `mgcp-intermediate-201/courses/maintenance-and-data-management/` directory after verification
- [x] 3.30 Delete old `mgcp-intermediate-201/courses/features-and-security/` directory after verification
- [x] 3.31 Delete old `mgcp-intermediate-201/courses/performance-and-advanced-sql/` directory after verification
- [x] 3.32 Delete old `mgcp-intermediate-201/courses/backup-recovery-and-ha/` directory after verification
- [x] 3.33 Delete old `mgcp-intermediate-201/courses/management-tools-and-case/` directory after verification
- [x] 3.34 Review and update `mgcp-intermediate-201/exams/exam-questions.json` for any chapter/lab references that need updating

## 4. Documentation Updates

- [x] 4.1 Update `courses/mgca/README.md` to reflect new modular course package structure
- [x] 4.2 Update `courses/mgca/INSTRUCTOR_GUIDE.md` to reflect new independent course paths
- [x] 4.3 Update `courses/mgca/LEARNER_GUIDE.md` to reflect new independent course paths
- [x] 4.4 Update `courses/mgca/TROUBLESHOOTING.md` to reflect new structure (if needed)
- [x] 4.5 Update `courses/mgcp-intermediate-201/README.md` to reflect new modular course package structure
- [x] 4.6 Update `courses/mgcp-intermediate-201/DOCUMENTATION.md` to reflect new independent course paths (if needed)
- [x] 4.7 Update `courses/mgcp-intermediate-201/IMPLEMENTATION_SUMMARY.md` to reflect new structure (if needed)
- [x] 4.8 Update `courses/mgcp-intermediate-201/TESTING.md` to reflect new structure (if needed)
- [x] 4.9 Search for and update any cross-references to MGCA/MGCP course structure in OpenGauss documentation
- [x] 4.10 Create release notes documenting the restructuring and breaking changes

## 5. Testing and Verification

- [ ] 5.1 Test frontend course loading for MGCA package catalog display
- [ ] 5.2 Test frontend course loading for MGCP-Intermediate-201 package catalog display
- [ ] 5.3 Verify enrollment works for individual MGCA courses (test with at least 2 courses)
- [ ] 5.4 Verify enrollment works for individual MGCP courses (test with at least 2 courses)
- [ ] 5.5 Test course navigation for MGCA courses (intro → steps → finish)
- [ ] 5.6 Test course navigation for MGCP courses (intro → steps → finish)
- [ ] 5.7 Verify progress tracking works independently for each MGCA course
- [ ] 5.8 Verify progress tracking works independently for each MGCP course
- [ ] 5.9 Test package completion tracking for MGCA (verify progress display as X/7 courses completed)
- [ ] 5.10 Test package completion tracking for MGCP (verify progress display as X/6 courses completed)
- [ ] 5.11 Verify lab environments work correctly after restructuring (test MGCA labs)
- [ ] 5.12 Verify lab environments work correctly after restructuring (test MGCP labs)
- [ ] 5.13 Verify asset loading works correctly for MGCA courses
- [ ] 5.14 Verify asset loading works correctly for MGCP courses
- [ ] 5.15 Test exam functionality for MGCA (if exams are configured)
- [ ] 5.16 Test exam functionality for MGCP-Intermediate-201 (if exams are configured)
- [ ] 5.17 Verify backward compatibility with OpenGauss-101 monolithic course structure
- [ ] 5.18 Verify backward compatibility with Git-101 monolithic course structure
- [ ] 5.19 Perform smoke test: Enroll in and complete one MGCA course from start to finish
- [ ] 5.20 Perform smoke test: Enroll in and complete one MGCP course from start to finish

## 6. Rollback Preparation

- [x] 6.1 Document rollback procedure in case of critical issues
- [x] 6.2 Verify backup files are intact and can be restored if needed
- [x] 6.3 Define rollback trigger conditions (frontend failure, enrollment issues, exam/lab broken)
- [x] 6.4 Prepare communication plan for affected learners (if any enrollments were created before restructuring)
