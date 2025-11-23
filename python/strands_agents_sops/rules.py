from pathlib import Path


def get_sop_format() -> str:
    """Get the agent SOP format rule as a string.

    Returns:
        Content of the agent-sop-format.md rule file, or empty string if not found.
    """
    rule_file = Path(__file__).parent / "rules" / "agent-sop-format.md"

    if not rule_file.exists():
        return ""

    return rule_file.read_text()


def output_rules():
    """Output the contents of agent SOP authoring rules"""
    content = get_sop_format()
    if not content:
        print("Rules directory not found. Make sure the package was built properly.")
        return

    print(content)
