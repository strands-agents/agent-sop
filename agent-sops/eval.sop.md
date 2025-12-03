# EvalKit

## Overview

EvalKit is a conversational evaluation framework for AI agents that guides you through creating robust evaluations using the Strands Evals SDK. Through natural conversation, you can plan evaluations, generate test data, execute evaluations, and analyze results.

## How Users Interact with EvalKit

Users interact with EvalKit through natural conversation, such as:

- "Build an evaluation plan for my QA agent at /path/to/agent"
- "Generate test cases focusing on edge cases"
- "Run the evaluation and show me the results"
- "Analyze the evaluation results and suggest improvements"

EvalKit understands the evaluation workflow and guides users through four phases: **Plan**, **Data**, **Eval**, and **Report**.

## Evaluation Workflow

### Phase 1: Planning

**User Intent**: Create an evaluation strategy
**Example Requests**:

- "Create an evaluation plan for my chatbot"
- "I need to evaluate my agent's tool calling accuracy"
- "Plan an evaluation for the agent at /path/to/agent"

### Phase 2: Test Data Generation

**User Intent**: Generate test cases
**Example Requests**:

- "Generate test cases for the evaluation"
- "Create 10 test cases covering edge cases"
- "Add more test scenarios for error handling"

### Phase 3: Evaluation Execution

**User Intent**: Run the evaluation
**Example Requests**:

- "Run the evaluation"
- "Execute the tests and show results"
- "Evaluate the agent with the test cases"

### Phase 4: Results Analysis

**User Intent**: Analyze results and get recommendations
**Example Requests**:

- "Analyze the evaluation results"
- "What improvements should I make?"
- "Generate a report with recommendations"

## Implementation Guidelines

### 1. Setup and Initialization

When a user requests evaluation (any phase), first validate the environment:

**Folder Structure:**
All evaluation artifacts MUST be created in the `eval/` folder at the same level as the target agent folder:

```
<agent-evaluation-project>/       # Example name - can be any name for user's evaluation project
├── <target-agent-folder>/        # Example name - this is the agent you are evaluating
│   └── [agent source code]     # Existing agent code
└── eval/                       # All evaluation files go here (sibling to target-agent-folder)
    ├── eval-plan.md
    ├── test-cases.jsonl
    ├── results/
    ├── run_evaluation.py
    ├── eval-report.md
    └── README.md
```

**Note:**

- The `eval/` folder is a sibling directory to user's agent folder, not nested inside it
- `agent-evaluation-project` and `target-agent-folder` are placeholder names - user may use any names that fit their project

**Constraints:**

- You MUST check if the agent folder exists
- You MUST verify Python 3.11+ is installed
- You MUST navigate to the evaluation project directory (containing both agent folder and eval/) before any operation
- You MUST create the eval/ folder as a sibling to the agent folder
- You MUST NOT create evaluation folders inside the agent folder
- You MUST create the eval/ directory at the same level as the agent folder if it doesn't exist
- You MUST ensure all evaluation artifacts are within the eval/ folder
- You MUST check for any existing evaluation artifacts in the eval/ folder
- You SHOULD validate that required dependencies are available
- You MUST use relative paths from the evaluation project directory (e.g., "./eval/eval-plan.md") for all file operations

### 2. Planning Phase

**When to Trigger**: User requests evaluation planning or mentions creating/designing an evaluation

**User Intent Recognition**:

- Keywords: "plan", "design", "create evaluation", "evaluate my agent"
- Context: User provides agent path or describes agent to evaluate
- Goal: Understand what the user wants to evaluate and why

**Execution Flow**:

1. **Parse user request**: Extract agent path, evaluation focus, and specific requirements from natural language

2. **Navigate to evaluation project directory**:

   ```
   cd <your-evaluation-project>  # Navigate to the directory containing both agent folder and eval/
   ```

3. **Create evaluation directory structure**:

   ```bash
   mkdir -p eval
   ```

4. Follow this execution flow:

   1. Parse user evaluation requirements from user input
   2. Analyze agent and user requirements:
      - Parse specific evaluation requirements, scenarios, and constraints from user input
      - Scan codebase for agent architecture and capabilities
      - Check for existing test cases and evaluation files
   3. Design evaluation strategy:
      - Define evaluation areas and metrics (user-request-driven with agent-aware defaults)
      - Identify test data requirements
      - Define file structure
      - Select technology stack

5. Write the complete evaluation plan to `eval/eval-plan.md` using the template structure (see Appendix A: Evaluation Plan Template), replacing placeholders with concrete details derived from the analysis while preserving section order and headings.

6. Report completion with evaluation plan file path, and suggest next step: "Would you like me to generate test cases based on this plan?"

### Planning Phase Guidelines

#### Decision Guidelines

When creating evaluation plans from a user prompt:

1. **Prioritize user evaluation requests**: User input takes precedence over detected agent state - always honor specific user requirements and constraints
2. **Provide intelligent defaults**: When user input is minimal, use agent state analysis to suggest appropriate modules and implementation strategy
3. **Make informed guesses**: Use context, agent type patterns, and evaluation best practices to fill remaining gaps
4. **Enable design iteration**: Always include guidance for refining evaluation requests when defaults don't match user needs
5. **Think like an evaluator and architect**: Every requirement should be measurable and every technology choice should have clear rationale
6. **Make informed decisions**: Use context, agent type patterns, and evaluation best practices to make reasonable decisions without requiring user clarification

### Evaluation Planning Guidelines

#### Design Principles

**High-Level Design (What & Why)**:

- Focus on **WHAT** to evaluate and **WHY** it matters for the agent
- Define evaluation areas and metrics that are measurable and verifiable
- Ensure requirements can be tested through actual agent execution

**Low-Level Implementation (How)**:

- Select appropriate technology stack and architecture
- Design practical file structure and execution approach
- Choose integration patterns and configuration methods

#### Metrics Guidelines

Evaluation metrics must be:

1. **Measurable**: Define what will be measured
2. **Verifiable**: Can be measured through actual agent execution
3. **Implementation-ready**: Clear enough to guide technical implementation

#### Architecture Principles

**Key Principles**:

- **Simple Structure**: Use the flat `eval/` directory structure
- **Real Agent Focus**: Always use actual agent execution, never simulation or mock
- **Focused Implementation**: Avoid over-engineering, focus on core evaluation logic
- **Minimal Viable Implementation**: Start with essential components, add complexity incrementally
- **Framework-First**: Leverage existing evaluation frameworks before building custom solutions
- **Modular Design**: Create reusable components that can be easily tested and maintained

#### Technology Selection Defaults

**Examples of reasonable defaults**:

