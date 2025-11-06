#!/usr/bin/env python3
"""Startup script for the Python service"""

import sys
import os

# Add current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import main

if __name__ == '__main__':
    import asyncio
    asyncio.run(main())
