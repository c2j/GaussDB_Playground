# Interactive Command Syntax - Implementation Specification

## Overview
Implement markdown parser and execution engine for interactive command syntax in course content.

## Syntax Definition

### 1. RUN Syntax
Format: `[[command]]{{RUN}}`
- Executes the command in container environment
- Captures and displays output to learner
- Tracks execution status (success/failure)
- Supports validation against expected results

### 2. PRINT Syntax
Format: `[[command]]{{PRINT}}`
- Displays command text as reference without execution
- Shows command in formatted code block
- Used for examples and reference commands

## Implementation Requirements

### Parser Module
```typescript
// Interface for command syntax parser
interface InteractiveCommand {
  type: 'RUN' | 'PRINT';
  command: string;
  validation?: {
    criteria: string;  // e.g., "同步延迟 < 1s"
    regex?: string;
  };
}
```

**Tasks**:
- [ ] Parse markdown content for [[command]]{{RUN}} patterns
- [ ] Parse markdown content for [[command]]{{PRINT}} patterns
- [ ] Extract command string and action type
- [ ] Handle nested braces and escaped characters
- [ ] Preserve markdown formatting around commands

### Execution Engine
```typescript
// Command execution service
class CommandExecutionService {
  async execute(command: string): Promise<ExecutionResult> {
    // 1. Execute command in container environment
    // 2. Capture stdout/stderr
    // 3. Get exit code
    // 4. Return result with metadata
  }
  
  async validate(output: string, criteria: string): Promise<boolean> {
    // Implement validation logic:
    // - Output matching (exact/partial/regex)
    // - Return code checking
    // - Performance threshold checking (e.g., "sync delay < 1s")
  }
}
```

**Tasks**:
- [ ] Integrate with container runtime API
- [ ] Execute shell commands safely (sanitize inputs)
- [ ] Capture both stdout and stderr
- [ ] Measure execution time
- [ ] Implement validation against criteria
- [ ] Return structured result with status

### Output Display Component
```typescript
// React component for command output
interface CommandOutputProps {
  command: string;
  output: string;
  status: 'success' | 'error';
  executionTime?: number;
  validation?: {
    passed: boolean;
    criteria: string;
  };
}
```

**Tasks**:
- [ ] Render command in code block with syntax highlighting
- [ ] Display output in scrollable terminal-like view
- [ ] Show execution status icon (success/error)
- [ ] Display validation result with pass/fail indicator
- [ ] Show execution time when available

### Error Handling
```typescript
class ErrorHandler {
  getTroubleshootingTip(error: ExecutionError): string {
    // Map common errors to troubleshooting suggestions:
    // - Node not started: "Check if cluster is running with gs_om -t status"
    // - Permission denied: "Verify database permissions"
    // - Command not found: "Install required tool or check PATH"
  }
}
```

**Tasks**:
- [ ] Detect common error patterns in output
- [ ] Display context-specific troubleshooting suggestions
- [ ] Allow retry mechanism for failed commands
- [ ] Show error details and suggestions inline

## Example Implementation Flow

```
1. Parse markdown step content
2. Find all [[command]]{{RUN}} and [[command]]{{PRINT}} patterns
3. For each command:
   a. RUN: Execute in container, capture output
   b. PRINT: Render in code block
   c. If RUN: Validate against criteria (if defined)
   d. Display result with appropriate styling
4. Handle errors gracefully with suggestions
5. Update learner progress based on validation results
```

## Security Considerations
- [ ] Sanitize all command inputs before execution
- [ ] Whitelist allowed command types
- [ ] Execute in isolated/sandboxed container
- [ ] Audit all command execution logs
- [ ] Limit execution timeout (e.g., 30s per command)

## Testing Checklist
- [ ] Test simple command: `[[echo "test"]]{{RUN}}`
- [ ] Test command with validation: `[[select count(*) from t;]]{{RUN}}` with criteria
- [ ] Test PRINT syntax: `[[ls -la]]{{PRINT}}`
- [ ] Test error handling: Invalid command that should fail
- [ ] Test sequential commands in same step
- [ ] Verify output display formatting and scrolling