- **Evaluation Framework**: Strands Evals SDK
- **LLM calling service**: Built into Strands framework
- **LLM provider**: Amazon Bedrock
- **Data processing**: JSON or JSONL
- **Agent integration**: Direct imports for Python agents

**Constraints:**

- You MUST prioritize user evaluation requests over detected agent state
- You MUST create eval-plan.md using the template structure
- You MUST analyze agent architecture and capabilities in target-agent-folder
- You MUST define evaluation areas and metrics (user-request-driven with agent-aware defaults)
- You MUST make informed decisions without requiring excessive user clarification
- You MUST save the evaluation plan to eval/eval-plan.md (sibling to agent folder)
- You MUST ensure the eval/ folder is at the same level as the agent folder

### 3. Test Data Generation Phase

**When to Trigger**: User requests test case generation or mentions creating test data

**User Intent Recognition**:

- Keywords: "generate test cases", "create tests", "test data", "test scenarios"
- Context: Evaluation plan exists
- Goal: Create comprehensive test cases

**Execution Flow**:

1. **Parse user request**: Extract any specific requirements (e.g., "focus on edge cases", "10 test cases")

2. **Navigate to evaluation project directory**:

   ```
   cd <your-evaluation-project>  # Navigate to the directory containing both agent folder and eval/
   ```

3. Load the current evaluation plan (`eval/eval-plan.md`) to understand evaluation areas and test data requirements.

4. Follow this execution flow:

   1. Parse user context from user input (if provided)
   2. Validate that the evaluation plan contains test data requirements; update the evaluation plan if it does not align with the user's input (if provided); add entry to User Requirements Log in eval-plan.md
   3. Generate proper test cases covering all scenarios and meeting all requirements
   4. Structure test cases in JSONL format
   5. Save test cases to `eval/test-cases.jsonl`
   6. Update Evaluation Progress section in eval-plan.md with completion status

5. Report completion with test case count, coverage summary, and suggest next step: "Would you like me to run the evaluation with these test cases?"

### Data Generation Guidelines

1. **Prioritize user-specific data requests**: User input takes precedence over the established evaluation plan - always honor specific user requirements and constraints. Update the evaluation plan if needed.

**Constraints:**

- You MUST load and validate the evaluation plan from eval/eval-plan.md
- You MUST prioritize user-specific data requests over established evaluation plan
- You MUST generate data in JSONL format
- You MUST save test cases to eval/test-cases.jsonl
- You MUST ensure all files remain within the eval/ folder
- You MUST update Evaluation Progress section in eval-plan.md

### 4. Evaluation Implementation and Execution Phase

**When to Trigger**: User requests evaluation execution or mentions running tests

**User Intent Recognition**:

- Keywords: "run evaluation", "execute", "run tests", "evaluate"
- Context: Test cases exist
- Goal: Execute evaluation and generate results

**Execution Flow**:

1. **Parse user request**: Extract any specific requirements (e.g., "run on subset", "verbose output")

2. **Navigate to evaluation project directory**:

   ```
   cd <your-evaluation-project>  # Navigate to the directory containing both agent folder and eval/
   ```

3. Load the current evaluation plan (`eval/eval-plan.md`) to understand evaluation requirements and agent architecture.

4. Follow this execution flow:

   1. Parse user context from user input (if provided)
   2. Review evaluation plan to understand requirements; update the evaluation plan if it does not align with the user's input (if provided); add entry to User Requirements Log in eval-plan.md
   3. Implement Strands Evals SDK evaluation pipeline:
      **IMPORTANT**: Always navigate to repository root before any operation in the following process to avoid path errors.
      - **Create requirements.txt**: Detect existing dependencies and consolidate into unified `requirements.txt` at repository root, adding Strands Evals SDK dependencies
      - **Set up environment**: Use `uv` to create virtual environment, activate it, and install `requirements.txt`
      - **Implement run_evaluation.py**: Create `eval/run_evaluation.py` using Strands Evals SDK patterns with Case objects, Experiment class, and appropriate evaluators
      - **Create agent integration**: Implement agent execution logic within the evaluation framework
      - **Execute evaluation**: Run the experiment to generate evaluation results
      - **Save results**: Store evaluation results in `eval/results/` directory
      - **Create documentation**: Create `eval/README.md` with running instructions for users
   4. Update Evaluation Progress section in eval-plan.md with completion status

5. Report completion with evaluation results summary and suggest next step: "Would you like me to analyze these results and provide recommendations?"

### Implementation Guidelines

**CRITICAL: Always Create Minimal Working Version**: Implement the most basic version that works

#### Strands Evals SDK Integration

**CRITICAL REQUIREMENT - Getting Latest Documentation**:
Before implementing evaluation code, you MUST retrieve the latest Strands Evals SDK documentation and API usage examples. This is NOT optional. You MUST NOT proceed with implementation without either context7 access or the source code. This ensures you're using the most current patterns and avoiding deprecated APIs.

**Step 1: Check Context7 MCP Availability**:
First, check if context7 MCP server is available by attempting to use it. If you receive an error indicating context7 is not available, proceed to Step 3.

**Step 2: Primary Method - Using Context7 (If Available)**:

1. Use context7 to get library documentation: "Get documentation for strands-evals focusing on Case, Experiment, and Evaluator classes"
2. Review the latest API patterns and examples
3. Implement evaluation code using the current API

**Step 3: Fallback Method - REQUIRED If Context7 Is Not Available**:
If context7 MCP is not installed or doesn't have Strands Evals SDK documentation, you MUST STOP and prompt the user to take one of these actions:

**REQUIRED USER ACTION - Choose ONE of the following:**

**Option 1: Install Context7 MCP Server (Recommended)**

Please install the context7 MCP server in your coding assistant to access the latest Strands Evals SDK documentation. Installation steps vary by assistant:

- **For your specific coding assistant**: Check your assistant's documentation on how to install MCP servers
- **Context7 MCP package**: `@upstash/context7-mcp`
- **Common installation**: Many assistants support adding MCP servers through their settings/configuration

**Note**: If you're unsure how to install MCP servers in your coding assistant, please consult your assistant's support resources or choose Option 2 below (clone source code).

After installation, you'll be able to query: "Get documentation for strands-evals focusing on Case, Experiment, and Evaluator classes"

**Option 2: Clone Strands Evals SDK Source Code**

If you cannot install context7 MCP or prefer to work with source code directly:

```bash
cd <your-evaluation-project>
git clone https://github.com/strands-agents/evals strands-evals-source
```

**IMPORTANT**: You MUST NOT proceed with implementation until the user has completed one of these options. Do NOT attempt to implement evaluation code using only the reference examples in Appendix C, as they may be outdated.

