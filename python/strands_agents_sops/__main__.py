import argparse
from .mcp import run_mcp_server
from .skills import generate_anthropic_skills
from .rules import output_rules

def main():
    parser = argparse.ArgumentParser(description="Strands Agents SOPs", prog="strands-agents-sops")
    subparsers = parser.add_subparsers(dest="command", help="Available commands", required=False)
    
    # MCP server command (default)
    subparsers.add_parser("mcp", help="Run MCP server (default)")
    
    # Skills generation command
    skills_parser = subparsers.add_parser("skills", help="Generate Anthropic skills")
    skills_parser.add_argument("--output-dir", default="skills", 
                              help="Output directory for skills (default: skills)")
    
    # Rules output command
    subparsers.add_parser("rule", help="Output agent SOP authoring rule")
    
    args = parser.parse_args()
    
    if args.command == "skills":
        generate_anthropic_skills(args.output_dir)
    elif args.command == "rule":
        output_rules()
    else:
        # Default to MCP server
        run_mcp_server()

if __name__ == "__main__":
    main()
