# Core Business Flows & State Machines

## 1. Flow Overview
This document specifies multi-step state transitions, database transactions, and side-effects.

---

## 2. Primary Workflow: {{FLOW_NAME}}

### State Transitions
\`\`\`
[INITIAL] -> {{STATE_1}} -> {{STATE_2}} -> [TERMINAL]
                |
                v
            [CANCELLED]
\`\`\`

### Step-by-Step Execution Protocol
When `{{TRIGGER_ACTION}}` is executed:
1. **Pre-condition Validation**:
   - Check actor permissions.
   - Verify entity state is in `{{STATE_1}}`.
2. **Atomic Database Mutation**:
   - Wrap operations in `db.transaction()`:
     - Update primary entity status.
     - Insert audit log entry.
3. **Side-Effects & Events**:
   - Dispatch background jobs or notifications if applicable.
