import pytest
from pathlib import Path
from unittest.mock import Mock
from typing import Dict, Any

from strands_agents_sops.sources import (
    LocalDirectorySource,
    S3Source,
    parse_sop_source,
    expand_sop_paths,
    load_sops_from_sources,
)


# Test Helpers

def create_test_sop(name: str, description: str) -> str:
    """Create a valid test SOP content"""
    return f"""# {name}

## Overview
{description}

## Steps
### 1. Do something
Test step content.
"""


def setup_s3_mock_client(mock_client: Mock, sop_keys: list[str], sop_content: str):
    """Setup S3 mock client with paginator and get_object responses

    Args:
        mock_client: Mock S3 client to configure
        sop_keys: List of S3 object keys to return from list operation
        sop_content: Content to return for get_object calls
    """
    # Mock paginator for list_objects_v2
    mock_paginator = Mock()
    mock_client.get_paginator.return_value = mock_paginator
    mock_paginator.paginate.return_value = [
        {'Contents': [{'Key': key} for key in sop_keys]}
    ]

    # Mock get_object response
    mock_response = {'Body': Mock()}
    mock_response['Body'].read.return_value = sop_content.encode('utf-8')
    mock_client.get_object.return_value = mock_response


def create_s3_source_with_mock_client(bucket: str, prefix: str = "") -> tuple[S3Source, Mock]:
    """Create S3Source with a mock client

    Returns:
        Tuple of (S3Source instance, mock client)
    """
    mock_client = Mock()
    source = S3Source(bucket=bucket, prefix=prefix)
    source._s3_client = mock_client
    return source, mock_client


# Tests

class TestLocalDirectorySource:
    """Tests for LocalDirectorySource"""

    def test_load_sops_from_valid_directory(self, tmp_path):
        """Test loading SOPs from a directory with valid .sop.md files"""
        sop_content = create_test_sop("Test SOP", "This is a test SOP for validation.")
        sop_file = tmp_path / "test.sop.md"
        sop_file.write_text(sop_content)

        source = LocalDirectorySource(tmp_path)
        sops = source.load_sops()

        assert len(sops) == 1
        assert sops[0]["name"] == "test"
        assert sops[0]["content"] == sop_content
        assert sops[0]["description"] == "This is a test SOP for validation."

    def test_skips_sops_without_overview_section(self, tmp_path):
        """Test that SOPs without Overview section are skipped with warning"""
        invalid_sop = """# Test SOP

## Steps
### 1. Do something
Test step content.
"""
        (tmp_path / "invalid.sop.md").write_text(invalid_sop)

        source = LocalDirectorySource(tmp_path)
        sops = source.load_sops()

        assert sops == []

    def test_only_loads_sop_md_files(self, tmp_path):
        """Test that only .sop.md files are loaded, others are ignored"""
        (tmp_path / "valid.sop.md").write_text(create_test_sop("Valid", "Valid SOP"))
        (tmp_path / "regular.md").write_text("# Regular markdown")
        (tmp_path / "text.txt").write_text("Text file")
        (tmp_path / "another.sop.txt").write_text("Wrong extension")

        source = LocalDirectorySource(tmp_path)
        sops = source.load_sops()

        assert len(sops) == 1
        assert sops[0]["name"] == "valid"

    def test_handles_nonexistent_directory_gracefully(self, tmp_path):
        """Test that nonexistent directories return empty list without error"""
        nonexistent = tmp_path / "nonexistent"
        source = LocalDirectorySource(nonexistent)
        sops = source.load_sops()

        assert sops == []

    def test_handles_file_path_instead_of_directory(self, tmp_path):
        """Test that providing a file path instead of directory returns empty list"""
        file_path = tmp_path / "not_a_dir"
        file_path.write_text("content")

        source = LocalDirectorySource(file_path)
        sops = source.load_sops()

        assert sops == []


class TestS3Source:
    """Tests for S3Source - focuses on behavior, not implementation details"""

    def test_loads_sops_from_s3_bucket(self):
        """Test successful loading of SOPs from S3 bucket with filtering"""
        source, mock_client = create_s3_source_with_mock_client("test-bucket", "sops/")

        sop_keys = [
            'sops/workflow.sop.md',
            'sops/process.sop.md',
            'sops/readme.md',  # Should be filtered out (not .sop.md)
        ]
        sop_content = create_test_sop("Test SOP", "This is a test SOP from S3.")
        setup_s3_mock_client(mock_client, sop_keys, sop_content)

        sops = source.load_sops()

        # Should load only .sop.md files
        assert len(sops) == 2
        assert all(sop["description"] == "This is a test SOP from S3." for sop in sops)
        assert {sop["name"] for sop in sops} == {"workflow", "process"}

        # Verify S3 API calls
        mock_client.get_paginator.assert_called_once_with('list_objects_v2')
        assert mock_client.get_object.call_count == 2

    def test_loads_from_bucket_root_when_no_prefix(self):
        """Test that S3 source works without prefix parameter"""
        source, mock_client = create_s3_source_with_mock_client("test-bucket")

        mock_paginator = Mock()
        mock_client.get_paginator.return_value = mock_paginator
        mock_paginator.paginate.return_value = [{'Contents': []}]

        source.load_sops()

        # Should call paginate without Prefix parameter
        mock_paginator.paginate.assert_called_once_with(Bucket="test-bucket")

    def test_handles_aws_client_errors_gracefully(self):
        """Test that AWS S3 client errors are handled without crashing"""
        from botocore.exceptions import ClientError

        source, mock_client = create_s3_source_with_mock_client("test-bucket")

        error = ClientError(
            error_response={'Error': {'Code': 'NoSuchBucket', 'Message': 'Bucket does not exist'}},
            operation_name='ListObjects'
        )
        mock_client.get_paginator.side_effect = error

        sops = source.load_sops()
        assert sops == []

    def test_handles_missing_aws_credentials_gracefully(self):
        """Test graceful handling when AWS credentials are not available"""
        from botocore.exceptions import NoCredentialsError

        source, mock_client = create_s3_source_with_mock_client("test-bucket")
        mock_client.get_paginator.side_effect = NoCredentialsError()

        sops = source.load_sops()
        assert sops == []


