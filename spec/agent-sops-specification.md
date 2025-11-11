# Agent SOPs Specification

## Introduction

Agent SOPs are structured markdown files that provide step-by-step instructions for AI agents to perform complex tasks. They enable the creation of reusable, shareable workflows that can be executed consistently across different AI systems and teams.

## Core Concepts

### What is an Agent SOP?

An Agent SOP is a markdown file with a `.sop.md` extension that contains:
- A clear description of the task to be performed
- Defined parameters (inputs) the script accepts
- Step-by-step instructions with specific constraints
- Examples and troubleshooting guidance

### Design Principles

1. **Natural Language First**: Scripts use plain English instructions, requiring no prompt engineering expertise
2. **Standardized Structure**: Consistent format makes scripts easy to understand and share
3. **Parameterized**: Scripts accept inputs to make them reusable across different contexts
4. **Constraint-Based**: Uses RFC 2119 keywords (MUST, SHOULD, MAY) for clear behavioral requirements
5. **Interactive**: Scripts can guide users through complex multi-step processes

## File Format

### File Extension
All agent SOPs MUST use the `.sop.md` file extension.

### File Naming
SOP files SHOULD use kebab-case naming (e.g., `code-review-assistant.sop.md`).

## Script Structure

### Required Sections

#### 1. Title
```markdown
# Script Name
```

#### 2. Overview
```markdown
## Overview

A concise description of what the script does and when to use it.
```

#### 3. Parameters
```markdown
## Parameters

- **required_param** (required): Description of the required parameter
- **optional_param** (optional): Description of the optional parameter
- **param_with_default** (optional, default: "value"): Description with default value
```

#### 4. Steps
```markdown
## Steps

### 1. Step Name

Natural language description of what happens in this step.

**Constraints:**
- You MUST perform specific action
- You SHOULD consider certain factors
- You MAY optionally do something else
```

### Optional Sections

#### Examples
```markdown
## Examples

### Example Input
[Sample input]

### Example Output
[Expected output]
```

#### Troubleshooting
```markdown
## Troubleshooting

### Common Issue
Description and resolution steps.
```

## Parameter Specification

### Parameter Format
Parameters are defined using this format:
```
- **parameter_name** (required|optional[, default: "value"]): Description
```

### Parameter Names
- Use lowercase letters only
- Use underscores for word separation (snake_case)
- Be descriptive and clear

### Parameter Types
- **required**: Must be provided by the user
- **optional**: Can be omitted, script should handle gracefully
- **optional with default**: Has a fallback value if not provided

## Constraint System

### RFC 2119 Keywords

Scripts use standardized keywords to indicate requirement levels:

- **MUST** / **REQUIRED**: Absolute requirement
- **MUST NOT** / **SHALL NOT**: Absolute prohibition  
- **SHOULD** / **RECOMMENDED**: Strong recommendation with possible exceptions
- **SHOULD NOT** / **NOT RECOMMENDED**: Strong discouragement with possible exceptions
- **MAY** / **OPTIONAL**: Truly optional behavior

### Constraint Format
```markdown
**Constraints:**
- You MUST [specific requirement]
- You SHOULD [recommended behavior]
- You MAY [optional behavior]
```

### Negative Constraints
When using prohibitive constraints (MUST NOT, SHOULD NOT), always provide context:

```markdown
- You MUST NOT [action] because [reason/context]
```

**Good example:**
```markdown
- You MUST NOT delete files without confirmation because this could result in permanent data loss
```

**Bad example:**
```markdown
- You MUST NOT delete files
```

## Step Design

### Step Structure
Each step should include:
1. A descriptive name
2. Natural language explanation
3. Specific constraints using RFC 2119 keywords

### Step Sequencing
- Steps should build logically on previous steps
- Each step should have a clear, measurable outcome
- Complex steps should be broken into smaller sub-steps

### Conditional Logic
For conditional behavior:
```markdown
### 3. Conditional Step

If [condition], proceed with [action]. Otherwise, [alternative action].

**Constraints:**
- You MUST check [condition] before proceeding
- If [condition] is true, You MUST [action]
- If [condition] is false, You MUST [alternative action]
```

## Interactive Elements

