---
name: pdd
description: This script guides you through the process of transforming a rough idea into a detailed design document with an implementation plan and todo list. It follows the Prompt-Driven Development methodology to systematically refine your idea, conduct necessary research, create a comprehensive design, and develop an actionable implementation plan. The process is designed to be iterative, allowing movement between requirements clarification and research as needed.
---

# Prompt-Driven Development

## Overview

This script guides you through the process of transforming a rough idea into a detailed design document with an implementation plan and todo list. It follows the Prompt-Driven Development methodology to systematically refine your idea, conduct necessary research, create a comprehensive design, and develop an actionable implementation plan. The process is designed to be iterative, allowing movement between requirements clarification and research as needed.

## Parameters

- **rough_idea** (required): The initial concept or idea you want to develop into a detailed design
- **project_dir** (optional, default: "planning"): The base directory where all project files will be stored
- **checkpointing** (optional, default: "false"): Enable progress checkpointing during implementation. Options:
  - "false" or "none": No checkpointing (default)
  - "notes-only" or "notes": Create checkpoint notes only
  - "git-only" or "git": Create git commits only
  - "both": Create both checkpoint notes and git commits

**Constraints for parameter acquisition:**
- You MUST ask for all required parameters upfront in a single prompt rather than one at a time
- You MUST support multiple input methods including:
  - Direct input: Text provided directly in the conversation
  - File path: Path to a local file containing the rough idea
  - URL: Link to an internal resource (e.g., Quip doc, wiki page)
  - Other methods: You SHOULD be open to other ways the user might want to provide the idea
- You MUST use appropriate tools to access content based on the input method
- You MUST confirm successful acquisition of all parameters before proceeding
- You SHOULD save the acquired rough idea to a consistent location for use in subsequent steps
- You MUST NOT overwrite the existing project directory because this could destroy previous work and cause data loss
- You MUST ask for project_dir if it is not given and default "planning" directory already exist and has contents from previous iteration

## Steps

### 1. Create Project Structure

Set up a directory structure to organize all artifacts created during the process.

**Constraints:**
- You MUST create the specified project directory if it doesn't already exist
- You MUST create the following files:
  - {project_dir}/rough-idea.md (containing the provided rough idea)
  - {project_dir}/idea-honing.md (for requirements clarification)
- You MUST create the following subdirectories:
  - {project_dir}/research/ (directory for research notes)
  - {project_dir}/design/ (directory for design documents)
  - {project_dir}/implementation/ (directory for implementation plans)
- You MUST notify the user when the structure has been created
- You MUST prompt the user to add all project files to Q's context using the command: `/context add {project_dir}/**/*.md`
- You MUST explain that this will ensure all project files remain in context throughout the process

### 2. Initial Process Planning

Determine the initial approach and sequence for requirements clarification and research.

**Constraints:**
- You MUST ask the user if they prefer to:
  - Start with requirements clarification (default)
  - Start with preliminary research on specific topics
  - Provide additional context or information before proceeding
- You MUST adapt the subsequent process based on the user's preference
- You MUST explain that the process is iterative and the user can move between requirements clarification and research as needed
- You MUST wait for explicit user direction before proceeding to any subsequent step
- You MUST NOT automatically proceed to requirements clarification or research without user confirmation because this could lead the process in a direction the user doesn't want

### 3. Requirements Clarification

Guide the user through a series of questions to refine the initial idea and develop a thorough specification.

**Constraints:**
- You MUST create an empty {project_dir}/idea-honing.md file if it doesn't already exist
- You MUST ask ONLY ONE question at a time and wait for the user's response before asking the next question
- You MUST NOT list multiple questions for the user to answer at once because this overwhelms users and leads to incomplete responses
- You MUST NOT pre-populate answers to questions without user input because this assumes user preferences without confirmation
- You MUST NOT write multiple questions and answers to the idea-honing.md file at once because this skips the interactive clarification process
- You MUST follow this exact process for each question:
  1. Formulate a single question
  2. Append the question to {project_dir}/idea-honing.md
  3. Present the question to the user in the conversation
  4. Wait for the user's complete response, which may require brief back-and-forth dialogue across multiple turns.
  5. Once you have their complete response, append the user's answer (or final decision) to {project_dir}/idea-honing.md
  6. Only then proceed to formulating the next question