class TestParseSopSource:
    """Tests for parse_sop_source - configuration parsing"""

    def test_parses_minimal_s3_configuration(self):
        """Test parsing minimal S3 source string with required parameters only"""
        source = parse_sop_source("type=s3,bucket=my-bucket")

        assert isinstance(source, S3Source)
        assert source.bucket == "my-bucket"
        assert source.prefix == ""
        assert source.region is None

    def test_parses_full_s3_configuration(self):
        """Test parsing S3 source with all optional parameters"""
        source_str = "type=s3,bucket=my-bucket,prefix=sops/,region=us-west-2,endpoint-url=https://s3.example.com,profile=myprofile"
        source = parse_sop_source(source_str)

        assert isinstance(source, S3Source)
        assert source.bucket == "my-bucket"
        assert source.prefix == "sops/"
        assert source.region == "us-west-2"
        assert source.endpoint_url == "https://s3.example.com"
        assert source.profile == "myprofile"

    def test_rejects_configuration_without_type(self):
        """Test that configuration without type parameter is rejected"""
        with pytest.raises(ValueError, match="Source type is required"):
            parse_sop_source("bucket=my-bucket")

    def test_rejects_s3_configuration_without_bucket(self):
        """Test that S3 configuration without bucket is rejected"""
        with pytest.raises(ValueError, match="S3 bucket is required"):
            parse_sop_source("type=s3,prefix=sops/")

    def test_rejects_unsupported_source_types(self):
        """Test that unsupported source types are rejected with clear error"""
        with pytest.raises(ValueError, match="Unsupported source type: gcs"):
            parse_sop_source("type=gcs,bucket=my-bucket")

    def test_rejects_malformed_parameter_format(self):
        """Test that malformed parameters are rejected"""
        with pytest.raises(ValueError, match="Invalid source parameter format"):
            parse_sop_source("type=s3,invalid-param,bucket=my-bucket")


class TestExpandSopPaths:
    """Tests for expand_sop_paths - path string parsing"""

    def test_expands_multiple_colon_separated_paths(self, tmp_path):
        """Test expanding multiple colon-separated paths into sources"""
        path1 = tmp_path / "dir1"
        path2 = tmp_path / "dir2"
        path1.mkdir()
        path2.mkdir()

        sources = expand_sop_paths(f"{path1}:{path2}")

        assert len(sources) == 2
        assert sources[0].directory_path == path1
        assert sources[1].directory_path == path2

    def test_expands_tilde_to_home_directory(self):
        """Test that tilde (~) is expanded to home directory"""
        sources = expand_sop_paths("~/test")

        assert len(sources) == 1
        assert str(sources[0].directory_path).startswith(str(Path.home()))
        assert str(sources[0].directory_path).endswith("test")

    def test_returns_empty_list_for_empty_string(self):
        """Test that empty string returns empty list"""
        sources = expand_sop_paths("")
        assert sources == []


class TestLoadSopsFromSources:
    """Tests for load_sops_from_sources - multi-source loading with precedence"""

    def test_first_wins_precedence_across_sources(self, tmp_path):
        """Test that first source wins when multiple sources have same SOP name"""
        dir1 = tmp_path / "dir1"
        dir2 = tmp_path / "dir2"
        dir1.mkdir()
        dir2.mkdir()

        # Same SOP name in both directories with different content
        (dir1 / "duplicate.sop.md").write_text(create_test_sop("Duplicate", "From first source"))
        (dir2 / "duplicate.sop.md").write_text(create_test_sop("Duplicate", "From second source"))

        # Unique SOPs in each directory
        (dir1 / "unique1.sop.md").write_text(create_test_sop("Unique1", "Only in first"))
        (dir2 / "unique2.sop.md").write_text(create_test_sop("Unique2", "Only in second"))

        sources = [
            LocalDirectorySource(dir1),
            LocalDirectorySource(dir2)
        ]

        sops = load_sops_from_sources(sources)

        # Should have 3 SOPs: duplicate (from dir1), unique1, unique2
        assert len(sops) == 3

        sop_by_name = {sop["name"]: sop for sop in sops}
        assert set(sop_by_name.keys()) == {"duplicate", "unique1", "unique2"}

        # 'duplicate' should come from first source (dir1), not second
        assert sop_by_name["duplicate"]["description"] == "From first source"

    def test_continues_loading_when_one_source_fails(self, tmp_path):
        """Test that loading continues even when one source raises an error"""
        # Create one valid source
        valid_dir = tmp_path / "valid"
        valid_dir.mkdir()
        (valid_dir / "test.sop.md").write_text(create_test_sop("Test", "Valid SOP"))

        # Create mock source that always fails
        failing_source = Mock()
        failing_source.get_source_info.return_value = "mock:failing-source"
        failing_source.load_sops.side_effect = Exception("Simulated source failure")

        sources = [
            LocalDirectorySource(valid_dir),
            failing_source
        ]

        sops = load_sops_from_sources(sources)

        # Should still get SOP from valid source
        assert len(sops) == 1
        assert sops[0]["name"] == "test"

    def test_returns_empty_list_for_no_sources(self):
        """Test that empty sources list returns empty SOP list"""
        sops = load_sops_from_sources([])
        assert sops == []
