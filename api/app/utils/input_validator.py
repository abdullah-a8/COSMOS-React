import re
from typing import Optional, Tuple
import logging
from pydantic import BaseModel, field_validator, Field

logger = logging.getLogger(__name__)

class InputValidator:
    """
    Utility class for validating user inputs to prevent SQL injection
    and other input-based attacks.
    """
    
    # Regex patterns for common field validations
    EMAIL_PATTERN = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
    USERNAME_PATTERN = r'^[a-zA-Z0-9_]{3,30}$'
    PASSWORD_PATTERN = r'^(?=.*[A-Za-z])(?=.*\d)[\w@$!%*#?&\-+=<>(){}[\]|\\:;",.\'/~`^]{8,}$'
    DISPLAY_NAME_PATTERN = r'^[a-zA-Z0-9_\s]{3,50}$'  # Allow only alphanumeric, underscore, and spaces
    INVITE_CODE_PATTERN = r'^[a-zA-Z0-9-]{6,36}$'
    
    # Separate dangerous SQL characters from keywords for clearer validation
    SQL_DANGEROUS_CHARS = ["'", '"', ';', '--', '/*', '*/', '=']
    SQL_KEYWORDS = [
        # Basic operations
        'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'TRUNCATE',
        # Logic operators
        'OR', 'AND', 'NOT', 'NULL', 'IS', 'LIKE',
        # Joins
        'JOIN', 'INNER', 'OUTER', 'LEFT', 'RIGHT', 'FULL', 'UNION',
        # Database objects
        'TABLE', 'DATABASE', 'VIEW', 'INDEX', 'SCHEMA', 'COLUMN', 'CONSTRAINT',
        # Other common SQL terms
        'FROM', 'WHERE', 'GROUP', 'HAVING', 'ORDER', 'BY', 'LIMIT', 'OFFSET',
        # Functions
        'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'EXEC', 'EXECUTE'
    ]
    
    # Pre-compiled regex patterns for SQL injection detection
    SUSPICIOUS_PATTERNS = [
        re.compile(r"(\s|;|')\s*(DROP|DELETE|UPDATE|INSERT|ALTER|EXEC|TRUNCATE)\s+", re.IGNORECASE),
        re.compile(r"(;|\s)+\s*(UNION|SELECT)\s+", re.IGNORECASE),
        re.compile(r"\s+(OR|AND)\s+\w+\s*[=<>]", re.IGNORECASE),
        re.compile(r"'\s*OR\s+[\w\d]+\s*=\s*[\w\d]+", re.IGNORECASE),
        re.compile(r"'\s*OR\s+.*[=<>].*", re.IGNORECASE),
        re.compile(r"--.*$", re.IGNORECASE),
        re.compile(r"/\*[\s\S]*?\*/", re.IGNORECASE),
        re.compile(r";\s*$", re.IGNORECASE)
    ]
    
    @classmethod
    def validate_email(cls, email: str) -> Tuple[bool, Optional[str]]:
        """
        Validate an email address format.
        
        Args:
            email: The email to validate
            
        Returns:
            Tuple containing (is_valid, error_message)
        """
        if not email:
            return False, "Email is required"
            
        if not re.match(cls.EMAIL_PATTERN, email):
            return False, "Invalid email format"
            
        # Check for SQL injection patterns
        if cls._contains_sql_patterns(email):
            return False, "Email contains invalid characters"
            
        return True, None
    
    @classmethod
    def validate_password(cls, password: str) -> Tuple[bool, Optional[str]]:
        """
        Validate password strength and format.
        
        Args:
            password: The password to validate
            
        Returns:
            Tuple containing (is_valid, error_message)
        """
        if not password:
            return False, "Password is required"
            
        # Use the PASSWORD_PATTERN regex for validation instead of manual checks
        if not re.match(cls.PASSWORD_PATTERN, password):
            return False, "Password must be at least 10 characters and contain letters, numbers, and special characters"
            
        
        return True, None
    
    @classmethod
    def validate_username(cls, username: str) -> Tuple[bool, Optional[str]]:
        """
        Validate username format.
        
        Args:
            username: The username to validate
            
        Returns:
            Tuple containing (is_valid, error_message)
        """
        if not username:
            return False, "Username is required"
            
        if not re.match(cls.USERNAME_PATTERN, username):
            return False, "Username must be 3-30 characters and contain only letters, numbers, and underscores"
            
        # Check for SQL injection patterns
        if cls._contains_sql_patterns(username):
            return False, "Username contains invalid characters"
            
        return True, None
    
    @classmethod
    def validate_display_name(cls, display_name: str) -> Tuple[bool, Optional[str]]:
        """
        Validate display name format.
        
        Args:
            display_name: The display name to validate
            
        Returns:
            Tuple containing (is_valid, error_message)
        """
        if display_name is None:
            return True, None  # Optional field genuinely not supplied

        if display_name.strip() == "":
            return False, "Display name cannot be blank"
            
        if not re.match(cls.DISPLAY_NAME_PATTERN, display_name):
            return False, "Display name must be 3-50 characters and can only contain letters, numbers, spaces, and underscores"
            
        # Check for SQL injection patterns - this is critical for security
        if cls._contains_sql_patterns(display_name):
            return False, "Display name contains disallowed words or characters"
            
        return True, None
    
    @classmethod
    def validate_invite_code(cls, invite_code: str) -> Tuple[bool, Optional[str]]:
        """
        Validate invite code format.
        
        Args:
            invite_code: The invite code to validate
            
        Returns:
            Tuple containing (is_valid, error_message)
        """
        if not invite_code:
            return False, "Invite code is required"
            
        if not re.match(cls.INVITE_CODE_PATTERN, invite_code):
            return False, "Invalid invite code format"
            
        # Check for SQL injection patterns
        if cls._contains_sql_patterns(invite_code):
            return False, "Invite code contains invalid characters"
            
        return True, None
    
    @classmethod
    def _contains_sql_patterns(cls, value: str) -> bool:
        """
        Check if a string contains common SQL injection patterns.
        
        Args:
            value: The string to check
            
        Returns:
            bool: True if SQL patterns are found
        """
        if not isinstance(value, str):
            return False
            
        # Convert to lowercase for case-insensitive matching
        value_lower = value.lower()
        
        # Check for SQL-specific dangerous patterns
        for pattern in cls.SQL_DANGEROUS_CHARS:
            if pattern.lower() in value_lower:
                # These are almost always problematic in user input for SQL
                return True
                
        # Check for SQL keywords that might indicate injection attempts
        for keyword in cls.SQL_KEYWORDS:
            if keyword.lower() in value_lower:
                # First check with operators (more strict)
                if re.search(r'\b' + keyword.lower() + r'\b\s*(=|<|>|\()', value_lower):
                    return True
                    
                # For display name validation, also check for standalone keywords
                # This prevents names like "DROP USERS TABLE" that could be malicious
                if re.search(r'\b' + keyword.lower() + r'\b', value_lower):
                    # Allow only if it's part of a legitimate word (e.g., "Andrew" contains "AND")
                    # But reject if it's a standalone SQL keyword
                    potential_words = value_lower.split()
                    for word in potential_words:
                        if word.lower() == keyword.lower():
                            return True
        
        # Check for common SQL injection patterns using pre-compiled patterns
        for pattern in cls.SUSPICIOUS_PATTERNS:
            if pattern.search(value):
                return True
                
        return False


