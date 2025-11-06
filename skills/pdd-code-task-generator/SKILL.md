---
name: pdd-code-task-generator
description: This script generates code task files from PDD implementation plans, creating tasks one step at a time to allow for learning and adaptation between steps. It reads the implementation plan checklist to determine the next uncompleted step or can target a specific step number.
---

# PDD Code Task Generator

## Overview

This script generates code task files from PDD implementation plans, creating tasks one step at a time to allow for learning and adaptation between steps. It reads the implementation plan checklist to determine the next uncompleted step or can target a specific step number.

## Parameters

- **plan_path** (required): Path to the PDD implementation plan file (e.g., "planning/implementation/plan.md")
- **step_number** (optional): Specific step number to generate a task for. If not provided, automatically determines the next uncompleted step from the checklist
- **output_dir** (optional, default: same directory as plan_path): Directory where the code task file will be created

**Constraints for parameter acquisition:**
- You MUST ask for all required parameters upfront in a single prompt rather than one at a time
- You MUST support multiple input methods for plan_path including:
  - Direct file path
  - Directory path (will look for plan.md within it)
- You MUST validate that the plan file exists and contains a proper checklist
- You MUST confirm successful acquisition of all parameters before proceeding

## Steps

### 1. Parse Implementation Plan

Read and analyze the PDD implementation plan to extract steps and checklist status.

**Constraints:**
- You MUST read the implementation plan file at the specified path
- You MUST extract the checklist section and identify completed vs. uncompleted steps
- You MUST parse each step's title, description, demo requirements, and any constraints
- You MUST validate that the plan follows the expected PDD format with numbered steps
- You MUST handle cases where the checklist format might vary slightly

### 2. Determine Target Step

Identify which step to generate a code task for based on parameters and checklist status.

**Constraints:**
- If step_number is provided, You MUST use that specific step number
- If step_number is not provided, You MUST find the first uncompleted step in the checklist
- You MUST validate that the target step exists in the implementation plan
- You MUST warn the user if generating a task for an already completed step
- You MUST provide clear feedback about which step is being processed

### 3. Extract Step Details

Parse the target step's content to gather all necessary information for the code task.

**Constraints:**
- You MUST extract the step title, removing the "Step N:" prefix
- You MUST capture the full step description and implementation guidance
- You MUST extract the "Demo" section content as acceptance criteria
- You MUST identify any technical constraints or requirements mentioned
- You MUST preserve any integration notes with previous steps

### 4. Present Task Plan for Approval

Analyze the step content and present a summary of planned code tasks for user approval.

**Constraints:**
- You MUST analyze the step content to identify logical sub-tasks for implementation
- You MUST present a concise one-line summary for each planned code task
- You MUST show the proposed task sequence and dependencies
- You MUST ask the user to approve the plan before proceeding
- You MUST allow the user to request modifications to the task breakdown
- You MUST NOT proceed to generate actual code task files until the user explicitly approves

### 5. Generate Code Task Files

Create a step folder and generate multiple code task files that break down the PDD step into implementable tasks.

**Constraints:**
- You MUST create a folder named `step{NN}` where NN is zero-padded (e.g., step01, step02, step10)
- You MUST analyze the step content to identify logical sub-tasks for implementation
- You MUST create multiple code task files within the step folder, named sequentially: `task-01-{title}.code-task.md`, `task-02-{title}.code-task.md`, etc.
- You MUST break down the step into logical implementation phases focusing on functional components, NOT separate testing tasks
- You MUST include unit test requirements as part of the acceptance criteria for each implementation task
- You MUST NOT create separate tasks for "add unit tests" or "write tests" because testing should be integrated into each functional implementation task
- You MUST follow the exact format specified below in the Code Task Format section
- You MUST ensure each task builds on previous tasks within the step
- You MUST convert the Demo section into acceptance criteria distributed across the relevant tasks
- You MUST reference the PDD plan and any related design documents in the Background section
- You MUST include dependencies between tasks within the step

## Code Task Format Specification

Each code task file MUST follow this exact structure:

