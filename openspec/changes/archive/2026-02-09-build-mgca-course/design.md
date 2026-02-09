## Context

**Background:** The existing openGauss-101 course provides only introductory database concepts and basic SQL operations. It is insufficient for preparing learners for MGCA Primary certification or Huawei Cloud O&M certification, which require deep knowledge of GaussDB architecture, performance tuning, high availability, security, and enterprise operations.

**Current State:**
- `courses/opengauss/` contains a basic openGauss-101 course with simple schema creation and CRUD operations
- Course framework is established in `courses/课程建设思路指南.md` with detailed standards for structure, content, and assessment
- The existing course demonstrates the course-content.json structure, chapter organization, and interactive command system

**Constraints:**
- Must follow the course development framework in `courses/课程建设思路指南.md`
- Must implement the four-stage enterprise training approach: theory foundation (20-25%), beginner training ground (35-40%), production case analysis (25-30%), and assessment (10-15%)
- Course must align with MGCA Primary certification and Huawei Cloud O&M certification objectives
- Must support interactive command execution with custom Markdown extensions
- Must provide container-based lab environments for hands-on practice

**Stakeholders:**
- Learners preparing for MGCA Primary certification
- DBA candidates seeking Huawei Cloud O&M certification
- Enterprise training teams conducting GaussDB internal training
- System administrators managing GaussDB deployments

## Goals / Non-Goals

**Goals:**
- Create a comprehensive GaussDB course covering architecture, installation, SQL development, performance tuning, backup/recovery, high availability, and security
- Implement the enterprise training framework with theory, labs, cases, and assessments
- Build a modular curriculum structure that can be adapted for different certification paths
- Develop interactive lab environments with real-world enterprise scenarios
- Create assessment framework with both written and practical exams
- Support progressive learning paths from beginner to advanced levels

**Non-Goals:**
- Do not create actual certification exams (only prepare learners for them)
- Do not implement real-time multi-user collaborative features (beyond basic grouping)
- Do not provide cloud infrastructure provisioning (use pre-configured container images)
- Do not create custom content authoring tools (use existing Markdown and JSON structure)
- Do not modify the existing openGauss-101 course

## Decisions

**1. Course Architecture: Four-Stage Model**
- **Decision:** Implement the four-stage enterprise training approach (theory → labs → cases → assessment)
- **Rationale:** This approach provides a complete learning loop from concept to practice, ensuring learners can apply knowledge in real scenarios. The theory foundation establishes common understanding, labs build hands-on skills, cases show production applications, and assessments validate competency.
- **Alternatives Considered:**
  - Traditional lecture-lab approach (rejected - lacks production context)
  - Project-based only (rejected - insufficient for certification coverage)

