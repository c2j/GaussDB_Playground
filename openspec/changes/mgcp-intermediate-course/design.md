## Context

The existing MGCA (primary/beginner) course provides a comprehensive introduction to GaussDB/openGauss with 7 chapters covering architecture, installation, SQL development, performance tuning, backup/recovery, high availability, and security. The course follows a structured format with:
- Course metadata (course-content.json) including chapters, container_live_time (120min), and exam configuration
- Chapter directories with index.json, intro.md, stepX.md, and finish.md files
- Mixed exam system with pen_test (written) and practice (practical) assessments
- Lab files for hands-on exercises

This design extends the course system to add a MGCP intermediate-level course that builds upon MGCA foundation with:
- More advanced topics (MogDB ecosystem, deep architecture analysis, maintenance, features, performance, backup/HA, tools)
- Enterprise scenarios (financial/banking context)
- Longer experiment durations (180min vs 120min)
- Interactive command execution syntax
- Enhanced learning validation components

The target audience is enterprise-level DBAs, architects, and optimizers who have completed MGCA and need advanced skills for production environments.

## Goals / Non-Goals

**Goals:**
- Create a complete MGCP intermediate course with 6 chapters covering MogDB ecosystem, architecture, maintenance, features, performance, backup/HA, and management tools
- Implement interactive command execution using [[command]]{{RUN/PRINT}} syntax for hands-on learning
- Integrate enterprise scenarios (banking/financial) throughout content with context and use cases
- Extend exam system with multi-dimensional scoring (correctness, performance, norm, plan) for practical assessments
- Add CheckList and verification components for self-assessment and automated feedback
- Support extended container times (180min) for complex intermediate-level experiments

**Non-Goals:**
- Modifying the existing MGCA course structure or content
- Changing the core course management backend system
- Adding new container runtime capabilities beyond time extension
- Implementing real-time grading infrastructure (manual/expert grading remains)
- Creating separate course enrollment or certification management system

## Decisions

### Directory Structure
Create new course directory `courses/mgcp-intermediate-201/` mirroring MGCA structure:
```
courses/mgcp-intermediate-201/
├── course-content.json          # Course metadata
├── courses/
│   ├── course-list.json         # Course registration (for consistency with MGCA)
│   ├── ecosystem-and-architecture/     # Chapter 1
│   ├── maintenance-and-data-management/ # Chapter 2
│   ├── features-and-security/           # Chapter 3
│   ├── performance-and-advanced-sql/    # Chapter 4
│   ├── backup-recovery-and-ha/          # Chapter 5
│   └── management-tools-and-case/        # Chapter 6
├── exams/
│   └── exam-questions.json    # Mixed exam questions
└── assets/                    # Course images/logos
```

**Rationale:** Mirrors MGCA structure for consistency. Each chapter has self-contained content. Separates exams from content for modularity.

**Alternatives Considered:**
- Single directory for all chapters (rejected - harder to manage multiple chapters)
- Nested chapter structure under courses/courses/ (rejected - adds unnecessary depth)

### Container Time Extension
Set container_live_time to 180 minutes in course-content.json.

**Rationale:** Intermediate experiments (complex HA failover, performance optimization) require longer durations than MGCA's 120min. 180min provides sufficient buffer without excessive resource consumption.

**Alternatives Considered:**
- 240min (rejected - too long, could lead to idle resource waste)
- 150min (rejected - marginal extension insufficient for complex scenarios)

### Interactive Command Syntax
Implement `[[command]]{{RUN}}` and `[[command]]{{PRINT}}` syntax in markdown content.

**Rationale:** RUN executes commands in container for hands-on learning. PRINT displays command text as reference without execution (useful for examples). Double braces prevent conflicts with markdown formatting.

**Alternatives Considered:**
- `{{command}}` single braces (rejected - conflicts with template syntax)
- `[command]` single brackets (rejected - less distinct, conflicts with markdown links)
- Code blocks only (rejected - no execution capability, less interactive)

### Chapter Structure
Each chapter follows intro → stepX → finish flow with:
- intro.md: Chapter overview, learning objectives, expected outcomes
- step1.md, step2.md, etc.: Progressive learning steps with theory, tasks, interactive commands
- finish.md: Summary, self-assessment, next chapter guidance

**Rationale:** Progressive structure builds complexity gradually. Matches adult learning principles (introduce → practice → reflect). Separates concerns (intro sets context, steps deliver content, finish consolidates).

**Alternatives Considered:**
- Single long markdown per chapter (rejected - overwhelming, hard to track progress)
- Lab-focused only (rejected - lacks theoretical foundation)