- You MAY suggest possible answers when asking a question, but MUST wait for the user's actual response
- You MUST format the idea-honing.md document with clear question and answer sections
- You MUST include the final chosen answer in the answer section
- You MAY include alternative options that were considered before the final decision
- You MUST ensure you have the user's complete response before recording it and moving to the next question
- You MUST continue asking questions until sufficient detail is gathered
- You SHOULD ask about edge cases, user experience, technical constraints, and success criteria
- You SHOULD adapt follow-up questions based on previous answers
- You MAY suggest options when the user is unsure about a particular aspect
- You MAY recognize when the requirements clarification process appears to have reached a natural conclusion
- You MUST explicitly ask the user if they feel the requirements clarification is complete before moving to the next step
- You MUST offer the option to conduct research if questions arise that would benefit from additional information
- You MUST be prepared to return to requirements clarification after research if new questions emerge
- You MUST NOT proceed with any other steps until explicitly directed by the user because this could skip important clarification steps

### 4. Research Relevant Information

Conduct research on relevant technologies, libraries, or existing code that could inform the design, while collaborating with the user for guidance.

**Constraints:**
- You MUST identify areas where research is needed based on the requirements
- You MUST propose an initial research plan to the user, listing topics to investigate
- You MUST ask the user for input on the research plan, including:
  - Additional topics that should be researched
  - Specific resources (files, websites, internal tools) the user recommends
  - Areas where the user has existing knowledge to contribute
- You MUST incorporate user suggestions into the research plan
- You MUST document research findings in separate markdown files in the {project_dir}/research/ directory
- You SHOULD organize research by topic (e.g., {project_dir}/research/existing-code.md, {project_dir}/research/technologies.md)
- You MUST include mermaid diagrams when documenting system architectures, data flows, or component relationships in research
- You MUST include links to relevant references and sources when research is based on external materials (websites, documentation, articles, etc.)
- You MAY use tools like search_internal_code, read_internal_website, or fs_read to gather information
- You MUST ask the user whether other available search tools should also be used.
- You MUST periodically check with the user during the research process (these check-ins may involve brief dialogue to clarify feedback) to:
  - Share preliminary findings
  - Ask for feedback and additional guidance
  - Confirm if the research direction remains valuable
- You MUST summarize key findings that will inform the design
- You SHOULD cite sources and include relevant links in research documents
- You MUST ask the user if the research is sufficient before proceeding to the next step
- You MUST offer to return to requirements clarification if research uncovers new questions or considerations
- You MUST NOT automatically return to requirements clarification after research without explicit user direction because this could disrupt the user's intended workflow
- You MUST wait for the user to decide the next step after completing research

### 5. Iteration Checkpoint

Determine if further requirements clarification or research is needed before proceeding to design.

**Constraints:**
- You MUST summarize the current state of requirements and research to help the user make an informed decision
- You MUST explicitly ask the user if they want to:
  - Proceed to creating the detailed design
  - Return to requirements clarification based on research findings
  - Conduct additional research based on requirements
- You MUST support iterating between requirements clarification and research as many times as needed
- You MUST ensure that both the requirements and research are sufficiently complete before proceeding to design
- You MUST NOT proceed to the design step without explicit user confirmation because this could skip important refinement steps

### 6. Create Detailed Design

Develop a comprehensive design document based on the requirements and research.

**Constraints:**
- You MUST create a detailed design document at {project_dir}/design/detailed-design.md
- You MUST write the design as a standalone document that can be understood without reading other project files
- You MUST include the following sections in the design document:
  - Overview
  - Detailed Requirements (consolidated from idea-honing.md)
  - Architecture Overview
  - Components and Interfaces
  - Data Models
  - Error Handling
  - Testing Strategy
  - Appendices (Technology Choices, Research Findings, Alternative Approaches)
