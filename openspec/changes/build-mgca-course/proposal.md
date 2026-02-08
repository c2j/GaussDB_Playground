## Why

The current openGauss course (openGauss-101) is too basic and elementary, covering only introductory concepts. There is a need for a comprehensive GaussDB course that prepares learners for the MGCA Primary certification and Huawei Cloud O&M certification, going beyond basic SQL operations to include advanced topics like architecture, performance optimization, high availability, and enterprise-grade operations.

## What Changes

- Create a new comprehensive GaussDB course directory at `courses/mgca/`
- Develop a complete curriculum following the course development framework in `courses/课程建设思路指南.md`
- Implement the four-stage enterprise training approach: theory foundation, beginner training ground, production case analysis + standards, and assessment
- Build multiple course modules covering architecture, installation, SQL development, performance tuning, backup/recovery, high availability, and security
- Create exam framework with written and practical assessments
- Design interactive labs with real-world enterprise scenarios

## Capabilities

### New Capabilities

- `mgca-course-structure`: Overall course architecture, directory structure, and module organization for the MGCA certification course
- `mgca-theory-modules`: Theory content modules covering GaussDB architecture, features, installation, configuration, and advanced concepts
- `mgca-practice-labs`: Hands-on lab exercises with interactive commands, sandbox environments, and progressive difficulty levels
- `mgca-exam-assessment`: Exam and assessment framework with question bank, scoring rubrics, and automated grading for both written and practical exams
- `mgca-enterprise-cases`: Real-world enterprise case studies covering production scenarios,故障 analysis, and best practices
- `mgca-training-environment`: Training environment configuration with container images, resource management, and multi-tenant support

### Modified Capabilities

None

## Impact

- Creates new course content in `courses/mgca/` directory
- Follows existing course framework standards (no breaking changes to course-list.json or other courses)
- Integrates with existing openspec/artifact workflow for course development
- Requires new Docker/container images for GaussDB training environments
