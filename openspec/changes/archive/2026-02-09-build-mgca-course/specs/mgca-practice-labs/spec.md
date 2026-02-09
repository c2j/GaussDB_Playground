## ADDED Requirements

### Requirement: Hands-on lab exercises
The system SHALL provide interactive lab exercises for each topic module with progressive difficulty levels using container-based sandbox environments.

#### Scenario: Lab exercise structure
- **WHEN** a lab exercise is created
- **THEN** the system includes:
  - Clear task objectives
  - Step-by-step instructions
  - Interactive commands with `[[command]]{{RUN}}` syntax
  - Verification queries to confirm results
  - Estimated completion time
  - Difficulty level indicator (L1-L4)

#### Scenario: Lab progression
- **WHEN** learners complete lab exercises
- **THEN** the system:
  - Increases complexity across exercises
  - Builds on previously learned skills
  - Introduces new concepts progressively
  - Provides immediate feedback on task completion

### Requirement: Sandbox environment isolation
The system SHALL provide isolated container-based sandbox environments for each lab exercise with pre-configured GaussDB instances.

#### Scenario: Environment provisioning
- **WHEN** a learner starts a lab
- **THEN** the system:
  - Provisions a container with specified `backend.image_id`
  - Configures GaussDB instance with required settings
  - Provides database credentials and connection details
  - Sets up initial data or schema as needed

#### Scenario: Environment isolation
- **WHEN** multiple learners use labs simultaneously
- **THEN** the system:
  - Maintains separate containers for each learner
  - Ensures no cross-contamination between instances
  - Supports environment reset and snapshot rollback
  - Manages resource allocation efficiently

### Requirement: Interactive command system
The system SHALL support custom Markdown extensions for executing commands in the lab environment with immediate feedback.

#### Scenario: Command execution
- **WHEN** learner executes `[[command]]{{RUN}}`
- **THEN** the system:
  - Executes the command in the sandbox environment
  - Displays execution output
  - Captures error messages for learning
  - Provides execution time metrics

#### Scenario: Print-only commands
- **WHEN** learner views `[[command]]{{PRINT}}`
- **THEN** the system:
  - Displays the command without executing
  - Shows the command syntax and parameters
  - Explains the command's purpose
  - Provides context for when to use it

### Requirement: Task feedback and verification
The system SHALL provide immediate feedback on task completion with result verification and automated scoring where applicable.

#### Scenario: Result verification
- **WHEN** a learner completes a task step
- **THEN** the system:
  - Executes verification queries
  - Displays expected vs. actual results
  - Provides success/failure indication
  - Shows error details if verification fails

#### Scenario: Automated scoring
- **WHEN** lab exercises support scoring
- **THEN** the system:
  - Calculates correctness percentage
  - Evaluates performance metrics (execution time, resource usage)
  - Provides normative scoring for compliance checks
  - Displays overall lab score

### Requirement: Beginner training ground features
The system SHALL support beginner training ground mode with unlimited retries, snapshot rollback, and fault injection for learning.

#### Scenario: Unlimited retries
- **WHEN** a learner fails a task
- **THEN** the system:
  - Allows unlimited re-attempts
  - Provides hints on failure
  - Maintains progress state
  - Tracks attempts for learning analytics

#### Scenario: Snapshot rollback
- **WHEN** a learner requests environment reset
- **THEN** the system:
  - Reverts environment to initial state or checkpoint
  - Preserves learner progress records
  - Allows selective data rollback
  - Provides multiple checkpoint options

#### Scenario: Fault injection
- **WHEN** advanced labs simulate production issues
- **THEN** the system:
  - Injects controlled faults (e.g., connection drops, slow queries)
  - Provides diagnosis tools
  - Guides troubleshooting process
  - Teaches recovery procedures

### Requirement: Difficulty level progression
The system SHALL implement L1-L4 difficulty levels with clear prerequisites and learning objectives for each level.

#### Scenario: Level definitions
- **WHEN** difficulty levels are assigned
- **THEN** the system defines:
  - L1 (Entry): Basic operations, simple queries, data manipulation
  - L2 (Intermediate): Complex queries, joins, aggregation, functions
  - L3 (Advanced): Performance optimization, indexing, query analysis
  - L4 (Expert): High availability, replication, troubleshooting, production scenarios

#### Scenario: Level prerequisites
- **WHEN** learners attempt higher levels
- **THEN** the system:
  - Checks for completion of previous levels
  - Recommends foundational topics if needed
  - Allows level testing for advanced learners
  - Provides placement assessments

### Requirement: Real-world enterprise scenarios
The system SHALL design lab exercises based on real enterprise scenarios including financial systems, e-commerce, healthcare, and government applications.

#### Scenario: Scenario-based labs
- **WHEN** labs are designed
- **THEN** the system includes:
  - Financial database scenarios (transactions, accounts)
  - E-commerce scenarios (orders, inventory, customers)
  - Healthcare scenarios (patient records, appointments)
  - Government scenarios (public records, services)

#### Scenario: Scenario complexity
- **WHEN** lab scenarios increase in complexity
- **THEN** the system:
  - Starts with simplified versions for beginners
  - Progresses to full-scale scenarios for advanced learners
  - Includes realistic data volumes and constraints
  - Incorporates enterprise requirements (compliance, performance)

### Requirement: Error handling education
The system SHALL demonstrate common errors and their resolutions to help learners troubleshoot issues independently.

#### Scenario: Error demonstration
- **WHEN** teaching error handling
- **THEN** the system:
  - Shows commands that produce specific errors
  - Explains the root cause in detail
  - Provides corrected commands
  - Teaches systematic troubleshooting approach

#### Scenario: Error recovery
- **WHEN** learners encounter errors
- **THEN** the system:
  - Provides context-specific error messages
  - Suggests corrective actions
  - Links to relevant theory sections
  - Enables environment state inspection
