# Frontend Implementation Specifications

## Overview
This directory contains design specifications and implementation requirements for the frontend components needed to support the MGCP Intermediate Course.

## Components

### 1. Interactive Command Syntax
**File**: `interactive-command-syntax.md`

Implements the `[[command]]{{RUN}}` and `[[command]]{{PRINT}}` syntax for embedding executable commands in course content.

**Key Features**:
- Markdown parser for command syntax
- Command execution engine (container integration)
- Output capture and display
- Validation logic against expected results
- Error handling with troubleshooting suggestions

### 2. CheckList and Verification
**File**: `checklist-verification.md`

Implements interactive checklists for self-assessment and automated verification of command outputs.

**Key Features**:
- Interactive checkbox rendering
- Completion state persistence
- Multi-dimensional validation (exact match, regex, threshold, exit code)
- Auto-scoring with pass/fail feedback
- Integration with command execution results

### 3. Mixed Exam System
**File**: `mixed-exam-system.md`

Extends exam system to support mixed type exams (pen_test + practice) with multi-dimensional scoring.

**Key Features**:
- Pen test rendering (single choice, multiple choice, analysis)
- Practice task submission with file upload
- Multi-dimensional scoring engine (correctness, performance, norm, plan)
- Timer management and auto-submission
- Result display with detailed breakdown

### 4. Progress Tracking
**File**: `progress-tracking.md`

Implements chapter-to-chapter progress tracking with state persistence and resumption.

**Key Features**:
- Sequential step navigation (intro → steps → finish)
- Completion criteria enforcement
- Progress persistence (local + backend sync)
- Time tracking per step
- Progress analytics and reporting

## Implementation Priority

### Phase 1: Core Functionality (High Priority)
1. **Interactive Command Parser** - Required for all content with commands
2. **Basic Command Execution** - Container integration
3. **CheckList Rendering** - Self-assessment capability
4. **Simple Progress Tracking** - Step navigation and state persistence

### Phase 2: Advanced Features (Medium Priority)
1. **Command Validation** - Automated verification and scoring
2. **Exam System Extension** - Mixed type support
3. **Multi-dimensional Scoring** - Practice task grading

### Phase 3: Enhanced Features (Lower Priority)
1. **Progress Analytics** - Learner insights
2. **Advanced Validation** - Regex and threshold criteria
3. **Progress Sharing** - Social and certificates

## Technical Stack

### Recommended Technologies

**Frontend Framework**:
- React 18+ (or Vue 3+)
- TypeScript for type safety
- TailwindCSS for styling

**State Management**:
- Redux Toolkit or Zustand
- React Query for server state

**Markdown Parsing**:
- remark + rehype for custom syntax
- custom plugin for command syntax

**Container Integration**:
- WebSockets or REST API for command execution
- gRPC for performance-critical operations

**Storage**:
- localStorage for immediate state
- IndexedDB for larger data
- Backend sync for cross-session continuity

## API Requirements

### Command Execution
```typescript
POST /api/commands/execute
{
  command: string;
  timeout?: number;
}

Response {
  output: string;
  error?: string;
  exitCode: number;
  executionTime: number;
}
```

### Progress Sync
```typescript
POST /api/progress/sync
{
  courseId: string;
  chapterId: string;
  stepId: string;
  checklists: CheckListState[];
  verifications: VerificationResult[];
}

Response {
  success: boolean;
  mergedState: CourseProgress;
}
```

### Exam Submission
```typescript
POST /api/exams/submit
{
  examId: string;
  pen_test_answers: PenTestAnswer[];
  practice_submissions: PracticeSubmission[];
}

Response {
  success: boolean;
  examResult: ExamGradingResult;
}
```

## Security Considerations

1. **Command Execution**
   - Whitelist allowed commands
   - Sanitize all inputs
   - Execute in isolated containers
   - Limit execution timeout

2. **Progress Data**
   - Encrypt sensitive data at rest
   - Use HTTPS for all API calls
   - Implement CSRF protection
   - Validate ownership of progress data

3. **Exam System**
   - Time limit enforcement server-side
   - Prevent multiple simultaneous sessions
   - Secure file upload (virus scan, size limits)
   - Validate submission authenticity

## Testing Strategy

### Unit Testing
- Parser logic (command syntax, checklist, validation)
- Scoring calculations
- Progress state management
- Timer and countdown logic

### Integration Testing
- Command execution with container runtime
- Progress sync with backend
- Exam submission workflow
- State persistence across page reloads

### E2E Testing
- Complete chapter flow (intro → steps → finish)
- Command execution and verification
- Exam taking flow (pen_test + practice)
- Progress tracking and resumption

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Targets

- Initial page load: < 2 seconds
- Step navigation: < 500ms
- Command execution: < 1s for simple commands
- Progress sync: < 200ms
- Exam submission: < 1s

## Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation for all interactive elements
- Screen reader support for content
- High contrast mode support
- Focus indicators and ARIA labels

## Deployment Notes

1. Frontend and backend should be deployed together
2. Container runtime must be accessible from frontend
3. CDN for static assets (markdown, images)
4. Database for progress storage
5. Redis for session management

## Next Steps

1. Review these specifications with frontend team
2. Set up development environment
3. Implement Phase 1 features
4. Test with sample course content
5. Iterate based on feedback
6. Proceed to Phase 2 features

## Questions?

For implementation questions or clarifications, contact:
- Technical lead: [email]
- Course designer: [email]
- Frontend team: [Slack channel]
