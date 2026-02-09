# Testing and Validation Plan

## Overview
This document outlines the testing strategy for the MGCP Intermediate Course implementation.

## Pre-Deployment Testing (Section 6)

### 6.1-6.6: Frontend Feature Testing

**Interactive Command Execution** (Tasks 6.1-6.4):
- [ ] Test RUN syntax: `[[gs_om -t status]]{{RUN}}`
  - Verify command executes in container
  - Confirm output is captured and displayed
  - Check exit code is tracked
  
- [ ] Test PRINT syntax: `[[echo "reference"]]{{PRINT}}`
  - Verify command is displayed without execution
  - Confirm code block formatting is correct
  
- [ ] Test error handling: Invalid command `[[invalid_command]]{{RUN}}`
  - Verify error message is shown
  - Confirm troubleshooting suggestions are displayed
  - Check retry button is available
  
- [ ] Test sequential commands: Multiple commands in same step
  - Verify commands execute in order
  - Confirm failure stops subsequent commands
  - Check all outputs are displayed independently

**CheckList and Verification** (Task 6.5):
- [ ] Test checkbox state persistence
  - Check items, reload page
  - Verify state is preserved
  - Test clearing and re-checking
  
- [ ] Test verification output matching
  - Test exact match: `expected === actual`
  - Test regex match: `/pattern/.test(actual)`
  - Test threshold comparison: `actual < expected`
  - Confirm pass/fail status is correct

**Exam System** (Tasks 6.7-6.8):
- [ ] Test exam loading for mixed type
  - Load exam with pen_test and practice sections
  - Verify both sections are displayed
  - Check metadata (duration, pass_score)
  
- [ ] Test multi-dimensional scoring calculation
  - Submit practice task with all dimensions
  - Verify correctness scoring (checklist based)
  - Verify performance scoring (time-based)
  - Verify norm scoring (best practices)
  - Verify plan scoring (documentation)
  - Confirm weighted total is calculated correctly

### 6.9: Container Time Validation

**Test 180-minute container allocation**:
- [ ] Start a learning session
- [ ] Monitor container creation with 180min timeout
- [ ] Verify container remains active for full duration
- [ ] Test early termination (manual stop)
- [ ] Confirm cleanup on timeout

**Validation Criteria**:
- Container provisions within 30 seconds
- Active state persists for 180 minutes
- Session ends gracefully on timeout
- Resources are released after termination

### 6.10: Chapter Navigation Testing

**Test intro → steps → finish flow**:
- [ ] Test intro step:
  - Verify no prior steps required
  - Confirm "Continue" button is available
  
