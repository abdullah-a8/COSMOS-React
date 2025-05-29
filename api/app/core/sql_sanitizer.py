from typing import Dict, Any, List
import re
import logging

logger = logging.getLogger(__name__)

class SQLSanitizer:
    """
    Class for detecting potential SQL injection patterns in inputs.
    Does not modify data - instead relies on parameterized queries for protection.
    """
    
    # Pre-compiled regex patterns for detecting common SQL injection patterns
    SUSPICIOUS_PATTERNS = [
        re.compile(r"(\s|;|')\s*(DROP|DELETE|UPDATE|INSERT|ALTER|EXEC|TRUNCATE)\s+", re.IGNORECASE),
        re.compile(r"(;|\s)+\s*(UNION|SELECT)\s+", re.IGNORECASE),
        re.compile(r"\s+(OR|AND)\s+(\w+|[\d'\"]+)\s*[=<>!]\s*(\w+|[\d'\"]+)", re.IGNORECASE),
        re.compile(r"'\s*OR\s+[\w\d]+\s*=\s*[\w\d]+", re.IGNORECASE),
        re.compile(r"'\s*OR\s+\s*(=|<|>|LIKE).*", re.IGNORECASE),
        re.compile(r"--.*$", re.IGNORECASE),
        re.compile(r"/\*[\s\S]*?\*/", re.IGNORECASE),
        re.compile(r";\s*(--|\#|/\*)", re.IGNORECASE),
        re.compile(r"\bCAST\s*\(", re.IGNORECASE),
        re.compile(r"\bCHAR\s*\(", re.IGNORECASE),
        re.compile(r"\bCONCAT\s*\(", re.IGNORECASE),
        re.compile(r"\bCONVERT\s*\(", re.IGNORECASE),
        re.compile(r"\bSYSTEM_USER\s*\(", re.IGNORECASE),
        re.compile(r"\bLOAD_FILE\s*\(", re.IGNORECASE),
        # Add patterns for advanced injection techniques
        re.compile(r"\b(SLEEP|WAITFOR|BENCHMARK)\s*\(", re.IGNORECASE),  # Time-based injection
        re.compile(r"\b(IF|IIF)\s*\(.*,.*,.*\)", re.IGNORECASE)  # Conditional statements
    ]
    
    # Common SQL keywords to check in large inputs
    SQL_KEYWORDS = ['SELECT', 'DROP', 'DELETE', 'UPDATE', 'INSERT', 'UNION', 
                   'ALTER', 'CREATE', 'EXEC', 'TRUNCATE', 'INFORMATION_SCHEMA']
    
    # Max input size for strings (in characters)
    MAX_STRING_SIZE = 10000
    
    # Max recursion depth for nested structures
    MAX_RECURSION_DEPTH = 10
    
    @classmethod
    def is_suspicious(cls, value: str) -> bool:
        """
        Check if a string contains suspicious SQL injection patterns.
        
        Args:
            value: The string to check
            
        Returns:
            bool: True if the string contains suspicious patterns
        """
        if not isinstance(value, str):
            return False
            
        # Check each pattern using pre-compiled regex for better performance
        for pattern in cls.SUSPICIOUS_PATTERNS:
            if pattern.search(value):
                # Don't log the actual value to prevent exposing sensitive data
                logger.warning("Potential SQL injection pattern detected")
                return True
                
        return False
    
    @classmethod
    def check_input(cls, input_data: Any, depth: int = 0) -> bool:
        """
        Check user input for SQL injection patterns.
        Handles strings, dictionaries, and lists recursively.
        Does not modify the input data.
        
        Args:
            input_data: Input data to check
            depth: Current recursion depth
            
        Returns:
            bool: True if suspicious patterns were found
        """
        # Prevent excessive recursion
        if depth > cls.MAX_RECURSION_DEPTH:
            logger.warning("Maximum recursion depth reached in SQL injection check")
            return False
            
        # Handle large inputs more gracefully
        if isinstance(input_data, str) and len(input_data) > cls.MAX_STRING_SIZE:
            logger.warning("Input too large for full SQL injection checking, performing simplified check")
            # Perform a more targeted check for large inputs
            upper_data = input_data.upper()
            suspicious_count = sum(1 for keyword in cls.SQL_KEYWORDS if keyword in upper_data)
            # Flag as suspicious if multiple SQL keywords are present
            return suspicious_count >= 2
        
        # Handle different types of input
        if isinstance(input_data, str):
            return cls.is_suspicious(input_data)
        elif isinstance(input_data, dict):
            return cls._check_dict(input_data, depth)
        elif isinstance(input_data, list):
            return cls._check_list(input_data, depth)
        else:
            # Numbers, booleans, etc. don't need checking
            return False
    
    @classmethod
    def _check_dict(cls, data: Dict[str, Any], depth: int = 0) -> bool:
        """
        Check a dictionary of values recursively.
        
        Args:
            data: Dictionary to check
            depth: Current recursion depth
            
        Returns:
            bool: True if suspicious patterns were found
        """
        if depth > cls.MAX_RECURSION_DEPTH:
            logger.warning("Maximum recursion depth reached in dictionary check")
            return False
            
        for key, value in data.items():
            if cls.check_input(value, depth + 1):
                return True
        return False
    
    @classmethod
    def _check_list(cls, data: List[Any], depth: int = 0) -> bool:
        """
        Check a list of values recursively.
        
        Args:
            data: List to check
            depth: Current recursion depth
            
        Returns:
            bool: True if suspicious patterns were found
        """
        if depth > cls.MAX_RECURSION_DEPTH:
            logger.warning("Maximum recursion depth reached in list check")
            return False
            
        for value in data:
            if cls.check_input(value, depth + 1):
                return True
        return False 