**2. Module Organization: Topic-Based Structure**
- **Decision:** Organize course into independent topic modules (architecture, installation, SQL, performance, backup, HA, security)
- **Rationale:** Allows learners to study topics independently based on their background and certification needs. Modular structure supports flexible learning paths and easier maintenance.
- **Alternatives Considered:**
  - Linear progression only (rejected - too rigid for diverse learners)
  - Difficulty-based organization (rejected - topics don't correlate neatly to difficulty levels)

**3. Lab Environment: Container-Based Sandboxes**
- **Decision:** Use Docker containers with pre-configured GaussDB instances for lab environments
- **Rationale:** Provides isolated, reproducible environments that can be reset easily. Supports multi-tenant scenarios for enterprise training. Aligns with the existing framework's backend.image_id specification.
- **Alternatives Considered:**
  - VM-based environments (rejected - too heavy for quick iteration)
  - Cloud-only provisioning (rejected - adds external dependencies and latency)

**4. Content Format: JSON + Markdown with Custom Extensions**
- **Decision:** Maintain the existing framework using JSON for metadata and Markdown with `[[command]]{{RUN}}` extensions for interactive content
- **Rationale:** Proven by existing courses, separates structure from content, enables custom command execution without proprietary tools. Custom extensions provide the interactive lab experience needed for hands-on learning.
- **Alternatives Considered:**
  - All-in-one custom format (rejected - harder to maintain, requires custom tooling)
  - Pure Markdown (rejected - lacks structured metadata for course management)

**5. Assessment: Mixed Written + Practical Exams**
- **Decision:** Implement both written tests (multiple choice, analysis) and practical exams (hands-on tasks) with automated scoring
- **Rationale:** Certification requires both theoretical knowledge and practical skills. Automated scoring enables scalable assessment for enterprise training. Mixed format validates comprehensive competency.
- **Alternatives Considered:**
  - Written only (rejected - insufficient for practical skills validation)
  - Practical only (rejected - difficult to assess theoretical understanding)

**6. Case Studies: Production-Grade Scenarios**
- **Decision:** Include 8-12 real-world enterprise case studies with detailed故障 analysis and best practice checklists
- **Rationale:** Bridges the gap between theory and production. Case studies provide decision-making context and show how experts handle complex scenarios. Checklists ensure learners follow enterprise standards.
- **Alternatives Considered:**
  - Simplified scenarios (rejected - don't reflect production complexity)
  - No cases, only labs (rejected - lacks production context)

## Risks / Trade-offs

**Risk 1: Course Content Volume**
- **Risk:** Creating a comprehensive course covering all MGCA certification topics may result in overwhelming content volume
- **Mitigation:** Implement progressive learning paths (L1-L4 difficulty levels), allow modular consumption, use estimated time per chapter, and provide guidance on recommended learning sequences

**Risk 2: Container Environment Complexity**
- **Risk:** Advanced topics like HA clusters and distributed architecture require complex multi-node setups that may be difficult to replicate in containers
- **Mitigation:** Use simulated environments for complex scenarios, provide clear guidance on lab limitations, supplement with detailed case studies for production contexts

**Risk 3: Keeping Content Current**
- **Risk:** GaussDB and openGauss evolve rapidly; course content may become outdated
- **Mitigation:** Design modular structure for easy updates, use version-specific container images, document GaussDB version requirements, and establish a review schedule

**Risk 4: Assessment Quality**
- **Risk:** Automated scoring may not adequately assess open-ended problems or complex troubleshooting scenarios
- **Mitigation:** Combine automated scoring with human review for practical exams, provide rubrics for subjective assessment, include partial credit for problem-solving approach

**Trade-off 1: Depth vs. Breadth**
- **Trade-off:** Comprehensive coverage of all topics may sacrifice depth in some areas
- **Decision:** Prioritize certification exam topics, use difficulty levels to signal depth expectations, provide references for advanced topics beyond scope

**Trade-off 2: Interactive vs. Passive Learning**
- **Trade-off:** Too much hands-on work may overwhelm learners with limited technical background
- **Decision:** Balance theory with labs (approximately 60-70% interactive), provide clear step-by-step instructions, include troubleshooting guides

## Migration Plan

**Phase 1: Course Structure Setup (Week 1)**
- Create `courses/mgca/` directory structure following the framework
- Set up `course-content.json` with course metadata and chapter list
- Create `exams/` directory for assessment framework
- Prepare `assets/` directory for logos, posters, and cover images

**Phase 2: Theory Module Development (Week 2-3)**
- Develop theory content for each topic module (architecture, installation, SQL, performance, backup, HA, security)
- Write chapter introduction files (`intro.md`) with learning objectives
- Create step-by-step content files (`stepN.md`) with theoretical concepts
- Implement chapter summaries (`finish.md`) with key takeaways

**Phase 3: Practice Lab Development (Week 4-5)**
- Design lab exercises for each topic module with progressive difficulty
- Implement interactive commands using `[[command]]{{RUN}}` syntax
- Configure lab environments with appropriate `backend.image_id` in `index.json`
- Test all lab exercises for reproducibility and clarity

**Phase 4: Case Study Development (Week 6)**
- Identify and document 8-12 real-world enterprise scenarios
- Write detailed case analyses including problem statement, diagnosis process, and resolution steps
- Create best practice checklists for each case study
- Integrate case studies into relevant modules

**Phase 5: Assessment Development (Week 7)**
- Create exam question bank with written test questions (multiple choice, analysis)
- Develop practical exam tasks with scoring rubrics
- Implement automated grading scripts where possible
- Design exam report templates (PDF/Excel export capability)

**Phase 6: Integration and Testing (Week 8)**
- Register course in `courses/course-list.json`
- Perform end-to-end testing of all modules, labs, and assessments
- Validate container images and environment configurations
- Conduct user acceptance testing with target audience

**Rollback Strategy:**
- Since this is a new course, rollback involves simply removing the `courses/mgca/` directory and any entries in `course-list.json`
- No existing course content or infrastructure is modified, eliminating dependency risks

## Open Questions

1. **GaussDB Version Alignment:** Should the course focus on a specific GaussDB version (e.g., GaussDB 5.0) or provide version-agnostic content where possible?
2. **Certification Exam Details:** Need access to official MGCA Primary certification exam outline and Huawei Cloud O&M exam requirements to ensure alignment
3. **Container Image Sources:** What specific GaussDB Docker images are available for training environments? Are there official images or do we need to build custom ones?
4. **Assessment Automation:** To what extent can practical exams be automatically scored? Are there specific tasks that require human review?
5. **Enterprise Case Sources:** Do we have access to real enterprise case studies from Huawei or partners, or should we create anonymized examples based on common scenarios?