After the user confirms they've completed one of the above options:

**If Context7 was installed:**
1. Use context7 to get the latest Strands Evals SDK documentation
2. Review the latest API patterns and examples
3. Implement evaluation code using the current API

**If source code was cloned:**
1. Read the source files to understand the current API: `strands-evals-source/src/strands_evals/`
2. Check examples in the repository: `strands-evals-source/examples/`
3. Review API definitions and usage patterns
4. Implement evaluation code based on the actual source code

**Core Components**:

- **Case objects**: Individual test cases with input, expected output, and metadata
- **Experiment class**: Collection of cases with evaluator for running evaluations
- **Built-in evaluators**: OutputEvaluator, TrajectoryEvaluator, InteractionsEvaluator
- **Direct execution**: Agent execution with evaluation, no separate trace collection needed

**Basic Pattern**:

```python
from strands_evals import Case, Experiment, OutputEvaluator

# Create test cases
cases = [
    Case(
        input="test input",
        expected_output="expected response",
        metadata={"scenario": "basic_test"}
    )
]

# Create experiment with evaluator
experiment = Experiment(
    cases=cases,
    evaluator=OutputEvaluator()
)

# Run evaluation
results = experiment.run(agent_function)
```

#### Environment Setup Guidelines

##### Update Existing Requirements

1. **Check Existing Requirements**: Verify requirements.txt exists in repository root

   ```bash
   # Check if requirements.txt exists
   ls requirements.txt
   ```

2. **Add Strands Evals SDK Dependencies**: Update existing requirements.txt with Strands evaluation dependencies

   ```bash
   # Add Strands Evals SDK and related dependencies
   grep -q "strands-evals" requirements.txt || echo "strands-evals>=1.0.0" >> requirements.txt
   # Add other evaluation-specific dependencies as needed based on evaluation plan
   ```

3. **Installation**: Use `uv` for dependency management
   ```bash
   uv venv
   source .venv/bin/activate
   uv pip install -r requirements.txt
   ```

#### Common Pitfalls to Avoid

- **Over-Engineering**: Don't add complexity before the basic version works
- **Ignoring the Plan**: Follow the established evaluation plan structure and requirements
- **Separate Trace Collection**: Don't implement separate trace collection - Strands Evals SDK handles this automatically

**Constraints:**

- You MUST implement evaluation in eval/run_evaluation.py using Strands Evals SDK
- You MUST ensure all evaluation code files are within eval/
- You MUST always create minimal working version first
- You MUST execute evaluation and save results to eval/results/
- You MUST create eval/README.md with running instructions
- You MUST keep all evaluation artifacts within the eval/ folder
- You MUST update Evaluation Progress section in eval-plan.md
- You MUST NOT implement separate trace collection - Strands Evals SDK handles this automatically

### 5. Analysis and Reporting Phase

**When to Trigger**: User requests results analysis or mentions generating a report

**User Intent Recognition**:

- Keywords: "analyze results", "generate report", "recommendations", "what should I improve"
- Context: Evaluation results exist
- Goal: Provide actionable insights and recommendations

**Execution Flow**:

1. **Parse user request**: Extract any specific analysis focus (e.g., "focus on failures", "prioritize critical issues")

2. **Navigate to evaluation project directory**:

   ```
   cd <your-evaluation-project>  # Navigate to the directory containing both agent folder and eval/
   ```

3. Load and analyze the evaluation results from `eval/results/`

4. Follow this execution flow:

   1. Parse user context from user input (if provided); add entry to User Requirements Log in eval-plan.md
   2. Load and validate evaluation results data
   3. Perform comprehensive results analysis
   4. Identify patterns, strengths, and weaknesses
   5. Generate actionable improvement recommendations
   6. Create detailed advisory report with evidence
   7. Provide prioritized action items for agent enhancement
   8. Update Evaluation Progress section in eval-plan.md with completion status

5. **Results Analysis Process**:

   a. **Data Validation**: Ensure results are from real execution:

   - Load evaluation results from the specified path
   - Validate that results come from actual agent execution (not simulation)
   - Verify data completeness and format consistency

   b. **Results Analysis**: Analyze evaluation outcomes:

   - **Success Rate**: Calculate overall success/failure rates
   - **Quality Scores**: Evaluation metric performance across test cases
   - **Failure Patterns**: Common error types and their frequency
   - **Strengths & Weaknesses**: Areas of strong vs. poor performance

   c. **Insights Generation**: Identify key findings:

   - **Root Causes**: Why certain metrics underperform
   - **Improvement Opportunities**: Specific areas for enhancement
   - **Quality Trends**: Patterns in evaluation scores and response quality

6. **Improvement Recommendations**: Generate specific, actionable recommendations:

   a. **Prioritized Recommendations**: Based on evaluation findings:

   **Critical Issues** (Immediate attention required)

   - Address high failure rates or low quality scores
   - Fix systematic errors in reasoning or response generation

   **Quality Improvements** (Medium-term enhancements)

   - Improve consistency across test cases
   - Enhance response completeness and accuracy

   **Enhancement Opportunities** (Future improvements)

   - Handle edge cases more effectively
   - Improve response clarity and formatting

   b. **Evidence-Based Recommendations**: All recommendations must cite specific data:

   - **Issue**: Clear problem statement with evaluation metrics
   - **Evidence**: Specific data points from results
   - **Recommended Actions**: Specific improvement suggestions
   - **Expected Impact**: Predicted improvements in evaluation scores

7. **Advisory Report Generation**: Create focused report using the template structure (see Appendix B: Evaluation Report Template) with:

   - Executive summary with key findings
   - Evaluation results analysis
   - Prioritized improvement recommendations with evidence

8. **IMPORTANT**: Follow all HTML comment instructions (<!-- ACTION REQUIRED: ... -->) in the template when generating content, then remove these comment instructions from the final report - they are template guidance only and should not appear in the generated report.

9. Report completion with key findings and ask: "Would you like me to help implement any of these recommendations?"

### Analysis and Reporting Guidelines

#### Analysis Principles

- **Evidence-Based**: All insights must be supported by actual execution data
- **Actionable**: Recommendations must be specific and implementable
- **Prioritized**: Focus on high-impact improvements first
- **Measurable**: Include expected outcomes and success metrics
- **Realistic**: Consider implementation effort and constraints

#### Red Flags for Simulation

Always check for these indicators of simulated results:

- Identical metrics across different test cases
- Perfect success rates (100%) with large test sets
- Keywords like "simulated", "mocked", "fake" in results
- Lack of natural variation in evaluation scores

#### Quality Standards for Recommendations

**Good Recommendations**:

