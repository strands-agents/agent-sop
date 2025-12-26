import argparse

from .cursor import generate_cursor_commands
from .mcp import run_mcp_server
from .rules import output_rules
from .skills import generate_anthropic_skills

# Registry for command generators: maps type -> (generator_function, default_output_dir)
COMMAND_GENERATORS = {
    "cursor": (generate_cursor_commands, ".cursor/commands"),
    # Future types can be added here:
    # "claude": (generate_claude_commands, ".claude/commands"),
}


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
        "--sop-source",
        action="append",
        help="External SOP source in format 'type=s3,bucket=my-bucket[,prefix=path][,region=us-east-1][,endpoint-url=https://s3.example.com][,profile=myprofile]'. Can be repeated for multiple sources.",
    )
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
        "--sop-source",
        action="append",
        help="External SOP source in format 'type=s3,bucket=my-bucket[,prefix=path][,region=us-east-1][,endpoint-url=https://s3.example.com][,profile=myprofile]'. Can be repeated for multiple sources.",
    )
    skills_parser.add_argument(
        "--sop-paths",
        help="Colon-separated list of directory paths to load external SOPs from. "
        "Supports absolute paths, relative paths, and tilde (~) expansion.",
    )

    # Rules output command
    subparsers.add_parser("rule", help="Output agent SOP authoring rule")

    # Commands generation command (supports multiple types: cursor, claude, etc.)
    commands_parser = subparsers.add_parser(
        "commands", help="Generate IDE commands from SOPs"
    )
    commands_parser.add_argument(
        "--type",
        required=True,
        choices=list(COMMAND_GENERATORS.keys()),
        help=f"Type of commands to generate ({', '.join(COMMAND_GENERATORS.keys())}, etc.)",
    )
    commands_parser.add_argument(
        "--output-dir",
        help="Output directory for commands (default varies by type)",
    )
    commands_parser.add_argument(
        "--sop-paths",
        help="Colon-separated list of directory paths to load external SOPs from. "
        "Supports absolute paths, relative paths, and tilde (~) expansion.",
    )

    args = parser.parse_args()

    if args.command == "skills":
        sop_sources = getattr(args, "sop_source", None) or []
        sop_paths = getattr(args, "sop_paths", None)
        generate_anthropic_skills(args.output_dir, sop_sources=sop_sources, sop_paths=sop_paths)
    elif args.command == "rule":
        output_rules()
    elif args.command == "commands":
        sop_paths = getattr(args, "sop_paths", None)
        command_type = args.type

        if command_type not in COMMAND_GENERATORS:
            parser.error(f"Unsupported command type: {command_type}")

        generator_func, default_output_dir = COMMAND_GENERATORS[command_type]
        output_dir = args.output_dir or default_output_dir
        generator_func(output_dir, sop_paths=sop_paths)
    else:
        # Default to MCP server
        sop_sources = getattr(args, "sop_source", None) or []
        sop_paths = getattr(args, "sop_paths", None)
        run_mcp_server(sop_sources=sop_sources, sop_paths=sop_paths)


if __name__ == "__main__":
    main()
