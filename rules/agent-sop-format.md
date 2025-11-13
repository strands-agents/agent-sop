---
description: Standard format for Agent SOPs
globs: **/*.sop.md
---
# Agent SOP Format

This rule defines the standard format for Agent SOPs, which are reusable workflows that automate complex processes.

<rule>
name: agent_sop_format
description: Standards for creating and formatting Agent SOPs
filters:
  # Match SOP files
  - type: file_extension
    pattern: "\.sop\.md$"

actions:
  - type: suggest
    message: |
      Agent SOPs must follow the standard format:
      
      1. Use `.sop.md` file extension
      2. Include Overview, Parameters, and Steps sections
      3. Use RFC2119 keywords (MUST, SHOULD, MAY) in constraints
      4. Provide context for all negative constraints (MUST NOT, SHOULD NOT, etc.)
      5. Use lowercase with underscores for parameter names
      7. Include examples where appropriate
      8. Follow the template structure defined in this rule

examples:
  - input: |
      # My SOP
      
      This is a non-standard SOP format.
    output: |
      # My SOP
      
      ## Overview
      
      This SOP helps users accomplish a specific task by guiding them through a series of steps.
      
      ## Parameters
      
      - **parameter_name** (required): Description of the parameter
      - **optional_param** (optional): Description of the optional parameter
      
      ## Steps
      
      ### 1. First Step
      
      Description of what happens in this step.
      
      **Constraints:**
      - You MUST perform specific action
      - You SHOULD consider certain factors
      
      ### 2. Second Step
      
      Description of what happens in this step.
      
      **Constraints:**
      - You MUST save output to a file
      
      ## Examples
      
      Example of expected output or behavior.

metadata:
  priority: high
  version: 1.0
</rule>

# Agent SOP Format Specification

## Overview

This document defines the standard format for Agent SOPs. SOPs are markdown files that provide structured guidance for agents to follow when performing specific tasks, making complex workflows repeatable and consistent.

## File Naming and Location

1. All SOP files MUST use the `.sop.md` file extension.
2. SOP files SHOULD have descriptive names using kebab-case (e.g., `idea-honing.sop.md`).

## SOP Structure

Each SOP MUST include the following sections:

### 1. Title and Overview

```markdown
# [SOP Name]

## Overview

[A concise description of what the SOP does and when to use it]
```

### 2. Parameters

```markdown
## Parameters

- **required_param** (required): [Description of the required parameter]
- **another_required** (required): [Description of another required parameter]
- **optional_param** (optional): [Description of the optional parameter]
- **optional_with_default** (optional, default: "default_value"): [Description]
```

Parameter names MUST:
- Use lowercase letters
- Use underscores for spaces (snake_case)
- Be descriptive of their purpose

For parameters with flexible input methods:

```markdown
## Parameters

- **input_data** (required): The data to be processed.

**Constraints for parameter acquisition:**
- You MUST ask for all required parameters upfront in a single prompt rather than one at a time
- You MUST support multiple input methods including:
  - Direct input: Text provided directly in the conversation
  - File path: Path to a local file
  - URL: Link to an internal resource
  - Other methods: You SHOULD be open to other ways the user might want to provide the data
- You MUST use appropriate tools to access content based on the input method
- You MUST confirm successful acquisition of all parameters before proceeding
- You SHOULD save any acquired data to a consistent location for use in subsequent steps
```

### 3. Steps

```markdown
## Steps

### 1. [Step Name]

[Natural language description of what happens in this step]

**Constraints:**
- You MUST [specific requirement using RFC2119 keyword]
- You SHOULD [recommended behavior using RFC2119 keyword]
- You MAY [optional behavior using RFC2119 keyword]

### 2. [Next Step]

[Description]

**Constraints:**
- [List of constraints]
```

For steps with conditional logic:

```markdown
### 3. [Conditional Step]

If [condition], proceed with [specific action]. Otherwise, [alternative action].

**Constraints:**
- You MUST check [condition] before proceeding
- If [condition] is true, You MUST [action]
- If [condition] is false, You MUST [alternative action]
```

### 4. Examples (Optional but Recommended)

```markdown
## Examples

### Example Input
```
[Example input]
```

### Example Output
```
[Example output]
```
```

### 5. Troubleshooting (Optional)

```markdown
## Troubleshooting

### [Common Issue]
If [issue description], you should [resolution steps].

### [Another Issue]
[Description and resolution]
```

## RFC2119 Keywords

SOPs MUST use the following keywords as defined in RFC2119 to indicate requirement levels:

- **MUST** (or **REQUIRED**): Absolute requirement
- **MUST NOT** (or **SHALL NOT**): Absolute prohibition
- **SHOULD** (or **RECOMMENDED**): There may be valid reasons to ignore this item, but the full implications must be understood and carefully weighed
- **SHOULD NOT** (or **NOT RECOMMENDED**): There may be valid reasons when this behavior is acceptable, but the full implications should be understood
- **MAY** (or **OPTIONAL**): Truly optional item

## Negative Constraints and Context

When using negative constraints (MUST NOT, SHOULD NOT, SHALL NOT, NEVER, etc.), you MUST provide context explaining why the restriction exists. This helps users understand the reasoning and avoid similar issues.

**Format for negative constraints:**
```markdown
- You MUST NOT [action] because [reason/context]
- You SHOULD NEVER [action] since [explanation of consequences]
- You SHALL NOT [action] as [technical limitation or risk]
```

**Examples:**

Good constraint with context:
```markdown
- You MUST NOT use ellipses (...) in responses because your output will be read aloud by a text-to-speech engine, and the engine cannot properly pronounce ellipses
- You SHOULD NEVER delete Git history files since this could corrupt the repository and make recovery impossible
- You MUST NOT run `git push` because this could publish unreviewed code to shared repositories where others depend on it
```

Bad constraint without context:
```markdown
- You MUST NOT use ellipses
- You SHOULD NEVER delete Git files
- You MUST NOT run git push
```

**Common contexts for negative constraints:**
- **Technical limitations**: "because the system cannot handle..."
- **Security risks**: "since this could expose sensitive data..."
- **Data integrity**: "as this could corrupt or lose important information..."
- **User experience**: "because users will be confused by..."
- **Compatibility issues**: "since this breaks integration with..."
- **Performance concerns**: "as this could cause significant slowdowns..."
- **Workflow disruption**: "because this interferes with established processes..."

## Interactive SOPs

For SOPs with interactive elements:

1. The natural language description SHOULD clearly indicate when user interaction is expected
2. Constraints MUST specify how to handle user responses
3. The SOP SHOULD specify where to save interaction records

Example:

```markdown
### 2. Requirements Clarification

Guide the user through a series of questions to refine their initial idea.

**Constraints:**
- You MUST ask one question at a time
- You MUST append each question and answer to "idea-honing.md"
- You SHOULD adapt follow-up questions based on previous answers
- You MUST continue asking questions until sufficient detail is gathered
```

## Best Practices

1. Keep steps focused and concise
2. Use clear, specific constraints
3. Include examples for complex outputs
4. Use natural language descriptions that are easy to understand
5. Minimize complex conditional logic
6. Specify file paths for all artifacts created
7. Include troubleshooting guidance for common issues
8. Test SOPs thoroughly before sharing
9. Always list required parameters before optional parameters
