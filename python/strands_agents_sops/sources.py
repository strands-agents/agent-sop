import logging
import re
from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)


class SOPSource(ABC):
    """Abstract base class for SOP sources"""
    
    @abstractmethod
    def load_sops(self) -> List[Dict[str, Any]]:
        """Load SOPs from this source
        
        Returns:
            List of SOP dictionaries with name, content, and description
        """
        pass
    
    @abstractmethod
    def get_source_info(self) -> str:
        """Get human-readable source information for logging"""
        pass


class LocalDirectorySource(SOPSource):
    """SOP source that loads from local directories"""
    
    def __init__(self, directory_path: Path):
        self.directory_path = directory_path
    
    def load_sops(self) -> List[Dict[str, Any]]:
        """Load SOPs from local directory"""
        if not self.directory_path.exists():
            logger.warning(f"SOP directory does not exist: {self.directory_path}")
            return []

        if not self.directory_path.is_dir():
            logger.warning(f"SOP path is not a directory: {self.directory_path}")
            return []

        try:
            sop_files = filter(
                lambda p: p.is_file(),
                self.directory_path.glob("*.sop.md")
            )
            return list(filter(None, map(self._load_single_sop, sop_files)))
        except Exception as e:
            logger.error(f"Error scanning directory {self.directory_path}: {e}")
            return []

    def _load_single_sop(self, sop_file: Path) -> Optional[Dict[str, Any]]:
        """Load a single SOP file, returning None if invalid"""
        try:
            sop_content = sop_file.read_text(encoding="utf-8")

            # Extract overview section for description
            overview_match = re.search(
                r"## Overview\s*\n(.*?)(?=\n##|\n#|\Z)", sop_content, re.DOTALL
            )
            if not overview_match:
                logger.warning(f"No Overview section found in {sop_file}")
                return None

            description = overview_match.group(1).strip().replace("\n", " ")
            sop_name = sop_file.stem.removesuffix(".sop")

            return {
                "name": sop_name,
                "content": sop_content,
                "description": description,
            }
        except Exception as e:
            logger.error(f"Error loading SOP from {sop_file}: {e}")
            return None
    
    def get_source_info(self) -> str:
        return f"local:{self.directory_path}"


class S3Source(SOPSource):
    """SOP source that loads from S3 bucket"""
    
    def __init__(self, bucket: str, prefix: Optional[str] = None, 
                 region: Optional[str] = None, endpoint_url: Optional[str] = None,
                 profile: Optional[str] = None):
        self.bucket = bucket
        self.prefix = prefix or ""
        self.region = region
        self.endpoint_url = endpoint_url
        self.profile = profile
        self._s3_client = None
    
    @property
    def s3_client(self):
        """Lazy initialization of S3 client"""
        if self._s3_client is None:
            try:
                import boto3
                from botocore.exceptions import ClientError, NoCredentialsError
            except ImportError:
                logger.error("boto3 is required for S3 sources. Install with: pip install boto3")
                raise ImportError("boto3 is required for S3 sources")
            
            # Build session configuration
            session_kwargs = {}
            if self.profile:
                session_kwargs['profile_name'] = self.profile
            
            session = boto3.Session(**session_kwargs)
            
            # Build client configuration
            client_kwargs = {}
            if self.region:
                client_kwargs['region_name'] = self.region
            if self.endpoint_url:
                client_kwargs['endpoint_url'] = self.endpoint_url
            
            self._s3_client = session.client('s3', **client_kwargs)
        
        return self._s3_client
    
    def load_sops(self) -> List[Dict[str, Any]]:
        """Load SOPs from S3 bucket"""
        try:
            import boto3
            from botocore.exceptions import ClientError, NoCredentialsError
        except ImportError:
            logger.error("boto3 is required for S3 sources. Install with: pip install boto3")
            return []

        try:
            s3_objects = self._list_s3_objects()
            sop_keys = filter(lambda key: key.endswith('.sop.md'), s3_objects)
            return list(filter(None, map(self._load_s3_sop, sop_keys)))
        except ClientError as e:
            logger.error(f"AWS S3 error loading from {self.get_source_info()}: {e}")
        except NoCredentialsError:
            logger.error(f"No AWS credentials found for S3 source {self.get_source_info()}")
        except Exception as e:
            logger.error(f"Error loading SOPs from S3 source {self.get_source_info()}: {e}")

        return []

    def _list_s3_objects(self) -> List[str]:
        """List all object keys in S3 bucket with prefix"""
        list_kwargs = {'Bucket': self.bucket}
        if self.prefix:
            list_kwargs['Prefix'] = self.prefix

        paginator = self.s3_client.get_paginator('list_objects_v2')
        pages = paginator.paginate(**list_kwargs)

        return [
            obj['Key']
            for page in pages
            for obj in page.get('Contents', [])
        ]

    def _load_s3_sop(self, key: str) -> Optional[Dict[str, Any]]:
        """Load a single SOP from S3, returning None if invalid"""
        try:
            response = self.s3_client.get_object(Bucket=self.bucket, Key=key)
            sop_content = response['Body'].read().decode('utf-8')

            # Extract overview section for description
            overview_match = re.search(
                r"## Overview\s*\n(.*?)(?=\n##|\n#|\Z)", sop_content, re.DOTALL
            )
            if not overview_match:
                logger.warning(f"No Overview section found in S3 object {key}")
                return None

            description = overview_match.group(1).strip().replace("\n", " ")
            filename = Path(key).name
            sop_name = filename.removesuffix(".sop.md")

            return {
                "name": sop_name,
                "content": sop_content,
                "description": description,
            }
        except Exception as e:
            logger.error(f"Error loading SOP from S3 object {key}: {e}")
            return None
    
    def get_source_info(self) -> str:
        return f"s3://{self.bucket}/{self.prefix}"


