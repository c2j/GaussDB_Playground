# CheckList and Verification Components - Implementation Specification

## Overview
Implement CheckList rendering for self-assessment and automated verification logic for command outputs.

## CheckList Component

### Data Structure
```typescript
interface CheckList {
  id: string;
  items: CheckListItem[];
  title?: string;
}

interface CheckListItem {
  id: string;
  text: string;
  completed: boolean;
  required?: boolean;  // Mark essential items
}
```

### Implementation Tasks

**Parser**:
- [ ] Parse CheckList sections from markdown step content
- [ ] Extract checklist items (text, requirements)
- [ ] Handle nested lists and subsections
- [ ] Parse `[ ]` checkbox syntax
- [ ] Support both `- [ ]` and `* [ ]` formats

**Component**:
- [ ] Render interactive checkboxes for each item
- [ ] Persist completion state per learner session
- [ ] Visual indication for required items
- [ ] Show completion progress (e.g., "3/5 completed")
- [ ] Support "Select All" / "Clear All" actions
- [ ] Sync state with backend storage

**Storage**:
- [ ] Implement client-side state persistence (localStorage/sessionStorage)
- [ ] Backup state to backend for cross-session continuity
- [ ] Handle offline scenarios gracefully
- [ ] Support reset functionality for re-attempts

## Verification Component

### Data Structure
```typescript
interface Verification {
  id: string;
  commandOutput: string;
  criteria: VerificationCriteria;
  result: VerificationResult;
}

interface VerificationCriteria {
  type: 'exact_match' | 'partial_match' | 'regex' | 'threshold' | 'exit_code';
  expected?: string | number;
  operator?: '>' | '<' | '=' | '>=' | '<=';
  regex?: string;
  tolerance?: number;
}

interface VerificationResult {
  passed: boolean;
  actualValue?: string | number;
  message: string;
  score?: number;  // 0-100 or null
}
```

### Implementation Tasks

**Validation Engine**:
- [ ] Implement exact_match: Output exactly equals expected string
- [ ] Implement partial_match: Output contains expected substring
- [ ] Implement regex: Output matches regex pattern
- [ ] Implement threshold: Numeric output comparison (e.g., "sync delay < 1s")
- [ ] Implement exit_code: Check command exit status
- [ ] Extract numeric values from output for threshold validation
- [ ] Handle unit conversions (ms, s, min, etc.)

**Scoring Logic**:
```typescript
function calculateVerificationScore(
  actual: number,
  expected: number,
  operator: string,
  tolerance?: number
): number {
  // Example: "sync delay < 1s"
  // If actual = 0.5s → score = 100
  // If actual = 0.9s → score = 100
  // If actual = 1.2s → score = 0 (failed)
  
  switch(operator) {
    case '<':
      return actual < expected ? 100 : 0;
    case '<=':
      return actual <= expected ? 100 : 0;
    // ... other operators
  }
}
```

- [ ] Calculate score based on criteria satisfaction
- [ ] Support partial scoring with tolerance ranges
- [ ] Handle edge cases (null, undefined, NaN)
- [ ] Return score as 0-100 percentage

**Display Component**:
```typescript
interface VerificationDisplayProps {
  criteria: VerificationCriteria;
  result: VerificationResult;
  showDetails?: boolean;
}
```

- [ ] Render criteria description clearly
- [ ] Show pass/fail status with visual indicator (✗/✓)
- [ ] Display score when applicable (e.g., "Score: 100/100")
- [ ] Show actual vs. expected values
- [ ] Provide expandable details section
- [ ] Color-code results (green=pass, red=fail, yellow=partial)

## Integration with Command Execution

### Flow
```
1. Execute [[command]]{{RUN}} with criteria
2. Capture command output
3. Parse criteria from markdown (if defined)
4. Run validation against output
5. Display verification result
6. Update CheckList if verification passes (auto-check)
7. Track overall chapter progress
```

**Tasks**:
- [ ] Link verification to command execution results
- [ ] Auto-update related CheckList items on pass
- [ ] Prevent proceeding until critical verifications pass
- [ ] Show retry button for failed verifications

## Example Use Cases

### Example 1: Simple Exit Code Check
```markdown
[[gs_ctl status -D /data/opengauss/data]]{{RUN}}

**Verification**: Command should succeed with exit code 0
```
Implementation:
- Check exit_code === 0
- Display "✓ Command executed successfully"

### Example 2: Output Match
```markdown
[[select count(*) from test_table;]]{{RUN}}

**Verification**: Should return exactly "1000"
```
Implementation:
- Trim and compare output === "1000"
- Display "✓ Expected: 1000, Actual: 1000"

### Example 3: Threshold Check
```markdown
[[select * from pg_stat_replication;]]{{RUN}}

**Verification**: Sync delay should be < 1 second
```
Implementation:
- Parse numeric value from output (e.g., "0.005")
- Compare: 0.005 < 1.0
- Display "✓ Sync delay: 0.005s (threshold: < 1s) - Score: 100/100"

## State Management

```typescript
interface LearnerProgress {
  chapterId: string;
  stepId: string;
  checklists: Record<string, CheckList>;
  verifications: Record<string, VerificationResult>;
  completedAt?: Date;
}
```

**Tasks**:
- [ ] Implement progress store for CheckList states
- [ ] Implement progress store for verification results
- [ ] Sync with backend on completion
- [ ] Support progress resumption across sessions
- [ ] Export progress for learner review

## Accessibility
- [ ] Keyboard navigation for checkboxes
- [ ] Screen reader support for verification results
- [ ] High contrast for pass/fail indicators
- [ ] Clear focus states for interactive elements
- [ ] Alternative text for status icons

## Testing Checklist
- [ ] Test checkbox state persistence across page reload
- [ ] Test verification with exact match
- [ ] Test verification with regex pattern
- [ ] Test verification with threshold comparison
- [ ] Test auto-CheckList update on verification pass
- [ ] Test offline/online sync behavior
- [ ] Test accessibility features (keyboard, screen reader)
