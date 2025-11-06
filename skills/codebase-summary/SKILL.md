---
name: codebase-summary
description: This script helps you generate comprehensive summary documentation for a codebase. It creates a structured set of metadata files that describe the system architecture, components, interfaces, and workflows. The documentation is organized in a way that makes it easy for an LLM to understand the system and assist with feature design. The script creates a knowledge base index file that agents can leverage when added to context, enabling more effective assistance with system-related tasks.
---

# Codebase Summary
## Overview

This script helps you generate comprehensive summary documentation for a codebase. It creates a structured set of metadata files that describe the system architecture, components, interfaces, and workflows. The documentation is
organized in a way that makes it easy for an LLM to understand the system and assist with feature
design. The script creates a knowledge base index file that agents can leverage when added to
context, enabling more effective assistance with system-related tasks.

## Parameters

- **output_dir** (optional, default: ".planning"): Directory where documentation will be stored
- **current_state_dir** (optional, default: "current_state"): Subdirectory for current state documentation
- **consolidate** (optional, default: true): Whether to create a consolidated AGENTS.md documentation file
- **check_consistency** (optional, default: true): Whether to check for inconsistencies across documents
- **check_completeness** (optional, default: true): Whether to identify areas lacking sufficient detail
- **update_mode** (optional, default: false): Whether to update existing documentation based on recent commits
- **code_analysis_depth** (optional, default: 2): Depth level for code analysis (1-3, where 3 is most detailed)
- **codebase_path** (optional, default: current directory): Path to the codebase to analyze

**Constraints for parameter acquisition:**
- You MUST ask for all parameters upfront in a single prompt
- You MUST confirm successful acquisition of all parameters before proceeding

## Steps

### 1. Setup Directory Structure

Create the necessary directory structure for organizing system metadata.

**Constraints:**
- You MUST create the output directory and subdirectories if they don't exist
- You MUST create the following directory structure:
  - {output_dir}/{current_state_dir}/ (for main documentation files)
  - {output_dir}/{current_state_dir}/code_analysis/ (for code analysis artifacts)
- You MUST inform the user about the directory structure being created
- If in update mode, you MUST:
  - Check if the index.md file exists in the specified output directory
  - Extract the last update timestamp from the index.md file
  - Verify the timestamp format and validity

### 2. Analyze codebase

Analyze the codebase to understand its structure, packages, and relationships.

**Constraints:**
- You MUST use appropriate tools to gather information about the codebase
- You MUST identify all packages in the codebase
- You MUST document basic codebase information in {output_dir}/{current_state_dir}/codebase_info.md
- If in update mode, you MUST:
  - Use git commands to identify commits that occurred after the last documentation update
  - Analyze which packages and files were modified in those commits
  - Prioritize documentation updates for the modified components
  - Create a change summary document listing all relevant changes since last update

### 3. Generate Codebase Overview

Create a high-level overview of the codebase structure.

**Constraints:**
- You MUST generate overview for the entire codebase
- You MUST save the codebase overview to {output_dir}/{current_state_dir}/code_analysis/codebase_overview.md
- You MUST document the high-level structure in {output_dir}/{current_state_dir}/architecture.md
- You MUST include information about file organization, major components, and their relationships
- You MUST extract key architectural patterns and design principles from the codebase
- You MUST organize the overview in a hierarchical structure for easy navigation
- You MUST document which parts of the codebase use supported vs. unsupported languages
- If in update mode, you MUST:
  - Compare the new overview with the existing one to identify structural changes
  - Document significant architectural changes in a "Recent Changes" section

### 4. Generate Documentation Files

Create documentation files for different aspects of the system.

**Constraints:**
- You MUST create a comprehensive knowledge base index file ({output_dir}/{current_state_dir}/index.md) that:
  - Provides explicit instructions for agents on how to use the documentation
  - Contains rich metadata about each file's purpose and content
  - Includes a table of contents with descriptive summaries for each document
  - Explains relationships between different documentation files
  - Guides an agent on which files to consult for specific types of questions
  - Contains brief summaries of each file's content to help determine relevance
  - Is designed to be the only file needed in context for an agent to effectively answer questions
  - Includes a timestamp indicating when the documentation was last generated or updated
- You MUST create placeholder files for each aspect of the system (architecture, components, interfaces, data models, workflows, dependencies) in {output_dir}/{current_state_dir}/
- You MUST create a project tracker to manage the documentation process
- You MUST ensure the index file is structured to be easily parsed by an agent when added to context
- If in update mode, you MUST:
  - Preserve existing documentation structure where possible
  - Only create new placeholder files for newly identified components
  - Mark updated sections in the documentation with an "Updated on [date]" notation

### 5. Review Documentation

Review the documentation for consistency and completeness.

**Constraints:**
- You MUST check for inconsistencies across documents
- You MUST identify areas lacking sufficient detail
- You MUST document any inconsistencies or gaps found in separate files
- You MUST specifically identify gaps resulting from language support limitations
- You SHOULD use insights from the code analysis to identify areas needing more detail

### 6. Consolidate Documentation

Create a consolidated AGENTS.md documentation file that combines all content from the current_state directory.

