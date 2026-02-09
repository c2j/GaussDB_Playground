# Mixed Exam System - Implementation Specification

## Overview
Extend exam system to support mixed type exams (pen_test + practice) with multi-dimensional scoring.

## Data Structure

### Exam Configuration
```typescript
interface ExamConfig {
  type: 'mixed' | 'written' | 'practice';
  duration: number;  // minutes
  pass_score: number;  // percentage (0-100)
  pen_test?: PenTest[];
  practice?: PracticeTask[];
}

interface PenTest {
  id: string;
  question: string;
  type: 'single_choice' | 'multiple_choice' | 'analysis';
  options?: string[];  // for single/multiple choice
  answer: string | string[];  // correct answer(s)
  explanation: string;
  points?: number;
}

interface PracticeTask {
  id: string;
  task: string;
  description: string;
  scoring: {
    correctness: number;   // 0-100
    performance: number;    // 0-100
    norm: number;           // 0-100
    plan: number;           // 0-100
  };
  checklist: string[];
}
```

### Learner Submission
```typescript
interface ExamSubmission {
  examId: string;
  learnerId: string;
  pen_test_answers: PenTestAnswer[];
  practice_submissions: PracticeSubmission[];
  submittedAt: Date;
}

interface PenTestAnswer {
  questionId: string;
  answer: string | string[];
  timeSpent?: number;
}

interface PracticeSubmission {
  taskId: string;
  submissionFiles: File[];
  notes?: string;
  timeSpent?: number;
}
```

### Grading Result
```typescript
interface ExamGradingResult {
  examId: string;
  learnerId: string;
  pen_test_score: number;
  practice_score: number;
  final_score: number;
  passed: boolean;
  breakdown: {
    pen_test: {
      correct: number;
      total: number;
      questions: QuestionResult[];
    };
    practice: {
      tasks: TaskResult[];
    };
  };
}

interface TaskResult {
  taskId: string;
  dimensions: {
    correctness: number;
    performance: number;
    norm: number;
    plan: number;
  };
  totalScore: number;
  checklist_status: boolean[];
  feedback: string;
}

interface QuestionResult {
  questionId: string;
  correct: boolean;
  learnerAnswer: string | string[];
  points: number;
  maxPoints: number;
}
```

## Implementation Tasks

### Exam Loading and Display

**Tasks**:
- [ ] Parse exam-questions.json with mixed type structure
- [ ] Display exam metadata (duration, pass_score)
- [ ] Render pen_test section with question cards
- [ ] Render practice section with task cards
- [ ] Implement timer countdown (e.g., "Time remaining: 89:45")
- [ ] Show navigation between pen_test and practice sections

### Pen Test Component

**Single Choice**:
```typescript
interface SingleChoiceQuestionProps {
  question: PenTest;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}
```
- [ ] Render question text with markdown support
- [ ] Display options as radio buttons
- [ ] Allow selection change before submission
- [ ] Show explanation after submission
- [ ] Indicate correct/incorrect after grading

**Multiple Choice**:
```typescript
interface MultipleChoiceQuestionProps {
  question: PenTest;
  onAnswer: (answers: string[]) => void;
  disabled?: boolean;
}
```
- [ ] Render question with checkboxes for options
- [ ] Allow multiple selections
- [ ] Validate minimum/maximum selections (if applicable)
- [ ] Show correct answers after grading

**Analysis Question**:
```typescript
interface AnalysisQuestionProps {
  question: PenTest;
  onAnswer: (answer: string) => void;
  disabled?: boolean;
}
```
- [ ] Render text area for descriptive answer
- [ ] Support markdown input for structured answers
- [ ] Show character/word count
- [ ] Indicate "Requires manual grading"

### Practice Task Component

```typescript
interface PracticeTaskProps {
  task: PracticeTask;
  onSubmit: (submission: PracticeSubmission) => void;
  disabled?: boolean;
}
```
- [ ] Display task title and description
- [ ] Show scoring dimensions with weights
- [ ] Render checklist items for self-assessment
- [ ] Provide file upload interface for submission
- [ ] Show time tracking per task
- [ ] Support note-taking area

**Scoring Display**:
```typescript
interface ScoringBreakdownProps {
  scoring: PracticeTask['scoring'];
  results?: TaskResult['dimensions'];
}
```
- [ ] Display each dimension with weight (e.g., "Correctness: 35%")
- [ ] Show instructor scores if graded
- [ ] Calculate weighted total
- [ ] Provide visual progress bars for each dimension

### Grading Engine

