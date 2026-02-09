# Progress Tracking - Implementation Specification

## Overview
Implement progress tracking across chapters (intro → steps → finish) with state persistence and resumption.

## Data Structure

### Chapter Progress
```typescript
interface ChapterProgress {
  courseId: string;
  chapterId: string;
  steps: StepProgress[];
  overallStatus: 'not_started' | 'in_progress' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
  timeSpent: number;  // minutes
}

interface StepProgress {
  stepId: string;
  stepType: 'intro' | 'step' | 'finish';
  title: string;
  status: 'not_started' | 'in_progress' | 'completed';
  startedAt?: Date;
  completedAt?: Date;
  timeSpent: number;
  checklists: Record<string, CheckListState>;
  verifications: Record<string, VerificationResult>;
}
```

### Course Progress
```typescript
interface CourseProgress {
  courseId: string;
  learnerId: string;
  chapters: Record<string, ChapterProgress>;
  examStatus: 'not_started' | 'in_progress' | 'completed';
  examScore?: ExamGradingResult;
  overallProgress: number;  // 0-100
  lastAccessed: Date;
}
```

## Implementation Tasks

### Progress Tracking Service

```typescript
class ProgressTracker {
  // Get current progress for a chapter
  async getChapterProgress(chapterId: string): Promise<ChapterProgress>;
  
  // Update step status
  async updateStepStatus(
    chapterId: string,
    stepId: string,
    status: StepProgress['status']
  ): Promise<void>;
  
  // Track time spent on step
  async trackStepTime(
    chapterId: string,
    stepId: string,
    timeSpent: number
  ): Promise<void>;
  
  // Update checklist item
  async updateChecklistItem(
    chapterId: string,
    stepId: string,
    checklistId: string,
    itemId: string,
    completed: boolean
  ): Promise<void>;
  
  // Record verification result
  async recordVerification(
    chapterId: string,
    stepId: string,
    verificationId: string,
    result: VerificationResult
  ): Promise<void>;
  
  // Calculate overall progress
  async calculateOverallProgress(courseId: string): Promise<number>;
  
  // Get next step to complete
  async getNextStep(chapterId: string): Promise<string | null>;
}
```

**Tasks**:
- [ ] Implement progress storage (localStorage + backend sync)
- [ ] Create step-to-step navigation logic
- [ ] Track time spent per step
- [ ] Calculate overall course progress percentage
- [ ] Determine next incomplete step
- [ ] Handle step completion triggers

### Progress Display Component

```typescript
interface ProgressIndicatorProps {
  chapter: ChapterProgress;
  currentStep?: string;
  onNavigate?: (stepId: string) => void;
}
```

**Visual Progress Bar**:
- [ ] Display progress bar showing step completion (e.g., "2/5 steps")
- [ ] Color-coded status (gray=not started, blue=in progress, green=completed)
- [ ] Animate progress updates
- [ ] Show time spent per chapter

**Step Navigation List**:
- [ ] List all steps with status indicators
- [ ] Enable/disable navigation based on sequence
- [ ] Show completion status for each step (✓/○)
- [ ] Highlight current step
- [ ] Allow clicking completed steps to review
- [ ] Block navigation to incomplete steps after current

**Breadcrumbs**:
- [ ] Display "Home > Course > Chapter > Step X"
- [ ] Clickable navigation to parent levels
- [ ] Show current position in hierarchy
- [ ] Update dynamically as learner progresses

### Chapter Flow Management

**Intro → Steps → Finish**:
```typescript
class ChapterFlowManager {
  // Determine allowed transitions
  getAllowedTransitions(currentStep: string): string[] {
    const steps = ['intro', 'step1', 'step2', ..., 'finish'];
    const currentIndex = steps.indexOf(currentStep);
    
    // Can move forward if current step is completed
    // Can always move backward to review
    // Cannot skip ahead
    return [
      ...(currentIndex > 0 ? [steps[currentIndex - 1]] : []),  // back
      ...(this.isStepComplete(currentStep) ? [steps[currentIndex + 1]] : [])  // forward
    ];
  }
  
  // Check if step can be marked complete
  canCompleteStep(stepId: string): boolean {
    // Intro: always completable
    // Steps: required checklists/verifications completed
    // Finish: always completable
    return this.getCompletionCriteria(stepId).every(criteria => criteria.met);
  }
}
```

**Tasks**:
- [ ] Implement sequential step unlocking
- [ ] Define completion criteria per step type
- [ ] Allow backward navigation for review
- [ ] Block forward navigation until current step complete
- [ ] Show "Complete & Continue" button when ready
- [ ] Auto-navigate to next step on completion

### Completion Criteria

**Intro Step**:
```typescript
interface CompletionCriteria {
  met: boolean;
  requirements: string[];
}

function getIntroCriteria(step: StepProgress): CompletionCriteria {
  return {
    met: true,  // Intro has no requirements
    requirements: []
  };
}
```