**Constraints:**
- You MUST create a consolidated AGENTS.md documentation file if requested
- You MUST organize the content in a coherent structure
- You MUST ensure the consolidated AGENTS.md file contains all necessary information
- You MUST include a comprehensive table of contents with descriptive summaries
- You MUST add metadata tags to each section to facilitate targeted information retrieval
- You MUST include cross-references between related sections
- You MUST clearly indicate sections with limited analysis due to language support constraints
- You MUST include information from code_analysis directory in the consolidated file

### 7. Summary and Next Steps

Provide a summary of the documentation process and suggest next steps.

**Constraints:**
- You MUST summarize what has been accomplished
- You MUST suggest next steps for using the documentation
- You MUST provide guidance on maintaining and updating the documentation
- You MUST include specific instructions for adding the documentation to an agents context:
  - Recommend using /context add {output_dir}/{current_state_dir}/index.md to add just the index file
  - Explain how an agent will leverage the index.md file as a knowledge base to find relevant information
  - Emphasize that the index.md contains sufficient metadata for an agent to understand which files contain detailed information
- If in update mode, you MUST:
  - Summarize what changes were detected and updated in the documentation
  - Highlight any significant architectural changes
  - Recommend areas that might need further manual review

## Update Mode Implementation

When running in update mode, the script follows these steps to update existing documentation:

1. **Extract Last Update Timestamp**
   - Reads the index.md file to find the "Last Updated" timestamp
   - Validates the timestamp format (ISO 8601)
   - Uses this timestamp as the reference point for finding changes

2. **Identify Recent Changes**
   - Uses git commands to find commits after the last update timestamp:
     bash
    git log --since="[TIMESTAMP]" --name-status


   - Analyzes which packages and files were modified
   - Creates a change summary document listing all relevant changes

3. **Selective Documentation Update**
   - Updates only documentation sections related to changed components
   - Preserves existing documentation for unchanged components
   - Adds "Updated on [date]" notations to modified sections
   - Creates a "Recent Changes" section in the index.md file

4. **Update Timestamp**
   - Updates the "Last Updated" timestamp in the index.md file to the current time
   - Ensures the timestamp is in ISO 8601 format for future updates

## Examples

### Example Input


Run codebase-summary.script.md output_dir=custom_docs code_analysis_depth=3

### Example Output

Verifying dependencies...
✅ All required tools are available.

Setting up directory structure...
✅ Created directory custom_docs/current_state/
✅ Created directory custom_docs/current_state/code_analysis/

Analyzing codebase...
✅ Found 12 packages in the codebase.
✅ Codebase information saved to custom_docs/current_state/codebase_info.md

Building code index...
⏳ This may take a few minutes for large codebases...
✅ Code index built successfully!
✅ Supported languages detected: Java (full support), JavaScript (full support), Python (full
support)
✅ Partially supported languages: Go (basic structure only)

Generating codebase overview...
✅ Codebase overview saved to custom_docs/current_state/code_analysis/codebase_overview.md
✅ Architecture documentation saved to custom_docs/current_state/architecture.md

Generating documentation files...
✅ Created index.md with knowledge base metadata
✅ Created placeholder files for all system aspects
✅ Project tracker created at custom_docs/project_tracker.md

Reviewing documentation...
✅ Consistency check complete
✅ Completeness check complete
✅ Found 3 areas needing more detail (documented in custom_docs/incomplete.md)

Consolidating documentation...
✅ Consolidated AGENTS.md documentation created

Summary and Next Steps:
✅ Documentation generation complete!

### Example Usage


Run codebase-summary.script.md

This will generate documentation in the default .planning directory, check for inconsistencies and completeness, and create a consolidated documentation file.

For more specific configuration:


Run codebase-summary.script.md output_dir=.my_documentation consolidate=true code_analysis_depth=3

To update existing documentation based on recent commits:


Run codebase-summary.script.md update_mode=true output_dir=.planning

To analyze a specific codebase path:


Run codebase-summary.script.md codebase_path=/path/to/your/codebase

### Example Output Structure


AGENTS.md
.planning/
├── current_state/
│   ├── index.md
│   ├── codebase_info.md
│   ├── architecture.md
│   ├── components.md
│   ├── interfaces.md
│   ├── data_models.md
│   ├── workflows.md
│   ├── dependencies.md
│   └── code_analysis/
│       ├── codebase_overview.md
│       ├── component_details.md
│       └── symbol_references.md
├── project_tracker.md
├── inconsistencies.md
└── incomplete.md


## Desired Outcome

* A complete, well-structured documentation set for the codebase
* A comprehensive knowledge base index file that can be added to an agents context
* Clear documentation of the system architecture, components, interfaces, and workflows
* Identification of any inconsistencies or gaps in the documentation
* A consolidated AGENTS.md documentation file (if requested) that combines all content
* A seamless experience for users to understand and navigate their codebase

## Troubleshooting

### Large Codebase Performance
For very large codebases, the script may take some time to run. Consider:
• Setting a specific codebase_path to focus on a subset of the codebase
• Reducing the code_analysis_depth parameter
• Breaking the analysis into smaller chunks by running the script multiple times with different focus areas

### Update Mode Issues
If update mode fails to detect changes correctly:
• Verify that the index.md file contains a valid timestamp in ISO format
• Check if git history is available and accessible
• Try running in non-update mode to generate fresh documentation