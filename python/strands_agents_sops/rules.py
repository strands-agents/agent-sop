from pathlib import Path


def output_rules():
    """Output the contents of agent SOP authoring rules"""
    rules_dir = Path(__file__).parent / "rules"

    if not rules_dir.exists():
        print("Rules directory not found. Make sure the package was built properly.")
        return

    rule_files = list(rules_dir.glob("*.md"))

    if not rule_files:
        print("No rule files found in rules directory.")
        return

    for rule_file in rule_files:
        print(f"=== {rule_file.name} ===")
        print(rule_file.read_text())
        print()
