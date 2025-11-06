"""Script format integration for agent script authoring"""

import logging
import os
import re
import time
from typing import Dict, List, Any, Optional


class ScriptFormatIntegrator:
    """Handles agent script format rule integration and validation"""
    
    def __init__(self):
        """Initialize the script format integrator"""
        self.logger = logging.getLogger('script_format_integrator')
        self._format_rule_cache = None
        self._cache_timestamp = None
        
    async def load_format_rule(self) -> bool:
        """Load agent script format rule from file"""
        try:
            rule_path = os.path.join(
                os.path.dirname(__file__), 
                '..', '..', '..', '..', 
                'rules', 
                'agent-script-format.md'
            )
            
            if not os.path.exists(rule_path):
                self.logger.warning(f"Script format rule file not found at {rule_path}")
                return False
                
            with open(rule_path, 'r', encoding='utf-8') as f:
                self._format_rule_cache = f.read()
                self._cache_timestamp = time.time()
                
            self.logger.info("Script format rule loaded successfully")
            return True
            
        except Exception as e:
            self.logger.error(f"Failed to load script format rule: {e}")
            return False
    
    def get_format_rule(self) -> Optional[str]:
        """Get cached format rule content"""
        return self._format_rule_cache
    
    def create_system_prompt_with_format_rule(self, base_prompt: str) -> str:
        """Create system prompt with integrated format rule"""
        if self._format_rule_cache:
            return f"{base_prompt}\n\nPlease follow this agent script format:\n\n{self._format_rule_cache}"
        return base_prompt
    
    def validate_script_structure(self, script_content: str) -> Dict[str, Any]:
        """Validate script follows required structure"""
        errors = []
        
        # Check for required sections
        if '## Overview' not in script_content:
            errors.append("Missing required 'Overview' section")
            
        if '## Steps' not in script_content:
            errors.append("Missing required 'Steps' section")
            
        # Check for title (# at start)
        if not script_content.strip().startswith('#'):
            errors.append("Missing script title (should start with #)")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }
    
    def parse_script_sections(self, script_content: str) -> Dict[str, Any]:
        """Parse script content into sections"""
        sections = {}
        
        # Extract title
        title_match = re.search(r'^#\s+(.+)$', script_content, re.MULTILINE)
        if title_match:
            sections['title'] = title_match.group(1).strip()
        
        # Extract overview
        overview_match = re.search(r'## Overview\s*\n(.*?)(?=\n##|\Z)', script_content, re.DOTALL)
        if overview_match:
            sections['overview'] = overview_match.group(1).strip()
        
        # Extract parameters
        param_match = re.search(r'## Parameters\s*\n(.*?)(?=\n##|\Z)', script_content, re.DOTALL)
        if param_match:
            sections['parameters'] = self.extract_parameters(param_match.group(1))
        else:
            sections['parameters'] = []
        
        # Extract steps
        steps_match = re.search(r'## Steps\s*\n(.*)', script_content, re.DOTALL)
        if steps_match:
            sections['steps'] = self._parse_steps(steps_match.group(1))
        else:
            sections['steps'] = []
        
        return sections
    
    def extract_parameters(self, param_text: str) -> List[Dict[str, Any]]:
        """Extract parameters from parameter section"""
        parameters = []
        
        # Match parameter lines: - **param_name** (required/optional): Description
        param_pattern = r'-\s*\*\*(\w+)\*\*\s*\(([^)]+)\):\s*(.+)'
        
        for match in re.finditer(param_pattern, param_text, re.MULTILINE):
            name = match.group(1)
            type_info = match.group(2).strip()
            description = match.group(3).strip()
            
            param = {
                'name': name,
                'description': description,
                'required': 'required' in type_info.lower()
            }
            
            # Extract default value if present
            default_match = re.search(r'default:\s*"([^"]*)"', type_info)
            if default_match:
                param['default'] = default_match.group(1)
            
            parameters.append(param)
        
        return parameters
    
    def validate_parameter_naming(self, param_name: str) -> bool:
        """Validate parameter follows snake_case naming convention"""
        # Must be lowercase with underscores, can contain numbers
        pattern = r'^[a-z][a-z0-9_]*$'
        return bool(re.match(pattern, param_name))
    
    def extract_constraints_from_step(self, step_content: str) -> List[str]:
        """Extract constraints from step content"""
        constraints = []
        
        # Find constraints section
        constraints_match = re.search(r'\*\*Constraints:\*\*\s*\n(.*?)(?=\n###|\n##|\Z)', step_content, re.DOTALL)
        if constraints_match:
            constraints_text = constraints_match.group(1)
            
            # Extract individual constraint lines
            constraint_lines = re.findall(r'-\s*(.+)', constraints_text)
            constraints.extend([line.strip() for line in constraint_lines])
        
        return constraints
    
    def validate_rfc2119_keywords(self, constraints: List[str]) -> bool:
        """Validate constraints use proper RFC 2119 keywords"""
        rfc2119_keywords = [
            'MUST', 'MUST NOT', 'REQUIRED', 'SHALL', 'SHALL NOT',
            'SHOULD', 'SHOULD NOT', 'RECOMMENDED', 'NOT RECOMMENDED',
            'MAY', 'OPTIONAL'
        ]
        
        for constraint in constraints:
            has_keyword = any(keyword in constraint for keyword in rfc2119_keywords)
            if not has_keyword:
                return False
        
        return True
    
    def validate_negative_constraints_context(self, constraints: List[str]) -> Dict[str, Any]:
        """Validate negative constraints include context/reasoning"""
        negative_keywords = ['MUST NOT', 'SHALL NOT', 'SHOULD NOT', 'NOT RECOMMENDED']
        errors = []
        
        for constraint in constraints:
            for keyword in negative_keywords:
                if keyword in constraint:
                    # Check for context words
                    context_words = ['because', 'since', 'as', 'due to', 'given that']
                    has_context = any(word in constraint.lower() for word in context_words)
                    
                    if not has_context:
                        errors.append(f"Negative constraint missing context: {constraint}")
        
        return {
            'valid': len(errors) == 0,
            'errors': errors
        }
    
    def _parse_steps(self, steps_text: str) -> List[Dict[str, Any]]:
        """Parse steps section into individual steps"""
        steps = []
        
        # Split by step headers and process each
        step_parts = re.split(r'(###\s*\d+\.\s*.+)', steps_text)
        
        # Process pairs of header and content
        for i in range(1, len(step_parts), 2):
            if i + 1 < len(step_parts):
                header = step_parts[i]
                content = step_parts[i + 1] if i + 1 < len(step_parts) else ""
                
                # Extract step number and name from header
                header_match = re.match(r'###\s*(\d+)\.\s*(.+)', header)
                if header_match:
                    step_number = int(header_match.group(1))
                    step_name = header_match.group(2).strip()
                    step_content = content.strip()
                    
                    step = {
                        'number': step_number,
                        'name': step_name,
                        'content': step_content,
                        'constraints': self.extract_constraints_from_step(step_content)
                    }
                    
                    steps.append(step)
        
        return steps
