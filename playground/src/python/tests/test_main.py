"""Tests for main service module"""

import pytest
import asyncio
from unittest.mock import patch, MagicMock

from main import PythonService


class TestPythonService:
    """Test cases for PythonService"""
    
    def test_service_initialization(self):
        """Test service initializes correctly"""
        service = PythonService()
        assert service.running is False
        assert service.logger is not None
    
    def test_health_check_stopped(self):
        """Test health check when service is stopped"""
        service = PythonService()
        health = service.health_check()
        
        assert health['status'] == 'stopped'
        assert 'port' in health
        assert 'host' in health
        assert 'log_level' in health
    
    def test_health_check_running(self):
        """Test health check when service is running"""
        service = PythonService()
        service.running = True
        health = service.health_check()
        
        assert health['status'] == 'healthy'
    
    @pytest.mark.asyncio
    async def test_start_service(self):
        """Test service starts correctly"""
        service = PythonService()
        
        # Mock the main loop to avoid infinite wait
        with patch.object(service, '_signal_handler'):
            # Start service in background
            start_task = asyncio.create_task(service.start())
            
            # Give it a moment to start
            await asyncio.sleep(0.1)
            
            assert service.running is True
            
            # Stop the service
            await service.stop()
            
            # Wait for start task to complete
            await start_task
    
    @pytest.mark.asyncio
    async def test_stop_service(self):
        """Test service stops correctly"""
        service = PythonService()
        service.running = True
        
        await service.stop()
        assert service.running is False
    
    @pytest.mark.asyncio
    async def test_stop_already_stopped(self):
        """Test stopping already stopped service"""
        service = PythonService()
        assert service.running is False
        
        # Should not raise exception
        await service.stop()
        assert service.running is False
    
    def test_signal_handler(self):
        """Test signal handler sets running to False"""
        service = PythonService()
        service.running = True
        
        service._signal_handler(2, None)  # SIGINT
        assert service.running is False
