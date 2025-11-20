import argparse

from .mcp import run_mcp_server
from .rules import output_rules
from .skills import generate_anthropic_skills


def main():
    parser = argparse.ArgumentParser(
        description="Strands Agents SOPs", prog="strands-agents-sops"
    )
    subparsers = parser.add_subparsers(
        dest="command", help="Available commands", required=False
    )

    # MCP server command (default)
    mcp_parser = subparsers.add_parser("mcp", help="Run MCP server (default)")
    mcp_parser.add_argument(
        "--sop-paths",
        help="Colon-separated list of directory paths to load external SOPs from. "
        "Supports absolute paths, relative paths, and tilde (~) expansion.",
    )

    # Skills generation command
    skills_parser = subparsers.add_parser("skills", help="Generate Anthropic skills")
    skills_parser.add_argument(
        "--output-dir",
        default="skills",
        help="Output directory for skills (default: skills)",
    )
    skills_parser.add_argument(
        "--sop-paths",
        help="Colon-separated list of directory paths to load external SOPs from. "
        "Supports absolute paths, relative paths, and tilde (~) expansion.",
    )

    # Rules output command
    subparsers.add_parser("rule", help="Output agent SOP authoring rule")

    args = parser.parse_args()

    if args.command == "skills":
        sop_paths = getattr(args, "sop_paths", None)
        generate_anthropic_skills(args.output_dir, sop_paths=sop_paths)
    elif args.command == "rule":
        output_rules()
    else:
        # Default to MCP server
        sop_paths = getattr(args, "sop_paths", None)
        run_mcp_server(sop_paths=sop_paths)


if __name__ == "__main__":
    main()