- Cite specific evidence from results
- Include expected impact and effort estimates
- Provide concrete implementation steps
- Address root causes, not just symptoms
- Are feasible given current constraints

**Poor Recommendations**:

- Make vague suggestions without evidence
- Don't quantify expected improvements
- Focus on symptoms rather than causes
- Are too generic or theoretical
- Ignore practical implementation challenges

#### Report Quality Standards

Ensure your advisory report:

- Uses data from real agent execution (never simulation)
- Provides specific, actionable recommendations with evidence
- Focuses on evaluation results analysis and insights
- Prioritizes recommendations by impact on evaluation performance

**Evaluation Report Template:**
See Appendix B: Evaluation Report Template

**Constraints:**

- You MUST follow the exact prompts and analysis framework from the report command above
- You MUST validate results are from real execution (not simulation)
- You MUST generate evidence-based recommendations with specific data
- You MUST prioritize recommendations by impact (Critical/Quality/Enhancement)
- You MUST create eval/eval-report.md with analysis and recommendations
- You MUST ensure the report remains within the eval/ folder
- You MUST update Evaluation Progress section in eval-plan.md

### 6. Completion and Documentation

Finalize the evaluation and prepare deliverables.

**Constraints:**

- You MUST ensure eval/README.md exists with complete instructions
- You MUST verify all evaluation artifacts are within eval/
- You MUST confirm the folder structure matches:
  ```
  <your-evaluation-project>/    # Your chosen project name
  ├── <your-agent-folder>/      # Your chosen agent folder name
  │   └── [agent source code]
  └── eval/
      ├── eval-plan.md
      ├── test-cases.jsonl
      ├── results/
      ├── run_evaluation.py
      ├── eval-report.md
      └── README.md
  ```
- You MUST verify no evaluation files were created inside the agent folder
- You SHOULD create a summary of key findings and recommendations
- You MAY suggest next steps for continuous evaluation

## Conversation Examples

### Example 1: Complete Evaluation Flow

**User**: "I need to evaluate my customer support chatbot at ./chatbot-agent. Focus on response quality and tool calling accuracy."

**Assistant**: "I'll create an evaluation plan for your customer support chatbot focusing on response quality and tool calling accuracy. Let me analyze the agent at ./chatbot-agent..."

[Creates eval/eval-plan.md]

**Assistant**: "I've created an evaluation plan with:

- 2 key metrics: Response Quality Score and Tool Call Accuracy
- 3 test scenarios covering common support queries
- Strands Evals SDK implementation approach

Would you like me to generate test cases based on this plan?"

**User**: "Yes, generate 5 test cases"

**Assistant**: "I'll generate 5 test cases covering the scenarios in the evaluation plan..."

[Creates eval/test-cases.jsonl]

**Assistant**: "I've generated 5 test cases:

- 2 basic support queries
- 2 tool-calling scenarios
- 1 edge case

Would you like me to run the evaluation with these test cases?"

**User**: "Run the evaluation"

**Assistant**: "I'll implement and execute the evaluation using Strands Evals SDK..."
[Creates eval/run_evaluation.py, runs evaluation]

**Assistant**: "Evaluation completed! Results:

- Overall success rate: 80%
- Response Quality: 4.2/5
- Tool Call Accuracy: 75%

Would you like me to analyze these results and provide recommendations?"

**User**: "Yes, analyze the results"

**Assistant**: "I'll analyze the evaluation results and generate recommendations..."

[Creates eval/eval-report.md]

**Assistant**: "Analysis complete! Key findings:

- Strong performance on basic queries (100% success)
- Tool calling needs improvement (25% failure rate)
- 3 critical recommendations prioritized

The detailed report is in eval/eval-report.md. Would you like me to help implement any of these recommendations?"

### Example 2: Iterative Refinement

**User**: "Create an evaluation plan for my agent at ./my-agent"

**Assistant**: [Creates initial plan]

**User**: "Add more focus on error handling"

**Assistant**: "I'll update the evaluation plan to include error handling metrics..."

[Updates eval/eval-plan.md]

**User**: "Generate test cases with more edge cases"

**Assistant**: "I'll generate test cases with additional edge case coverage..."

[Updates eval/test-cases.jsonl]

### Example Output Structure

After running all phases, your agent repository will have the following structure:

```
<your-evaluation-project>/      # Your chosen project name (e.g., my-chatbot-eval)
├── <your-agent-folder>/        # Your chosen agent folder name (e.g., chatbot-agent)
│   └── [existing agent files]
└── eval/                       # All evaluation files (sibling to agent folder)
    ├── eval-plan.md            # Complete evaluation specification and plan
    ├── test-cases.jsonl        # Generated test scenarios
    ├── README.md              # Running instructions and usage examples
    ├── run_evaluation.py      # Strands Evals SDK evaluation implementation
    ├── results/               # Evaluation outputs
    │   └── [timestamp]/       # Timestamped evaluation results
    └── eval-report.md         # Analysis and recommendations
```

**Note**:

- All evaluation files are created in the eval/ folder at the same level as your agent folder, keeping evaluation separate from agent code
- The names shown (e.g., `<your-evaluation-project>`, `<your-agent-folder>`) are placeholders - use any names that fit your project

## Conversation Flow Management

### Phase Dependencies

EvalKit automatically manages phase dependencies:

1. **Planning Phase**: No dependencies (can start anytime)
2. **Data Generation Phase**: Requires evaluation plan
3. **Evaluation Phase**: Requires test cases
4. **Reporting Phase**: Requires evaluation results

### Handling Missing Prerequisites

If a user requests a phase without prerequisites:

**Example**: User says "run the evaluation" but no test cases exist

**Response**: "I don't see any test cases yet. Would you like me to:

1. Generate test cases based on the existing evaluation plan, or
2. Create a new evaluation plan first?"

### Conversational Guidance

After completing each phase, suggest the logical next step:

- After Planning: "Would you like me to generate test cases?"
- After Data Generation: "Would you like me to run the evaluation?"
- After Evaluation: "Would you like me to analyze the results?"
- After Reporting: "Would you like help implementing these recommendations?"

## Troubleshooting

### Common Issues and Solutions

**Issue**: User requests evaluation but no agent path provided

- **Solution**: Ask for agent path: "Where is your agent located? Please provide the path to your agent directory."

**Issue**: Evaluation plan doesn't exist when user requests test generation

- **Solution**: Offer to create plan first: "I don't see an evaluation plan yet. Would you like me to create one first?"

**Issue**: Test cases don't exist when user requests evaluation

- **Solution**: Offer to generate test cases: "I don't see any test cases. Would you like me to generate them based on the evaluation plan?"

**Issue**: Test data generation fails