- You MUST consolidate all requirements from the idea-honing.md file into the Detailed Requirements section
- You MUST include an appendix section that summarizes key research findings, including:
  - Major technology choices with pros and cons
  - Existing solutions analysis
  - Alternative approaches considered
  - Key constraints and limitations identified during research
- You SHOULD include diagrams or visual representations when appropriate using mermaid syntax
- You MUST generate mermaid diagrams for architectural overviews, data flow, and component relationships
- You MUST ensure the design addresses all requirements identified during the clarification process
- You SHOULD highlight design decisions and their rationales, referencing research findings where applicable
- You MUST review the design with the user and iterate based on feedback
- You MUST offer to return to requirements clarification or research if gaps are identified during design

### 7. Develop Implementation Plan

Create a structured implementation plan with a series of steps for implementing the design.

**Constraints:**
- You MUST create an implementation plan at {project_dir}/implementation/plan.md
- You MUST include a checklist at the beginning of the plan.md file to track implementation progress
- You MUST use the following specific instructions when creating the implementation plan:
  ```
  Convert the design into a series of implementation steps that will build each component in a test-driven manner following agile best practices. Each step must result in a working, demoable increment of functionality. Prioritize best practices, incremental progress, and early testing, ensuring no big jumps in complexity at any stage. Make sure that each step builds on the previous steps, and ends with wiring things together. There should be no hanging or orphaned code that isn't integrated into a previous step.
  ```
- You MUST format the implementation plan as a numbered series of detailed steps
- Each step in the plan MUST be written as a clear implementation objective
- Each step MUST begin with "Step N:" where N is the sequential number
- You MUST ensure each step includes:
  - A clear objective
  - General implementation guidance
  - Test requirements where appropriate
  - How it integrates with previous work
  - **Demo** - explicit description of the working functionality that can be demonstrated after completing this step
- You MUST ensure each step results in working, demoable functionality that provides value
- You MUST sequence steps so that core end-to-end functionality is available as early as possible
- You MUST NOT include excessive implementation details that are already covered in the design document because this creates redundancy and potential inconsistencies
- You MUST assume that all context documents (requirements, design, research) will be available during implementation
- You MUST break down the implementation into a series of discrete, manageable steps
- You MUST ensure each step builds incrementally on previous steps
- You SHOULD prioritize test-driven development where appropriate
- You MUST ensure the plan covers all aspects of the design
- You SHOULD sequence steps to validate core functionality early
- You MUST ensure the checklist items correspond directly to the steps in the implementation plan
- If checkpointing is enabled, You MUST include checkpoint instructions in the implementation plan as described in Step 8.1

### 7.1. Add Checkpoint Instructions (if checkpointing enabled)

If the user has enabled checkpointing, add checkpoint instructions to the implementation plan.

**Constraints:**
- You MUST ONLY execute this step if the checkpointing parameter is not "false" or "none"
- You MUST add checkpoint instructions to the prompt plan based on the checkpointing type:
  - For "notes-only" or "notes": Add notes checkpointing instructions
  - For "git-only" or "git": Add git checkpointing instructions
  - For "both": Add both types of checkpointing instructions
- You MUST add checkpoint instructions after every step in the implementation plan
- You MUST create a checkpoint template section in the implementation plan
- You MUST include specific instructions for when and how to create checkpoints

**Checkpoint Instructions Format:**

For **Notes Checkpointing**:
```markdown
## Checkpoint Instructions

### Notes Checkpointing
After completing each step, create a checkpoint file at {project_dir}/implementation/checkpoint-step-N-complete.md with the following format:

**Template:**
```
# [Project Name] - Implementation Checkpoint

**Status:** Step N Complete - Ready for Step N+1
**Date:** [Current Date]
**Next Step:** [Brief description of next step]