### Mixed Exam Structure
Extend exam system to support both pen_test and practice in single exam configuration:
```json
{
  "exam": {
    "type": "mixed",
    "duration": "90",
    "pass_score": "85"
  }
}
```
exam-questions.json includes pen_test (single_choice, multiple_choice, analysis) and practice (task-based with scoring).

**Rationale:** Intermediate certification requires both theoretical knowledge (pen_test) and practical skills (practice). Mixed type provides comprehensive assessment. Multi-dimensional scoring (correctness, performance, norm, plan) evaluates quality beyond just correct results.

**Alternatives Considered:**
- Separate written and practical exams (rejected - more complex to administer, inconsistent with industry practice)
- Only practical assessment (rejected - insufficient for theoretical knowledge validation)

### Enterprise Scenario Integration
Embed scenario context and use cases throughout chapters using dedicated sections in markdown.

**Rationale:** Provides real-world relevance. Helps learners connect abstract concepts to production environments. Banking scenarios demonstrate enterprise-grade requirements (RPO=0, RTO<1min, high availability).

**Alternatives Considered:**
- Separate scenario documents (rejected - disconnected from learning content)
- End-of-chapter case studies only (rejected - less integrated with concepts)

### Learning Validation Components
Add CheckList and verification sections in step content:
- CheckList: Checkbox items for self-assessment (understanding, completion)
- Verification: [[command]]{{RUN}} with automated validation against expected results

**Rationale:** Self-assessment promotes metacognition. Automated verification provides immediate feedback. Together they support both reflection and validation.

**Alternatives Considered:**
- Only quizzes at chapter end (rejected - delayed feedback, less granular)
- Instructor-only validation (rejected - not scalable for self-paced learning)

## Risks / Trade-offs

**Risk: Extended container times increase infrastructure costs**
→ Mitigation: Implement auto-termination on inactivity. Monitor usage patterns to optimize time allocation. Consider tiered container times by chapter complexity.

**Risk: Interactive command execution poses security concerns**
→ Mitigation: Execute commands in sandboxed containers with limited privileges. Whitelist allowed command types. Sanitize user inputs. Audit command execution logs.

**Risk: Multi-dimensional scoring requires subjective evaluation**
→ Mitigation: Provide clear rubrics for each dimension. Use automated checks where possible (performance metrics). Train instructors on scoring consistency.

**Risk: Enterprise scenarios may not match all learner backgrounds**
→ Mitigation: Include diverse scenarios across industries (banking, e-commerce, healthcare) in future iterations. Allow learners to substitute scenarios with instructor approval.

**Trade-off: More comprehensive course vs. longer completion time**
→ Acceptable: Intermediate certification is expected to be more time-intensive than beginner. 2-3 hours total aligns with industry standards for intermediate-level training.

**Trade-off: Rich interactivity vs. content authoring complexity**
→ Acceptable: Interactive commands enhance learning outcomes. Authoring complexity can be managed with templates and tooling support.

## Migration Plan

**Deployment Steps:**
1. Create course directory structure and placeholder files
2. Implement course-content.json with 6 chapters and exam configuration
3. Author chapter content (intro, steps, finish) with interactive commands
4. Create exam-questions.json with pen_test and practice sections
5. Test interactive command execution in container environment
6. Validate multi-dimensional scoring for practice tasks
7. Conduct pilot with small learner group for feedback
8. Iterate on content based on pilot results
9. Deploy to production environment

**Rollback Strategy:**
- Remove mgcp-intermediate-201 course directory if critical issues arise
- No changes to MGCA course, so no rollback needed for existing content
- If container time extension causes issues, reduce to 120min temporarily

**Dependencies:**
- Container runtime must support 180min timeout configuration
- Frontend must render [[command]]{{RUN/PRINT}} syntax and execute commands
- Exam system must support mixed type and multi-dimensional scoring
- Course listing page must display new course entry

## Open Questions

1. Should course-list.json be at the root courses/ level or within each course?
   - Current design: within each course (courses/mgca/courses/course-list.json)
   - Alternative: root courses/course-list.json lists all courses
   - Need to clarify based on frontend course loading logic

2. How should automated command validation be implemented?
   - Options: Output matching, return code checking, custom validation scripts
   - Need to define validation criteria format (regex, JSON schema, etc.)

3. Should enterprise scenarios be localizable?
   - Current design: Chinese-language banking scenarios
   - Consider: Multi-language support, industry-agnostic scenarios

4. How to handle command execution failures in learning context?
   - Options: Show error and stop, show error and allow retry, show hints
   - Need to define error handling UX patterns

5. Should multi-dimensional scoring weights be configurable?
   - Current design: Hardcoded in exam-questions.json
   - Consider: Configurable at course or task level