**Regular Steps**:
```typescript
function getStepCriteria(step: StepProgress): CompletionCriteria {
  const checklistCompleted = Object.values(step.checklists)
    .every(cl => cl.items.every(item => item.completed));
  const verificationsPassed = Object.values(step.verifications)
    .every(v => v.passed);
  
  return {
    met: checklistCompleted && verificationsPassed,
    requirements: [
      ...(!checklistCompleted ? ['Complete all checklist items'] : []),
      ...(!verificationsPassed ? ['Pass all verifications'] : [])
    ]
  };
}
```

**Finish Step**:
```typescript
function getFinishCriteria(step: StepProgress): CompletionCriteria {
  // Finish is always completable
  return {
    met: true,
    requirements: []
  };
}
```

**Tasks**:
- [ ] Check checklist completion status
- [ ] Check verification pass/fail status
- [ ] Display unmet requirements to learner
- [ ] Enable/disable "Complete" button based on criteria
- [ ] Show progress summary on step completion

### Persistence Layer

**LocalStorage Keys**:
```typescript
const STORAGE_KEYS = {
  PROGRESS: 'mgcp_progress',
  CURRENT_STEP: 'mgcp_current_step',
  CHECKLISTS: 'mgcp_checklists',
  VERIFICATIONS: 'mgcp_verifications',
  LAST_SYNC: 'mgcp_last_sync'
};
```

**Tasks**:
- [ ] Save progress on every state change
- [ ] Load progress on course start
- [ ] Sync with backend every 5 minutes
- [ ] Handle offline mode with queued changes
- [ ] Clear progress on course reset/restart
- [ ] Export progress for learner review

**Backend Sync**:
```typescript
interface ProgressSyncPayload {
  learnerId: string;
  courseId: string;
  chapterProgress: ChapterProgress[];
  timestamp: Date;
}
```

- [ ] Implement REST API for progress sync
- [ ] Batch sync operations to reduce network calls
- [ ] Handle merge conflicts (last write wins)
- [ ] Retry failed sync requests
- [ ] Show sync status indicator

### Progress Analytics

```typescript
interface ProgressAnalytics {
  totalSteps: number;
  completedSteps: number;
  averageTimePerStep: number;
  totalTimeSpent: number;
  completionPercentage: number;
  estimatedTimeRemaining: number;
}
```

**Tasks**:
- [ ] Calculate completion statistics
- [ ] Show learner progress dashboard
- [ ] Compare against average completion time
- [ ] Provide time estimates for remaining steps
- [ ] Display progress trend over time

### Progress Sharing

```typescript
interface ProgressShare {
  progress: CourseProgress;
  badges: string[];  // Achievement badges
  certificates?: string;  // Completion certificate
  shareableLink: string;
}
```

**Tasks**:
- [ ] Generate shareable progress summary
- [ ] Award completion badges
- [ ] Create certificate on course completion
- [ ] Allow social media sharing
- [ ] Print progress report

## UI Components

### Progress Bar Component
```typescript
interface ProgressBarProps {
  current: number;
  total: number;
  showLabel?: boolean;
  showTime?: boolean;
}
```

**Implementation**:
- [ ] Visual bar with percentage fill
- [ ] Animated transitions on progress updates
- [ ] Color gradient based on completion (red → yellow → green)
- [ ] Optional: Time remaining display
- [ ] Responsive for mobile devices

### Step Timeline Component
```typescript
interface StepTimelineProps {
  steps: StepProgress[];
  currentStep: string;
  onStepClick: (stepId: string) => void;
}
```

**Implementation**:
- [ ] Vertical timeline with step nodes
- [ ] Connected lines showing progress path
- [ ] Status icons for each step (circle, check, lock)
- [ ] Tooltips showing step details
- [ ] Clickable for navigation (if allowed)

### Progress Summary Card
```typescript
interface ProgressSummaryProps {
  progress: CourseProgress;
  showDetails?: boolean;
}
```

**Implementation**:
- [ ] Overall progress percentage
- [ ] Time spent vs. estimated
- [ ] Chapters completed (e.g., "3/6 chapters")
- [ ] Next recommended action
- [ ] Resume button for last incomplete step

## Edge Cases

**Scenarios**:
- [ ] Learner skips ahead (via URL manipulation) → Redirect to last completed step
- [ ] Progress data corrupted → Reset to last good state or ask to restart
- [ ] Backend sync fails → Queue for retry, continue with local state
- [ ] Multiple browser tabs → Sync state via localStorage events
- [ ] Course content updated → Migrate progress to new structure

## Testing Checklist
- [ ] Test step-by-step navigation
- [ ] Test progress persistence across browser sessions
- [ ] Test progress sync with backend
- [ ] Test offline mode behavior
- [ ] Test progress analytics calculations
- [ ] Test progress sharing feature
- [ ] Test mobile responsiveness
- [ ] Test accessibility features
