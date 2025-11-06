"""Tests for script format integration module"""

import pytest
from unittest.mock import patch, mock_open, MagicMock
import os
import tempfile

from services.script_format_integration import ScriptFormatIntegrator


class TestScriptFormatIntegrator:
    """Test cases for ScriptFormatIntegrator"""
    
    def test_integrator_initialization(self):
        """Test integrator initializes correctly"""
        integrator = ScriptFormatIntegrator()
        
        assert integrator.logger is not None
        assert integrator._format_rule_cache is None
        assert integrator._cache_timestamp is None
    
    @pytest.mark.asyncio
    async def test_load_format_rule_success(self):
        """Test successful format rule loading"""
        mock_content = """# Agent Script Format
        
## Overview
This defines the standard format.

## Parameters
- **param** (required): Description

## Steps
### 1. First Step
**Constraints:**
- You MUST do something
"""
        
        with patch('builtins.open', mock_open(read_data=mock_content)):
            with patch('os.path.exists', return_value=True):
                integrator = ScriptFormatIntegrator()
                result = await integrator.load_format_rule()
                
                assert result is True
                assert integrator._format_rule_cache == mock_content
                assert integrator._cache_timestamp is not None
    
    @pytest.mark.asyncio
    async def test_load_format_rule_file_not_found(self):
        """Test format rule loading when file doesn't exist"""
        with patch('os.path.exists', return_value=False):
            integrator = ScriptFormatIntegrator()
            result = await integrator.load_format_rule()
            
            assert result is False
            assert integrator._format_rule_cache is None
    
    @pytest.mark.asyncio
    async def test_load_format_rule_file_error(self):
        """Test format rule loading with file read error"""
        with patch('builtins.open', side_effect=IOError("Permission denied")):
            with patch('os.path.exists', return_value=True):
                integrator = ScriptFormatIntegrator()
                result = await integrator.load_format_rule()
                
                assert result is False
                assert integrator._format_rule_cache is None
    
    def test_get_format_rule_cached(self):
        """Test getting cached format rule"""
        integrator = ScriptFormatIntegrator()
        integrator._format_rule_cache = "cached content"
        
        result = integrator.get_format_rule()
        
        assert result == "cached content"
    
    def test_get_format_rule_not_cached(self):
        """Test getting format rule when not cached"""
        integrator = ScriptFormatIntegrator()
        
        result = integrator.get_format_rule()
        
        assert result is None
    
    def test_create_system_prompt_with_format_rule(self):
        """Test creating system prompt with format rule"""
        integrator = ScriptFormatIntegrator()
        integrator._format_rule_cache = "Format rule content"
        
        base_prompt = "You are an agent script authoring assistant."
        result = integrator.create_system_prompt_with_format_rule(base_prompt)
        
        expected = base_prompt + "\n\nPlease follow this agent script format:\n\nFormat rule content"
        assert result == expected
    
    def test_create_system_prompt_without_format_rule(self):
        """Test creating system prompt without format rule"""
        integrator = ScriptFormatIntegrator()
        
        base_prompt = "You are an agent script authoring assistant."
        result = integrator.create_system_prompt_with_format_rule(base_prompt)
        
        assert result == base_prompt
    
    def test_validate_script_structure_valid(self):
        """Test validation of properly structured script"""
        valid_script = """# Test Script

## Overview
This is a test script.

## Parameters
- **param1** (required): Test parameter

## Steps
### 1. First Step
**Constraints:**
- You MUST do something
"""
        
        integrator = ScriptFormatIntegrator()
        result = integrator.validate_script_structure(valid_script)
        
        assert result['valid'] is True
        assert len(result['errors']) == 0
    
    def test_validate_script_structure_missing_overview(self):
        """Test validation with missing overview section"""
        invalid_script = """# Test Script

## Parameters
- **param1** (required): Test parameter

## Steps
### 1. First Step
"""
        
        integrator = ScriptFormatIntegrator()
        result = integrator.validate_script_structure(invalid_script)
        
        assert result['valid'] is False
        assert any('Overview' in error for error in result['errors'])
    
    def test_validate_script_structure_missing_steps(self):
        """Test validation with missing steps section"""
        invalid_script = """# Test Script

## Overview
This is a test script.

## Parameters
- **param1** (required): Test parameter
"""
        
        integrator = ScriptFormatIntegrator()
        result = integrator.validate_script_structure(invalid_script)
        
        assert result['valid'] is False
        assert any('Steps' in error for error in result['errors'])
    
    def test_parse_script_sections_complete(self):
        """Test parsing all sections from a complete script"""
        complete_script = """# Test Script

## Overview
This is a test script that does something useful.

## Parameters
- **required_param** (required): A required parameter
- **optional_param** (optional): An optional parameter

## Steps
### 1. First Step
Do the first thing.

**Constraints:**
- You MUST validate input
- You SHOULD log progress

### 2. Second Step
Do the second thing.
"""
        
        integrator = ScriptFormatIntegrator()
        sections = integrator.parse_script_sections(complete_script)
        
        assert 'title' in sections
        assert 'overview' in sections
        assert 'parameters' in sections
        assert 'steps' in sections
        assert sections['title'] == 'Test Script'
        assert 'useful' in sections['overview']
        assert len(sections['parameters']) == 2
        assert len(sections['steps']) == 2
    
    def test_extract_parameters_valid(self):
        """Test extracting parameters from valid parameter section"""
        param_text = """- **required_param** (required): A required parameter
- **optional_param** (optional): An optional parameter
- **default_param** (optional, default: "value"): Parameter with default"""
        
        integrator = ScriptFormatIntegrator()
        params = integrator.extract_parameters(param_text)
        
        assert len(params) == 3
        assert params[0]['name'] == 'required_param'
        assert params[0]['required'] is True
        assert params[1]['name'] == 'optional_param'
        assert params[1]['required'] is False
        assert params[2]['name'] == 'default_param'
        assert params[2]['default'] == 'value'
    
    def test_validate_parameter_naming_valid(self):
        """Test validation of valid parameter names"""
        integrator = ScriptFormatIntegrator()
        
        valid_names = ['param_name', 'another_param', 'test_123']
        for name in valid_names:
            assert integrator.validate_parameter_naming(name) is True
    
    def test_validate_parameter_naming_invalid(self):
        """Test validation of invalid parameter names"""
        integrator = ScriptFormatIntegrator()
        
        invalid_names = ['paramName', 'param-name', 'Param_Name', '123param']
        for name in invalid_names:
            assert integrator.validate_parameter_naming(name) is False
    
    def test_extract_constraints_from_step(self):
        """Test extracting constraints from step content"""
        step_content = """Do something important.

**Constraints:**
- You MUST validate the input
- You SHOULD log progress
- You MAY include optional features
- You MUST NOT delete files because it could cause data loss"""
        
        integrator = ScriptFormatIntegrator()
        constraints = integrator.extract_constraints_from_step(step_content)
        
        assert len(constraints) == 4
        assert any('MUST validate' in c for c in constraints)
        assert any('SHOULD log' in c for c in constraints)
        assert any('MAY include' in c for c in constraints)
        assert any('MUST NOT delete' in c for c in constraints)
    
    def test_validate_rfc2119_keywords(self):
        """Test validation of RFC 2119 keywords in constraints"""
        integrator = ScriptFormatIntegrator()
        
        valid_constraints = [
            "You MUST do something",
            "You SHOULD consider this",
            "You MAY optionally do this",
            "You MUST NOT delete files",
            "You SHALL validate input"
        ]
        
        invalid_constraints = [
            "You must do something",  # lowercase
            "Do something",  # no keyword
            "You COULD try this"  # invalid keyword
        ]
        
        for constraint in valid_constraints:
            assert integrator.validate_rfc2119_keywords([constraint]) is True
        
        for constraint in invalid_constraints:
            assert integrator.validate_rfc2119_keywords([constraint]) is False
    
    def test_validate_negative_constraints_with_context(self):
        """Test validation that negative constraints include context"""
        integrator = ScriptFormatIntegrator()
        
        valid_negative = [
            "You MUST NOT delete files because it could cause data loss",
            "You SHOULD NOT use this since it's deprecated"
        ]
        
        invalid_negative = [
            "You MUST NOT delete files",  # no context
            "You SHOULD NOT use this"  # no context
        ]
        
        for constraint in valid_negative:
            result = integrator.validate_negative_constraints_context([constraint])
            assert result['valid'] is True
        
        for constraint in invalid_negative:
            result = integrator.validate_negative_constraints_context([constraint])
            assert result['valid'] is False