# Define Pydantic models for form validation
class LoginForm(BaseModel):
    email: str
    password: str
    form_type: str = "login"  # Add explicit form type field
    
    @field_validator('email')
    def validate_email(cls, v):
        valid, error = InputValidator.validate_email(v)
        if not valid:
            raise ValueError(error)
        return v
    
    @field_validator('password')
    def validate_password(cls, v):
        valid, error = InputValidator.validate_password(v)
        if not valid:
            # Use a simple ValueError since we have form_type field
            raise ValueError(error)
        return v


class RegisterForm(BaseModel):
    email: str
    password: str
    display_name: Optional[str] = None
    invite_code: str
    terms_accepted: bool = False
    
    @field_validator('email')
    def validate_email(cls, v):
        valid, error = InputValidator.validate_email(v)
        if not valid:
            raise ValueError(error)
        return v
    
    @field_validator('password')
    def validate_password(cls, v):
        valid, error = InputValidator.validate_password(v)
        if not valid:
            raise ValueError(error)
        return v
    
    @field_validator('display_name')
    def validate_display_name(cls, v):
        if v is None:
            return v
        valid, error = InputValidator.validate_display_name(v)
        if not valid:
            raise ValueError(error)
        return v
    
    @field_validator('invite_code')
    def validate_invite_code(cls, v):
        valid, error = InputValidator.validate_invite_code(v)
        if not valid:
            raise ValueError(error)
        return v
    
    @field_validator('terms_accepted')
    def validate_terms(cls, v):
        if not v:
            raise ValueError("You must accept the terms and conditions")
        return v


class UpdateProfileForm(BaseModel):
    display_name: str = Field(..., min_length=3, max_length=50, pattern=r'^[a-zA-Z0-9_\s]{3,50}$')
    
    @field_validator('display_name')
    def validate_display_name(cls, v):
        # Additional validation beyond the basic pattern check
        if v.strip() == "":
            raise ValueError("Display name cannot be blank")
            
        valid, error = InputValidator.validate_display_name(v)
        if not valid:
            raise ValueError(error)
        return v 