## Completed Work

### ✅ Step N: [Step Title]
- [Key achievement 1]
- [Key achievement 2]
- [Key achievement 3]

[Include previous completed steps if this is not the first checkpoint]

## Technical Implementation Details

[Describe key technical decisions, architecture choices, or implementation patterns used]

## Test Results
[Include test results, coverage information, or validation outcomes]

## Next Steps - Step N+1: [Next Step Title]

### Objectives
[List the main objectives for the next step]

### Implementation Focus
[Describe the key areas of focus for the next implementation step]

## Files Status

### Core Implementation Files
- [List key files and their status: ✅ complete, 🔄 in progress, ⏳ placeholder]

### Test Files
- [List test files and their status]

## How to Continue

Reference this checkpoint and continue with:

> "Continue [Project Name] implementation with Step N+1: [Next Step Title]. [Brief guidance for continuation]"

---

**Ready for Step N+1**: [Summary of readiness state]
```

For **Git Checkpointing**:
```markdown
### Git Checkpointing
After completing each step, create a git commit with all src and test code changes:

**Constraints:**
- You MUST add and commit all changes in src/ and test/ directories
- You MUST NOT commit files in planning/ directory or build artifacts
- You MUST use descriptive commit messages following this format:
  ```
  feat: implement [brief description of completed work]

  - [Key achievement 1]
  - [Key achievement 2]
  - [Key achievement 3]

  Completes Step N of implementation plan
  ```
- You MUST verify the git status before committing
- You MUST assume the user has properly set up their git environment and branch

**Git Commands:**
```bash
# Add source and test files only
git add src/ test/

# Commit with descriptive message
git commit -m "feat: implement [description]

- [achievement 1]
- [achievement 2]

Completes Step N of implementation plan"
```
```

For **Both Types**:
Include both sets of instructions with a note that both should be executed at checkpoint intervals.
```

**Example Format (truncated):**
```markdown
# Implementation Prompt Plan

## Checklist
- [ ] Step 1: Set up project structure and core interfaces
- [ ] Step 2: Implement data models and validation
- [ ] Step 3: Create storage mechanism
- [ ] Step 4: Implement core business logic
- [ ] Step 5: Add API endpoints
- [ ] Step 6: Implement authentication and authorization
- [ ] Step 7: Add error handling and logging
- [ ] Step 8: Create integration tests
- [ ] Step 9: Wire everything together

## Steps

### Step 1: Set up project structure and core interfaces
Create the initial project structure following the architecture defined in the design document. Implement the core interfaces that will define the system boundaries.

1. Set up the directory structure for models, services, repositories, and API components
2. Create interface definitions for the core data models based on the requirements
3. Set up a basic test framework and add a simple smoke test
4. Create placeholder files for the main modules we'll implement

Focus on establishing a clean architecture with clear separation of concerns. Don't implement any business logic yet, just define the interfaces and structure.

**Demo:** A working project structure with placeholder endpoints that return mock data, demonstrating the basic application framework is functional.

### Step 2: Implement data models and validation
Implement the data models defined in the design document with appropriate validation rules.

1. Create the User model with validation for required fields as specified in the requirements
2. Implement the Document model with the relationships described in the design
3. Add unit tests for model validation that verify the requirements are met
4. Ensure all models implement the interfaces defined in Step 1

Focus on strong typing and validation to ensure data integrity throughout the system. Make sure to handle edge cases identified during the requirements clarification phase.

**Demo:** Working data models with validation that can create, validate, and serialize/deserialize data objects with proper error handling for invalid inputs.

[Additional steps continue...]
```

### 8. Summarize and Present Results

Provide a summary of all artifacts created and next steps.

**Constraints:**
- You MUST create a summary document at {project_dir}/summary.md
- You MUST list all artifacts created during the process
- You MUST provide a brief overview of the design and implementation plan
- You MUST suggest next steps for the user
- You SHOULD highlight any areas that may need further refinement
- You MUST present this summary to the user in the conversation
- If checkpointing is enabled, You MUST include checkpoint guidance in the summary