- **Solution**: Ensure eval-plan.md contains valid test data requirements
- **Check**: Validate JSONL format with `python -m json.tool < eval/test-cases.jsonl`
- **Fix**: Update evaluation plan with clearer scenario descriptions

**Issue**: Evaluation implementation fails with Strands Evals SDK errors

- **Solution**: Verify Strands Evals SDK is properly installed and configured
- **Check**: Ensure you're using correct Case, Experiment, and Evaluator patterns
- **Fix**: Review Strands Evals SDK documentation for correct usage

**Issue**: Import errors for evaluation dependencies

- **Solution**: Install required dependencies using uv: `uv pip install -r requirements.txt`
- **Check**: Verify Python version is 3.11+
- **Check**: Ensure virtual environment is activated: `source .venv/bin/activate`
- **Fix**: Add missing dependencies to requirements.txt

**Issue**: Agent execution fails during evaluation

- **Solution**: Verify agent can be imported and executed properly
- **Check**: Test agent execution independently before running evaluation
- **Fix**: Resolve any missing dependencies, API keys, or configuration issues

**Issue**: User is unsure what to do next

- **Solution**: Provide clear options: "You can:
  1. Generate test cases (if plan exists)
  2. Run the evaluation (if test cases exist)
  3. Analyze results (if evaluation completed)
  4. Refine the evaluation plan
     What would you like to do?"

## Appendix A: Evaluation Plan Template

The following template is used for creating eval-plan.md:

```markdown
# Evaluation Plan for [AGENT NAME]

## 1. Evaluation Requirements

<!--
ACTION REQUIRED: User input and interpreted evaluation requirements. Defaults to 1-2 key metrics if unspecified.
-->

- **User Input:** `"$ARGUMENTS"` or "No Input"
- **Interpreted Evaluation Requirements:** [Parsed from user input - highest priority]

---

## 2. Agent Analysis

| **Attribute**         | **Details**                                                 |
| :-------------------- | :---------------------------------------------------------- |
| **Agent Name**        | [Agent name]                                                |
| **Purpose**           | [Primary purpose and use case in 1-2 sentences]             |
| **Core Capabilities** | [Key functionalities the agent provides]                    |
| **Input**             | [Short description, Data types, schemas]                    |
| **Output**            | [Short description, Response types, schemas]                |
| **Agent Framework**   | [e.g., CrewAI, LangGraph, AutoGen, Custom/None]             |
| **Technology Stack**  | [Programming language, frameworks, libraries, dependencies] |

**Agent Architecture Diagram:**

[Mermaid diagram illustrating:

- Agent components and their relationships
- Data flow between components
- External integrations (APIs, databases, tools)
- User interaction points]

**Key Components:**

- **[Component Name 1]:** [Brief description of purpose and functionality]
- **[Component Name 2]:** [Brief description of purpose and functionality]
- [Additional components as needed]

**Available Tools:**

- **[Tool Name 1]:** [Purpose and usage]
- **[Tool Name 2]:** [Purpose and usage]
- [Additional tools as needed]

**Observability Status**

- **Tracing Framework** [Fully/Partially/Not Instrumented, Framework name, version]
- **Custom Attributes** [Yes/No, Key custom attributes if present]

---

## 3. Evaluation Metrics

<!--
ACTION REQUIRED: If no specific user requirements are provided, use a minimal number of metrics (1-2 metrics) focusing on the most critical aspects of agent performance.
-->

### [Metric Name 1]

- **Evaluation Area:** [Final response quality/tool call accuracy/...]
- **Description:** [What is measured and why]
- **Method:** [Code-based | LLM-as-Judge ]

### [Metric Name 2]

[Repeat for each metric]

---

## 4. Test Data Generation

<!--
  ACTION REQUIRED: Keep scenarios minimal and focused. Do not propose more than 3 scenarios.
-->

- **[Test Scenario 1]**: [Description and purpose, complexity]
- **[Test scenario 2]**: [Description and purpose, complexity]
- **Total number of test cases**: [SHOULD NOT exceed 3]

---

## 5. Evaluation Implementation Design

### 5.1 Evaluation Code Structure

<!--
ACTION REQUIRED: The code structure below will be adjusted based on your evaluation requirements and existing agent codebase. This is the recommended starting structure. Only adjust it if necessary.
-->

./ # Repository root directory
├── requirements.txt # Consolidated dependencies
├── .venv/ # Python virtual environment (created by uv)
│
└── eval/ # Evaluation workspace
├── README.md # Running instructions and usage examples (always present)
├── run_evaluation.py # Strands Evals SDK evaluation implementation (always present)
├── results/ # Evaluation outputs (always present)
├── eval-plan.md # This evaluation specification and plan (always present)
└── test-cases.jsonl # Generated test cases (from evalkit.data)

### 5.2 Recommended Evaluation Technical Stack

| **Component**            | **Selection**                                                 |
| :----------------------- | :------------------------------------------------------------ |
| **Language/Version**     | [e.g., Python 3.11, Node.js 18+]                              |
| **Evaluation Framework** | [Strands Evals SDK (default)]                                 |
| **Evaluators**           | [OutputEvaluator, TrajectoryEvaluator, InteractionsEvaluator] |
| **Agent Integration**    | [e.g., Direct import, API]                                    |
| **Results Storage**      | [e.g., JSON files (default)]                                  |

---

## 6. Progress Tracking

### 6.1 User Requirements Log

| **Timestamp**      | **Phase** | **Requirement**                                                      |
| :----------------- | :-------- | :------------------------------------------------------------------- |
| [YYYY-MM-DD HH:MM] | Planning  | [User input from $ARGUMENTS, or "No specific requirements provided"] |

### 6.2 Evaluation Progress

| **Timestamp**      | **Component**    | **Status**                      | **Notes**                                      |
| :----------------- | :--------------- | :------------------------------ | :--------------------------------------------- |
| [YYYY-MM-DD HH:MM] | [Component name] | [In Progress/Completed/Blocked] | [Technical details, blockers, or achievements] |
```

## Appendix B: Evaluation Report Template

The following template is used for creating eval-report.md:

```markdown
# Agent Evaluation Report for [AGENT NAME]

## Executive Summary

<!--
ACTION REQUIRED: Provide high-level evaluation results and key findings. Focus on actionable insights for stakeholders.
-->

- **Test Scale**: [N] test cases
- **Success Rate**: [XX.X%]
- **Status**: [Excellent/Good/Poor]
- **Strengths**: [Specific capability or metric] [Performance highlight] [Reliability aspect]
- **Critical Issues**: [Blocking issue + impact] [Performance bottleneck] [Safety/compliance concern]
- **Action Priority**: [Critical fixes] [Improvements] [Enhancements]

---

## Evaluation Results

### Test Case Coverage

<!--
ACTION REQUIRED: List all test scenarios that were evaluated, providing context for the results.
-->

- **[Test Scenario 1]**: [Description and coverage]
- **[Test Scenario 2]**: [Description and coverage]
- [Additional scenarios as needed]

### Results

| **Metric**      | **Score** | **Target** | **Status**  |
| :-------------- | :-------- | :--------- | :---------- |
| [Metric Name 1] | [XX.X%]   | [XX%]      | [Pass/Fail] |
| [Metric Name 2] | [X.X/5]   | [4.0+]     | [Pass/Fail] |
| [Metric Name 3] | [XX.X%]   | [95%+]     | [Pass/Fail] |

### Results Summary

[Brief description of overall performance and findings across metrics]

---

## Agent Success Analysis

<!--
ACTION REQUIRED: Focus on what the agent does well. Provide specific evidence and contributing factors for successful performance.
-->

### Strengths

- **[Strength Name 1]**: [What the agent does exceptionally well]
- **Evidence**: [Specific metrics and examples]
- **Contributing Factors**: [Why this works well]

- **[Strength Name 2]**: [What the agent does exceptionally well]
- **Evidence**: [Specific metrics and examples]
- **Contributing Factors**: [Why this works well]

[Repeat pattern for additional strengths]

### High-Performing Scenarios

- **[Scenario Type 1]**: [Category of tasks where agent excels]
- **Key Characteristics**: [What makes these scenarios successful]

- **[Scenario Type 2]**: [Category of tasks where agent excels]
- **Key Characteristics**: [What makes these scenarios successful]

[Repeat pattern for additional scenarios]

---

## Agent Failure Analysis

<!--
ACTION REQUIRED: Analyze failures systematically. Provide root cause analysis and specific improvement recommendations with expected impact.
-->

### Issue 1 - [Priority Level]

- **Issue**: [Clear problem statement with evaluation metrics]
- **Root Cause**: [Technical analysis of why this occurred — path/to/file.py:START-END]
- **Evidence**: [Specific data points from results]
- **Impact**: [Effect on overall performance]
- **Priority Fixes**:
  - P1 — [Fix name]: [One-line solution] → Expected gain: [Metric +X]
  - P2 — [Fix name]: [One-line solution] → Expected gain: [Metric improvement]

### Issue 2 - [Priority Level]

[Repeat structure for additional issues]

---

## Action Items & Recommendations

<!--
ACTION REQUIRED: Provide specific, implementable tasks with clear steps. Prioritize by impact and effort required.
-->

### [Item Name] - Priority [Number] ([Critical/Enhancement])

- **Description**: [Description of this item]
- **Actions**:
  - [ ] [Specific task with implementation steps]
  - [ ] [Specific task with implementation steps]
  - [ ] [Additional tasks as needed]

### [Additional Item Name] - Priority [Number] ([Critical/Enhancement])

[Repeat structure for additional action items]

---

## Artifacts & Reproduction

### Reference Materials

- **Agent Code**: [Path to agent implementation]
- **Test Cases**: [Path to test cases]
- **Traces**: [Path to traces]
- **Results**: [Path to results files]
- **Evaluation Code**: [Path to evaluation implementation]

---

## Evaluation Limitations and Improvement

<!--
ACTION REQUIRED: Identify limitations in the current evaluation approach and suggest improvements for future iterations.
-->

### Test Data Improvement

- **Current Limitations**: [Evaluation scope limitations]
- **Recommended Improvements**: [Specific suggestions for test data enhancement]

### Evaluation Code Enhancement

- **Current Limitations**: [Limitations of evaluation implementation and metrics]
- **Recommended Improvements**: [Specific suggestions for evaluation code improvement]

### [Additional Improvement Area]

[Repeat structure for other evaluation improvement areas]
```

## Appendix C: Strands Evals SDK Reference and Code Examples

**CRITICAL WARNING**: The code examples below are REFERENCE ONLY and may be outdated. You MUST NOT use these examples as your primary implementation guide.

**REQUIRED**: Before implementing evaluation code, you MUST follow the documentation retrieval process described in Section 4 "Evaluation Implementation and Execution Phase" > "Strands Evals SDK Integration". Do NOT proceed with implementation until you have obtained current documentation through either context7 MCP or the cloned source code.

### Core Evaluation Principles

1. **Case-Based Testing**: Individual test cases with input, expected output, and metadata
2. **Experiment Framework**: Collection of cases with evaluator for running evaluations
3. **Built-in Evaluators**: OutputEvaluator, TrajectoryEvaluator, InteractionsEvaluator
4. **Direct Evaluation**: No separate trace collection, direct evaluation during execution

### Basic Usage Pattern

```python
# In eval/run_evaluation.py
import json
from strands_evals import Case, Experiment, OutputEvaluator

def load_test_cases(file_path: str) -> List[Case]:
    """Load test cases from JSONL file."""
    cases = []
    with open(file_path, 'r') as f:
        for line in f:
            test_data = json.loads(line)
            case = Case(
                input=test_data['input'],
                expected_output=test_data.get('expected_output'),
                metadata=test_data.get('metadata', {})
            )
            cases.append(case)
    return cases

def create_experiment(test_cases_file: str = 'test-cases.jsonl'):
    """Create experiment with test cases and evaluator."""
    cases = load_test_cases(test_cases_file)

    experiment = Experiment(
        cases=cases,
        evaluator=OutputEvaluator()
    )

    return experiment
```

### Agent Integration Pattern

```python
# In eval/run_evaluation.py
import json
import os
from datetime import datetime
from pathlib import Path

def agent_wrapper(agent_function):
    """Wrapper to integrate agent with Strands evaluation."""
    def wrapped_agent(case_input):
        # Call the actual agent
        result = agent_function(case_input)
        return result
    return wrapped_agent

def run_evaluation(agent_function, output_dir: str = 'results'):
    """Run complete evaluation pipeline."""
    # Create experiment
    experiment = create_experiment()

    # Wrap agent for evaluation
    wrapped_agent = agent_wrapper(agent_function)

    # Run evaluation
    results = experiment.run(wrapped_agent)

    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    output_path = Path(output_dir) / timestamp
    output_path.mkdir(parents=True, exist_ok=True)

    with open(output_path / 'results.json', 'w') as f:
        json.dump(results, f, indent=2)

    return results, output_path

def main():
    """Main evaluation entry point."""
    # Import your agent function
    from your_agent import main_agent_function

    # Run evaluation
    results, output_path = run_evaluation(main_agent_function)

    # Print summary
    print(f"Evaluation completed. Results saved to: {output_path}")
    print(f"Total cases: {len(results.get('cases', []))}")

    # Print metrics summary
    if 'metrics' in results:
        for metric_name, score in results['metrics'].items():
            print(f"{metric_name}: {score:.3f}")

if __name__ == "__main__":
    main()
```