```markdown
# Task: [Task Name]

## Description
[A clear description of what needs to be implemented and why]

## Background
[Relevant context and background information needed to understand the task]

## Technical Requirements
1. [First requirement]
2. [Second requirement]
3. [Third requirement]

## Dependencies
- [First dependency with details]
- [Second dependency with details]

## Implementation Approach
1. [First implementation step or approach]
2. [Second implementation step or approach]

## Acceptance Criteria

1. **[Criterion Name]**
   - Given [precondition]
   - When [action]
   - Then [expected result]

2. **[Another Criterion]**
   - Given [precondition]
   - When [action]
   - Then [expected result]

## Metadata
- **Complexity**: [Low/Medium/High]
- **Labels**: [Comma-separated list of labels]
- **Required Skills**: [Skills needed for implementation]
```

### Code Task Format Example

```markdown
# Task: Create User Data Model Class

## Description
Create a User data model class with basic properties and validation methods. This class will represent user entities in the system and provide data validation capabilities.

## Background
This is part of implementing the data models for the user management system. The User class needs to handle basic user information and validate data before it's stored or processed by other components.

## Technical Requirements
1. Create a User class with properties: id, username, email, createdAt
2. Add a validate() method that checks email format and username length
3. Add a toDict() method for serialization
4. Add a fromDict() class method for deserialization
5. Include appropriate type hints for all methods

## Dependencies
- Python dataclasses or similar structure for the class definition
- Email validation regex or library
- datetime module for createdAt timestamps

## Implementation Approach
1. Define the User class using dataclasses for clean property definition
2. Implement validation method with specific rules for each field
3. Add serialization methods for converting to/from dictionaries
4. Include proper error handling for invalid data

## Acceptance Criteria

1. **User Creation**
   - Given valid user data (id, username, email)
   - When creating a User instance
   - Then the user object is created with all properties set correctly

2. **Email Validation**
   - Given an invalid email format
   - When calling validate() method
   - Then a validation error is raised with descriptive message

3. **Serialization**
   - Given a User instance
   - When calling toDict() method
   - Then a dictionary with all user properties is returned

4. **Deserialization**
   - Given a valid dictionary with user data
   - When calling User.fromDict() class method
   - Then a User instance is created with correct property values

5. **Unit Tests**
   - Given the User class implementation
   - When running the test suite
   - Then all methods have corresponding unit tests with good coverage

## Metadata
- **Complexity**: Low
- **Labels**: Data Model, Validation, Serialization
- **Required Skills**: Python, dataclasses, basic validation
```

### 6. Report Results

Inform the user about the generated tasks and next steps.

**Constraints:**
- You MUST list all generated code task files with their paths
- You MUST provide the step demo requirements for context
- You MUST suggest running code-assist on each task in sequence
- You MUST NOT create any additional log files or summary documents

## Examples

### Example Input
```
plan_path: "planning/implementation/plan.md"
```

### Example Output
```
Generated code tasks for step 2: planning/implementation/step02/

Created tasks:
- task-01-create-data-models.code-task.md
- task-02-implement-validation.code-task.md  
- task-03-add-serialization.code-task.md

Next steps: Run code-assist on each task in sequence

Step demo: Working data models with validation that can create, validate, and serialize/deserialize data objects
```

## Troubleshooting

### Plan File Not Found
If the specified plan file doesn't exist:
- You SHOULD check if the path is a directory and look for plan.md within it
- You SHOULD suggest common locations where PDD plans might be stored
- You SHOULD validate the file path format and suggest corrections

### Invalid Plan Format
If the plan doesn't follow expected PDD format:
- You SHOULD identify what sections are missing or malformed
- You SHOULD suggest running the PDD script to generate a proper plan
- You SHOULD attempt to extract what information is available

### No Uncompleted Steps
If all steps in the checklist are marked complete:
- You SHOULD inform the user that all steps appear to be complete
- You SHOULD ask if they want to generate a task for a specific step anyway
- You SHOULD suggest reviewing the implementation plan for potential new steps