- [ ] Test step navigation:
  - Verify sequential unlocking (step1 → step2)
  - Test backward navigation (step2 → step1)
  - Check forward blocking (can't skip to finish)
  - Confirm completion criteria enforcement
  
- [ ] Test finish step:
  - Verify all steps must be completed first
  - Confirm chapter summary is displayed
  - Check next chapter link is available

**Edge Cases**:
- [ ] URL manipulation: Try to access step3 without completing step1-2
  - Expected: Redirect to last completed step
- [ ] Page reload: Refresh at step2
  - Expected: State persists, continue at step2
- [ ] Multiple tabs: Open same chapter in two tabs
  - Expected: Sync via localStorage, handle conflicts

### 6.11: Enterprise Scenario Rendering

**Test scenario context display**:
- [ ] Test banking scenario in Chapter 1:
  - Verify scenario background is prominent
  - Check requirements (RPO=0, RTO<1min) are displayed
  - Confirm scenarios are integrated into step content
  
- [ ] Test compliance scenario in Chapter 3:
  - Verify data privacy regulations are cited
  - Check context explains relevance to learning
  - Confirm scenario examples are clear
  
**Validation Criteria**:
- Scenario text is rendered with proper formatting
- Requirements are listed with visual emphasis
- Icons/graphics (if any) display correctly
- Scenarios are accessible (screen reader compatible)

### 6.12: Pilot Testing (Task 6.12)

**Pilot Test Plan**:

**Participants**: 3-5 learners
- Profile: Intermediate DBAs with MGCA completion
- Mix: Internal employees + external participants
- Schedule: 2-week pilot period

**Test Objectives**:
1. Content Clarity
   - Are instructions clear and actionable?
   - Are interactive commands easy to understand?
   - Are examples helpful?

2. Technical Functionality
   - Do commands execute correctly?
   - Is progress tracking reliable?
   - Do exams work as expected?

3. User Experience
   - Is navigation intuitive?
   - Is completion criteria clear?
   - Is feedback timely and helpful?

4. Learning Effectiveness
   - Do learners achieve learning objectives?
   - Are scenarios relatable and helpful?
   - Do practice tasks reinforce concepts?

**Data Collection**:
- [ ] Pre-pilot survey: Expectations and baseline knowledge
- [ ] In-pilot feedback: Daily/weekly check-ins
- [ ] Post-pilot survey: Overall satisfaction and recommendations
- [ ] Performance metrics: Completion rates, time spent, exam scores
- [ ] Issue tracking: Bug reports and usability issues

**Success Criteria**:
- All pilot participants complete at least 4/6 chapters
- Average exam score > pass_score (85%)
- No critical bugs blocking progress
- Net Promoter Score (NPS) > 7
- Technical issues < 5% of total interactions

**Feedback Integration**:
- [ ] Categorize feedback by type (content, technical, UX)
- [ ] Prioritize fixes based on impact and frequency
- [ ] Implement high-priority fixes before full rollout
- [ ] Document low-priority items for future iterations

## Post-Deployment Monitoring

**Key Metrics to Track**:

1. **Enrollment and Engagement**
   - Number of enrolled learners
   - Active learners (last 7 days)
   - Chapter completion rates
   - Overall course completion percentage

2. **Technical Performance**
   - Page load times (< 2s target)
   - Command execution success rate (> 95% target)
   - Progress sync success rate (> 99% target)
   - Error rates by feature

3. **Learning Outcomes**
   - Average time spent per chapter
   - Exam pass rates (target: > 80%)
   - Average exam scores
   - Learner satisfaction scores

4. **Content Effectiveness**
   - Most-viewed chapters
   - Least-viewed chapters
   - Checklist completion rates
   - Verification pass rates

**Monitoring Tools**:
- [ ] Application Performance Monitoring (APM) - e.g., New Relic, Datadog
- [ ] Error tracking - e.g., Sentry, Rollbar
- [ ] Analytics - e.g., Google Analytics, Mixpanel
- [ ] Learner feedback - In-course surveys, NPS
- [ ] Support tickets - Zendesk, Freshdesk integration

## Issue Resolution Process

1. **Critical Issues** (Blocking progress)
   - Response time: < 2 hours
   - Resolution: < 24 hours
   - Communication: Direct notification to affected learners

2. **High Issues** (Major impact)
   - Response time: < 4 hours
   - Resolution: < 48 hours
   - Communication: Email announcement and in-app banner

3. **Medium Issues** (Minor impact)
   - Response time: < 1 business day
   - Resolution: < 1 week
   - Communication: Next release notes or FAQ update

4. **Low Issues** (Enhancement requests)
   - Response time: < 2 business days
   - Resolution: Backlog or future release
   - Communication: Feature request acknowledgment

## Testing Checklist Summary

- [ ] All frontend features tested (commands, checklists, exams, progress)
- [ ] Container configuration validated (180min timeout)
- [ ] Chapter navigation flow tested
- [ ] Enterprise scenarios rendering verified
- [ ] Pilot test completed with 3-5 learners
- [ ] Feedback collected and analyzed
- [ ] Critical issues fixed before full rollout
- [ ] Monitoring tools configured and operational
- [ ] Support documentation created and published
- [ ] Rollback plan documented and tested