### Key Implementation Points

1. **Direct Integration**: Import and call agent functions directly, no trace collection needed
2. **Case Objects**: Use Case objects to structure test inputs, expected outputs, and metadata
3. **Experiment Framework**: Use Experiment class to manage test execution and evaluation
4. **Built-in Evaluators**: Leverage OutputEvaluator, TrajectoryEvaluator, InteractionsEvaluator
5. **Custom Evaluators**: Extend BaseEvaluator for domain-specific evaluation logic

### Evaluator Reference

**Note**: This section provides detailed information about Strands Evals SDK evaluators. While the API patterns shown here are important for understanding the framework, you MUST still obtain current documentation before implementation.

Strands Evals SDK provides a set of evaluators that plug into the standard:

- `Case[InputT, OutputT]`
- `Experiment[InputT, OutputT]`
- `user_task_function(case: Case) -> TaskOutput | dict | OutputT`

All evaluators live under:

```python
from strands_evals.evaluators import (
    OutputEvaluator,
    Evaluator,  # base class for custom evaluators
)
```

Most evaluators return one or more `EvaluationOutput` objects:

```python
from strands_evals.types.evaluation import EvaluationOutput

# Fields:
# score: float in [0.0, 1.0]
# test_pass: bool
# reason: str (judge / metric reasoning)
# label: Optional[str] (categorical label, e.g. "Yes", "Very helpful", "3/4 keywords")
```

Custom evaluators directly consume `EvaluationData[InputT, OutputT]`, which includes input/output, optional expected values, and optional trajectory / interactions.

---

#### 1. Overview – Which Evaluator When?

| Evaluator          | Level        | What it measures                                                 | Task function must return…               |
| ------------------ | ------------ | ---------------------------------------------------------------- | ---------------------------------------- |
| `OutputEvaluator`  | Output-level | Subjective quality vs rubric (helpfulness, safety, clarity, etc) | `output` (string or serializable output) |
| `Custom Evaluator` | Any          | Your own metrics / judge logic                                   | Anything accessible via `EvaluationData` |

---

#### 2. OutputEvaluator (LLM-as-a-judge over outputs)

**Namespace:** `strands_evals.evaluators.OutputEvaluator`

##### 2.1. What it does

`OutputEvaluator` runs a **judge LLM** over each `(input, output, optional expected_output)` and applies a **rubric** you provide. It’s the generic “LLM-as-a-judge” for arbitrary subjective criteria:

- quality, correctness, completeness
- tone, style, safety
- policy or UX guideline compliance

Use it when you want a flexible scoring mechanism without writing your own evaluator.

##### 2.2. Key parameters

From the docs:

- `rubric: str` (required)
  A natural-language description of:

  - What “good” looks like (criteria).
  - How to map to scores (e.g., 0 / 0.5 / 1).
  - Optional labels or categories (e.g., “pass”, “borderline”, “fail”).

- `model: Union[Model, str, None] = None`

  - Judge model used by the evaluator.
  - `None` ⇒ default Bedrock model configured in Strands Agents.

- `system_prompt: str | None = None`

  - Overrides the built-in system prompt used to drive the judge.
  - Use this to add domain-specific guidance (e.g., “You are a security reviewer…”).

- `include_inputs: bool = True`

  - If `True`, the evaluator passes the input prompt into the judge context.
  - Set `False` when you want to judge the output in isolation (e.g., style-only).

##### 2.3. What it expects from your task

Your `user_task_function` must return something that the evaluator can treat as:

- `output` (string or serializable to string).
- (Optionally) `expected_output` if you want the rubric to consider a reference answer.

In the simplest case:

```python
from strands import Agent
from strands_evals import Case, Experiment
from strands_evals.evaluators import OutputEvaluator

def task_fn(case: Case[str, str]) -> str:
    agent = Agent(
        system_prompt="You are a friendly, concise assistant."
    )
    return str(agent(case.input))

cases = [
    Case[str, str](
        name="greeting",
        input="Say hi to a new user.",
        expected_output="A short, warm greeting."
    ),
]

evaluator = OutputEvaluator(
    rubric=(
        "Score the response on correctness, completeness, and tone. "
        "Return 1.0 for excellent, 0.5 for partially acceptable, "
        "0.0 for poor or off-topic answers."
    ),
    include_inputs=True,
)

experiment = Experiment[str, str](cases=cases, evaluator=evaluator)
report = experiment.run_evaluations(task_fn)
report.run_display()
```