### User Interaction
Scripts can include interactive elements:
- Questions for the user
- Confirmation prompts
- Choice selections

### Interaction Guidelines
- Ask one question at a time
- Wait for user response before proceeding
- Provide clear options when choices are available
- Save interaction history when appropriate

## Best Practices

### Writing Guidelines
1. Use clear, concise language
2. Be specific about expected outcomes
3. Include examples for complex concepts
4. Provide troubleshooting for common issues
5. Test scripts thoroughly before sharing

### Technical Guidelines
1. Specify file paths for all created artifacts
2. Handle error conditions gracefully
3. Minimize complex conditional logic
4. Keep steps focused and atomic

### Maintenance
1. Document known limitations
2. Update examples to reflect current best practices
3. Gather feedback from users for improvements

## Implementation Notes

### Agent Compatibility
Agent SOPs are designed to work with various AI systems that can:
- Parse markdown format
- Follow structured instructions
- Handle parameters and constraints
- Interact with users when required

### Tool Integration
Scripts may reference external tools or capabilities:
- File system operations
- API calls
- Database queries
- External service integrations

The specific tools available depend on the implementing AI system.

## Example Agent SOP

````markdown
# Personalized Learning Curriculum

## Overview

This script creates customized learning paths by adapting to individual learning styles and goals, leveraging AI flexibility to provide personalized recommendations.

## Parameters

- **learning_goal** (required): What the person wants to learn
- **current_level** (required): Beginner, intermediate, or advanced
- **time_commitment** (optional): Available study time per week
- **learning_style** (optional): Preferred learning methods

**Constraints for parameter acquisition:**
- You MUST ask for all required parameters upfront in a single prompt rather than one at a time
- You MUST support multiple input methods including:
  - Direct input: Text provided directly in the conversation
  - File path: Path to a local file containing learning objectives
  - URL: Link to a course description or learning requirements
  - Other methods: You SHOULD be open to other ways the user might want to provide their learning goals
- You MUST use appropriate tools to access content based on the input method
- You MUST confirm successful acquisition of all parameters before proceeding
- You SHOULD save any acquired data to a consistent location for use in subsequent steps

## Steps

### 1. Assess Learning Context

Understand the learner's situation and preferences through adaptive questioning.

**Constraints:**
- You MUST clarify the specific learning objectives
- You SHOULD identify the learner's background and experience
- You MAY ask follow-up questions to better understand their context
- You SHOULD adapt your questioning style based on the learner's responses
- You MUST save all assessment information to "learning-assessment.md"

### 2. Design Learning Path

Create a personalized curriculum structure that adapts to the learner's needs.

**Constraints:**
- You MUST sequence topics in a logical progression
- You SHOULD vary learning activities to maintain engagement
- You MAY suggest alternative paths based on different learning preferences discovered during assessment
- You SHOULD adjust complexity and pacing based on the learner's stated level
- You MUST create the learning path in "curriculum-plan.md"

### 3. Recommend Resources

Suggest specific materials and activities tailored to the individual learner.

**Constraints:**
- You MUST provide concrete, actionable resources for each learning stage
- You SHOULD mix different types of learning materials (videos, books, exercises, projects)
- You MAY suggest creative or unconventional learning approaches if they align with the learner's style
- You SHOULD tailor recommendations to the learner's stated preferences and time constraints
- You MUST save all recommendations to "learning-resources.md"

## Examples

### Example Input
```
learning_goal: "Learn Python programming for data analysis"
current_level: "Beginner"
time_commitment: "5 hours per week"
learning_style: "Hands-on with projects"
```

### Example Output
```
Created personalized 12-week Python curriculum with:
- Week 1-3: Python basics with daily coding exercises
- Week 4-6: Data manipulation with pandas through mini-projects
- Week 7-9: Visualization with matplotlib via real datasets
- Week 10-12: Complete data analysis capstone project

Recommended mix: 60% hands-on coding, 30% project work, 10% theory
Adapted pacing: Slower introduction due to beginner level
```

## Troubleshooting

### Unclear Learning Goals
If the learning goal is too vague, ask specific clarifying questions about desired outcomes and applications.

### Conflicting Preferences
If time commitment conflicts with learning goals, present realistic options and let the learner choose their priority.
````