**Pen Test Auto-Grading**:
```typescript
function gradePenTest(
  questions: PenTest[],
  answers: PenTestAnswer[]
): PenTestResult {
  // Single choice: direct comparison
  // Multiple choice: array comparison
  // Analysis: flag for manual grading
  
  const score = correctQuestions / totalQuestions * 100;
  return {
    correct,
    total,
    questions: detailedResults,
    score
  };
}
```
- [ ] Implement auto-grading for single_choice questions
- [ ] Implement auto-grading for multiple_choice questions
- [ ] Flag analysis questions for manual review
- [ ] Calculate percentage score

**Practice Task Multi-Dimensional Scoring**:
```typescript
function gradePracticeTask(
  task: PracticeTask,
  submission: PracticeSubmission,
  instructorGrades?: Partial<TaskResult['dimensions']>
): TaskResult {
  // Calculate each dimension score
  const correctness = calculateCorrectness(submission, task.checklist);
  const performance = calculatePerformance(submission.timeSpent);
  const norm = evaluateNorm(submission);
  const plan = evaluatePlan(submission.notes);
  
  // Weighted total
  const weights = task.scoring;
  const totalScore = 
    (correctness * weights.correctness +
     performance * weights.performance +
     norm * weights.norm +
     plan * weights.plan) / 100;
  
  return { dimensions: { correctness, performance, norm, plan }, totalScore };
}
```
- [ ] Implement correctness scoring based on checklist completion
- [ ] Implement performance scoring based on execution time
- [ ] Implement norm scoring based on best practices adherence
- [ ] Implement plan scoring based on documentation quality
- [ ] Support manual override by instructor for each dimension

**Final Score Calculation**:
```typescript
function calculateFinalScore(
  penTestScore: number,
  practiceScore: number,
  weights: { pen_test: number; practice: number } = { pen_test: 50, practice: 50 }
): number {
  return (penTestScore * weights.pen_test + 
          practiceScore * weights.practice) / 100;
}
```
- [ ] Combine pen_test and practice scores
- [ ] Support configurable weight distribution
- [ ] Compare against pass_score threshold
- [ ] Determine pass/fail status

### Exam Flow

**Timer Management**:
- [ ] Implement countdown timer (HH:MM:SS format)
- [ ] Show warning at 10 minutes remaining
- [ ] Auto-submit at time expiration
- [ ] Allow timer extension (if permitted)
- [ ] Handle browser tab visibility changes

**Navigation**:
- [ ] Implement question-to-question navigation
- [ ] Support "Review All" before submission
- [ ] Show progress indicator (e.g., "Question 3 of 10")
- [ ] Allow jumping to specific questions
- [ ] Prevent submission of incomplete sections

**Submission**:
- [ ] Validate all required questions answered
- [ ] Confirm before final submission
- [ ] Show submission summary
- [ ] Handle submission errors gracefully
- [ ] Display success message with estimated grading time

### Result Display

**Score Summary**:
```typescript
interface ScoreSummaryProps {
  result: ExamGradingResult;
  showDetails?: boolean;
}
```
- [ ] Display overall pass/fail status prominently
- [ ] Show final score vs. pass_score threshold
- [ ] Breakdown: Pen test score (X/Y questions)
- [ ] Breakdown: Practice task scores with dimensions
- [ ] Expandable details per question/task
- [ ] Provide feedback for incorrect answers

## Storage and Persistence

```typescript
interface ExamState {
  examId: string;
  currentSection: 'pen_test' | 'practice';
  currentQuestion?: number;
  currentTask?: number;
  answers: Map<string, PenTestAnswer>;
  submissions: Map<string, PracticeSubmission>;
  timeRemaining: number;
  lastSaved: Date;
}
```

**Tasks**:
- [ ] Auto-save exam state every 30 seconds
- [ ] Recover state on page reload
- [ ] Implement draft storage for analysis questions
- [ ] Support offline mode with sync on reconnect
- [ ] Clear state on exam completion

## Security Considerations

- [ ] Prevent copy/paste during exam (if required)
- [ ] Detect and alert on tab switching (if required)
- [ ] Time limit enforcement server-side
- [ ] Validate submission authenticity
- [ ] Prevent multiple simultaneous exam sessions
- [ ] Secure file upload (virus scan, size limits)

## Testing Checklist
- [ ] Test pen_test with all question types
- [ ] Test practice task submission
- [ ] Test timer expiration and auto-submit
- [ ] Test multi-dimensional scoring calculation
- [ ] Test result display for pass and fail scenarios
- [ ] Test state persistence across page reload
- [ ] Test mobile responsiveness
- [ ] Test accessibility features