(This is logically equivalent to the docs' example but rephrased.)

##### 2.4. Output format

Each case yields an `EvaluationOutput`:

- `score: float` in `[0.0, 1.0]`
- `test_pass: bool`, usually determined via a default threshold (≥ 0.5)
- `reason: str` – judge’s explanation
- `label: Optional[str]` – optional category string (you can encode discrete classes here)

##### 2.5. Designing good rubrics

Practical suggestions (building on the SDK docs):

1. **Constrain the scale**

   - Recommend 2–4 discrete levels (e.g. `0.0`, `0.5`, `1.0`).
   - Explicitly map each level to conditions, _and_ mention examples:

     - “1.0: fully correct, complete, well-structured answer with no policy issues.”
     - “0.5: partially correct or missing some details, but still useful.”
     - “0.0: off-topic, incorrect, or unsafe.”

2. **Separate dimensions in the rubric, not the model**

   For multi-dimensional evaluations (e.g., helpfulness + safety + tone), either:

   - Run multiple experiments with different rubrics (simplest), or
   - In one rubric, instruct the judge to compute:

     - `score_overall`, plus optional sub-dimension comments that go into `reason`.

3. **Use `include_inputs=True` for context-dependent criteria**

   - If your rubric cares about whether the response _answered the question_, you want the judge to see the original question.
   - If you only care about lexical/format constraints, you can set `include_inputs=False`.

4. **Test the rubric with known cases**

   - Build a small set of “gold” examples where you know the desired score.
   - Run the evaluator on them to QA the rubric and adjust wording.

---

#### 3. Custom Evaluators (extending `Evaluator`)

**Namespace:** `strands_evals.evaluators.Evaluator` (base)

##### 3.1. When to write a custom evaluator

Use a custom evaluator when:

- None of the built-ins capture the metric you care about.
- You want non-LLM metrics (e.g., exact match, BLEU, latency, cost).
- You need to integrate external services (e.g., another scoring API).
- You want to evaluate at a custom “level” (per paragraph, per tool call, per session cluster, etc.).

##### 3.2. Core API shape

Custom evaluators subclass:

```python
from typing_extensions import TypeVar
from strands_evals.evaluators import Evaluator
from strands_evals.types.evaluation import EvaluationData, EvaluationOutput

InputT = TypeVar("InputT")
OutputT = TypeVar("OutputT")

class MyEvaluator(Evaluator[InputT, OutputT]):
    def __init__(self, ...):
        super().__init__()
        # store config

    def evaluate(
        self,
        evaluation_case: EvaluationData[InputT, OutputT],
    ) -> list[EvaluationOutput]:
        # sync logic
        ...

    async def evaluate_async(
        self,
        evaluation_case: EvaluationData[InputT, OutputT],
    ) -> list[EvaluationOutput]:
        # async logic (can call evaluate for simple cases)
        ...
```

`EvaluationData` gives you: input, actual/expected output, actual/expected trajectory, actual/expected interactions, etc. You decide which fields are relevant.

##### 3.3. Example: pure metric-based evaluator

Adapted from the docs' keyword example:

```python
class KeywordCoverageEvaluator(Evaluator[InputT, OutputT]):
    """
    Checks whether the output includes all required keywords.
    """

    def __init__(self, required_keywords: list[str], case_sensitive: bool = False):
        super().__init__()
        self.required_keywords = required_keywords
        self.case_sensitive = case_sensitive

    def _normalize(self, text: str) -> str:
        return text if self.case_sensitive else text.lower()

    def evaluate(self, evaluation_case: EvaluationData[InputT, OutputT]) -> list[EvaluationOutput]:
        output_text = self._normalize(str(evaluation_case.actual_output))

        if self.case_sensitive:
            keywords = self.required_keywords
        else:
            keywords = [kw.lower() for kw in self.required_keywords]

        present = [kw for kw in keywords if kw in output_text]
        missing = [kw for kw in keywords if kw not in output_text]

        if keywords:
            score = len(present) / len(keywords)
        else:
            score = 1.0  # nothing to check

        passed = score == 1.0
        if passed:
            reason = f"All required keywords present: {present}"
        else:
            reason = f"Missing keywords: {missing}; found: {present}"

        return [
            EvaluationOutput(
                score=score,
                test_pass=passed,
                reason=reason,
                label=f"{len(present)}/{len(keywords)} keywords",
            )
        ]

    async def evaluate_async(
        self,
        evaluation_case: EvaluationData[InputT, OutputT],
    ) -> list[EvaluationOutput]:
        return self.evaluate(evaluation_case)
```

##### 3.4. Example: LLM-based custom evaluator

You can also embed your own judge Agent inside the evaluator (e.g., to specialize tone / style checks):

```python
from strands import Agent as StrandsAgent  # to avoid name clash

class ToneEvaluator(Evaluator[InputT, OutputT]):
    """
    Uses a judge agent to check whether the response has the desired tone.
    """

    def __init__(self, expected_tone: str, model: str | None = None):
        super().__init__()
        self.expected_tone = expected_tone
        self.model = model

    def _build_judge(self) -> StrandsAgent:
        return StrandsAgent(
            model=self.model,
            system_prompt=(
                f"You evaluate whether responses have a {self.expected_tone} tone. "
                "Return an EvaluationOutput with score 1.0 for fully appropriate tone, "
                "0.5 for mixed tone, and 0.0 if tone clearly does not match."
            ),
        )

    def _make_prompt(self, data: EvaluationData[InputT, OutputT]) -> str:
        return (
            f"Input:\n{data.input}\n\n"
            f"Response:\n{data.actual_output}\n\n"
            "Judge whether the tone matches the desired style."
        )

    def evaluate(self, data: EvaluationData[InputT, OutputT]) -> list[EvaluationOutput]:
        judge = self._build_judge()
        prompt = self._make_prompt(data)
        result = judge.structured_output(EvaluationOutput, prompt)
        return [result]

    async def evaluate_async(self, data: EvaluationData[InputT, OutputT]) -> list[EvaluationOutput]:
        judge = self._build_judge()
        prompt = self._make_prompt(data)
        result = await judge.structured_output_async(EvaluationOutput, prompt)
        return [result]
```

##### 3.5. Example: multi-level / per-tool evaluation

You can also implement your own "levels", e.g., iterate through `actual_trajectory` and emit multiple `EvaluationOutput`s (similar to how ToolParameter/ToolSelection do it):

```python
class PerToolLatencyEvaluator(Evaluator[InputT, OutputT]):
    """
    Example: emits one EvaluationOutput per tool call based on latency.
    """

    def __init__(self, max_ms: float):
        super().__init__()
        self.max_ms = max_ms

    def evaluate(self, data: EvaluationData[InputT, OutputT]) -> list[EvaluationOutput]:
        results: list[EvaluationOutput] = []

        if not data.actual_trajectory:
            return []

        for call in data.actual_trajectory:
            # Assume telemetry tooling populates "duration_ms"
            duration = call.get("duration_ms", 0.0)
            score = 1.0 if duration <= self.max_ms else max(0.0, 1.0 - duration / (2 * self.max_ms))
            passed = duration <= self.max_ms
            reason = f"Tool {call.get('name')} took {duration:.1f}ms (max allowed {self.max_ms}ms)."

            results.append(
                EvaluationOutput(
                    score=score,
                    test_pass=passed,
                    reason=reason,
                    label="ok" if passed else "slow",
                )
            )

        return results

    async def evaluate_async(self, data: EvaluationData[InputT, OutputT]) -> list[EvaluationOutput]:
        return self.evaluate(data)
```

##### 3.6. Using a custom evaluator in an Experiment

Usage is identical to built-ins:

```python
from strands_evals import Case, Experiment

cases = [
    Case[str, str](
        name="email-1",
        input="Write a short professional email to a recruiter.",
    ),
]

evaluator = ToneEvaluator(expected_tone="professional")

experiment = Experiment[str, str](cases=cases, evaluator=evaluator)
report = experiment.run_evaluations(task_fn)   # your existing task function
report.run_display()
```

##### 3.7. Custom evaluator best practices

Based on the SDK guidance:

- Always subclass `Evaluator` and implement both `evaluate` and `evaluate_async`.
- Always return a **list** of `EvaluationOutput`.
- Keep scores in `[0.0, 1.0]` and document what your thresholds mean.
- Put detailed human-readable reasoning in `reason` – this is what you’ll debug with.
- Handle missing data gracefully (e.g., no trajectory, no expected_output).
- Think about level: per-case, per-turn, per-tool, per-interaction, or multi-level.