def parse_sop_source(source_string: str) -> SOPSource:
    """Parse a SOP source string into a SOPSource instance
    
    Args:
        source_string: Source string in format "type=s3,bucket=my-bucket,prefix=sops/"
        
    Returns:
        SOPSource instance
        
    Raises:
        ValueError: If source string is malformed or missing required parameters
    """
    # Parse key=value pairs
    params = {}
    for part in source_string.split(','):
        if '=' not in part:
            raise ValueError(f"Invalid source parameter format: {part}")
        key, value = part.split('=', 1)
        params[key.strip()] = value.strip()
    
    source_type = params.get('type')
    if not source_type:
        raise ValueError("Source type is required")
    
    if source_type == 's3':
        bucket = params.get('bucket')
        if not bucket:
            raise ValueError("S3 bucket is required")
        
        return S3Source(
            bucket=bucket,
            prefix=params.get('prefix'),
            region=params.get('region'),
            endpoint_url=params.get('endpoint-url'),
            profile=params.get('profile')
        )
    else:
        raise ValueError(f"Unsupported source type: {source_type}")


def expand_sop_paths(sop_paths_str: str) -> List[LocalDirectorySource]:
    """Expand SOP paths string into LocalDirectorySource instances

    Args:
        sop_paths_str: Colon-separated string of directory paths

    Returns:
        List of LocalDirectorySource instances
    """
    if not sop_paths_str:
        return []

    def create_source(path_str: str) -> Optional[LocalDirectorySource]:
        """Create LocalDirectorySource from path string, returning None for empty strings"""
        path_str = path_str.strip()
        if not path_str:
            return None
        return LocalDirectorySource(Path(path_str).expanduser().resolve())

    return list(filter(None, map(create_source, sop_paths_str.split(":"))))


def build_sop_sources(
    sop_sources: Optional[List[str]] = None,
    sop_paths: Optional[str] = None,
    builtin_sops_dir: Optional[Path] = None
) -> List[SOPSource]:
    """Build list of SOP sources with proper precedence order

    Args:
        sop_sources: List of source strings from --sop-source
        sop_paths: Colon-separated paths from --sop-paths
        builtin_sops_dir: Directory containing built-in SOPs

    Returns:
        List of SOPSource instances in precedence order
    """
    def parse_source_safe(source_str: str) -> Optional[SOPSource]:
        """Parse source string, returning None if invalid"""
        try:
            return parse_sop_source(source_str)
        except ValueError as e:
            logger.error(f"Invalid SOP source '{source_str}': {e}")
            return None

    sources: List[SOPSource] = []

    # 1. Add external sources from --sop-source (highest precedence)
    if sop_sources:
        sources.extend(filter(None, map(parse_source_safe, sop_sources)))

    # 2. Add local directories from --sop-paths (medium precedence)
    if sop_paths:
        sources.extend(expand_sop_paths(sop_paths))

    # 3. Add built-in SOPs (lowest precedence)
    if builtin_sops_dir and builtin_sops_dir.exists():
        sources.append(LocalDirectorySource(builtin_sops_dir))

    return sources


def load_sops_from_sources(sources: List[SOPSource]) -> List[Dict[str, Any]]:
    """Load SOPs from multiple sources with first-wins precedence

    Args:
        sources: List of SOPSource instances in precedence order

    Returns:
        List of unique SOPs (first occurrence wins by name)
    """
    seen_names = set()

    def load_from_source(source: SOPSource) -> List[Dict[str, Any]]:
        """Load SOPs from a single source, filtering duplicates"""
        logger.info(f"Loading SOPs from source: {source.get_source_info()}")
        try:
            source_sops = source.load_sops()
            new_sops = []

            for sop in source_sops:
                if sop['name'] not in seen_names:
                    seen_names.add(sop['name'])
                    new_sops.append(sop)
                    logger.debug(f"Loaded SOP '{sop['name']}' from {source.get_source_info()}")
                else:
                    logger.debug(f"Skipping duplicate SOP '{sop['name']}' from {source.get_source_info()}")

            return new_sops
        except Exception as e:
            logger.error(f"Failed to load SOPs from source {source.get_source_info()}: {e}")
            return []

    return [sop for source in sources for sop in load_from_source(source)]