### 9. Implementation Checkpoint Execution (if checkpointing enabled)

Execute checkpointing during the implementation phase when following the prompt plan.

**Constraints:**
- You MUST ONLY execute checkpointing if the checkpointing parameter is not "false" or "none"
- You MUST create checkpoints after completing each step during implementation
- You MUST follow the checkpoint instructions created in Step 8.1
- For notes checkpointing, You MUST create checkpoint files in {project_dir}/implementation/
- For git checkpointing, You MUST create git commits with descriptive messages
- You MUST ensure checkpoint files capture:
  - Current progress status
  - Completed work summary
  - Technical implementation details
  - Test results and validation
  - Next steps and objectives
  - File status inventory
  - Clear continuation instructions
- You MUST ensure git commits include:
  - All src/ and test/ code changes
  - Descriptive commit messages with achievements
  - Reference to completed step number
- You MUST NOT include planning/ directory files in git commits because these are working documents not intended for the main codebase
- You MUST NOT include build artifacts, logs, or temporary files in git commits because these are generated files that should not be version controlled
- You MUST assume the user has properly configured their git environment and is on the appropriate branch
- You MUST provide clear instructions for how to continue from each checkpoint

## Examples

### Example Input

```
Rough idea: I want to build a feature for our team's internal tool that allows users to create and manage templates for common documents we produce. Users should be able to create, edit, and share templates, as well as use them to generate new documents with custom fields.

Project directory: docs/template-feature
```

### Example Output

```
# Research Phase Interaction

Based on your requirements, I've identified several areas that would benefit from research:

1. **Existing template solutions** - Understanding what's already available
2. **Storage and versioning approaches** - How to handle template versions and sharing
3. **Custom field validation patterns** - Best practices for dynamic field validation

I notice you have several additional MCP search tools available beyond the standard ones, including 'peccy web search' and other external search capabilities. Should I incorporate these additional search tools into the research process for broader coverage of template management solutions and industry best practices?

---

# Project Summary

I've completed the transformation of your rough idea into a detailed design with an implementation plan. Here's what was created:

## Directory Structure
- docs/template-feature/
  - rough-idea.md (your initial concept)
  - idea-honing.md (our Q&A requirements clarification)
  - research/
    - existing-templates.md
    - storage-options.md
    - external-solutions.md
  - design/
    - detailed-design.md
  - implementation/
    - plan.md (includes implementation checklist)
  - summary.md (this document)

## Key Design Elements
- Template management system with CRUD operations
- Role-based access control for sharing
- Versioning system for templates
- Custom fields with validation
- Document generation engine

## Implementation Approach
The implementation plan breaks down the work into 12 incremental steps, starting with core data models and building up to the complete feature set.

## Next Steps
1. Review the detailed design document at docs/template-feature/design/detailed-design.md
2. Check the implementation plan and checklist at docs/template-feature/implementation/plan.md
3. Begin implementation following the checklist in the implementation plan

Would you like me to explain any specific part of the design or implementation plan in more detail?
```

## Troubleshooting

### Requirements Clarification Stalls
If the requirements clarification process seems to be going in circles or not making progress:
- You SHOULD suggest moving to a different aspect of the requirements
- You MAY provide examples or options to help the user make decisions
- You SHOULD summarize what has been established so far and identify specific gaps
- You MAY suggest conducting research to inform requirements decisions

### Research Limitations
If you cannot access needed information:
- You SHOULD document what information is missing
- You SHOULD suggest alternative approaches based on available information
- You MAY ask the user to provide additional context or documentation
- You SHOULD continue with available information rather than blocking progress

### Design Complexity
If the design becomes too complex or unwieldy:
- You SHOULD suggest breaking it down into smaller, more manageable components
- You SHOULD focus on core functionality first
- You MAY suggest a phased approach to implementation
- You SHOULD return to requirements clarification to prioritize features if needed
