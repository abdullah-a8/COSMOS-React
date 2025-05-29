from typing import Dict, Any, Union
from pydantic import ValidationError
import logging

logger = logging.getLogger(__name__)

def format_validation_error(error: Union[ValidationError, ValueError]) -> Dict[str, Any]:
    """
    Formats Pydantic validation errors into user-friendly messages.
    
    Args:
        error: The validation error to format
        
    Returns:
        A dictionary with well-formatted error messages
    """
    # If it's already a string (simple ValueError), return it directly
    if isinstance(error, ValueError) and not isinstance(error, ValidationError):
        return {"message": str(error)}
    
    # Handle Pydantic ValidationError
    try:
        if isinstance(error, ValidationError):
            errors = error.errors()
            
            # Check if this is a login form validation
            is_login_form = False
            # Look for form_type field in the model data
            if hasattr(error, 'model') and hasattr(error.model, 'model_fields') and 'form_type' in error.model.model_fields:
                is_login_form = True
                logger.debug("Detected login form validation error")
            
            # Create a mapping of field names to user-friendly error messages
            field_errors = {}
            
            for err in errors:
                loc = err.get("loc", ["unknown"])
                field = loc[0] if loc else "unknown"
                error_type = err.get("type", "")
                
                # Map different error types to user-friendly messages
                if "password" in str(field).lower():
                    # Check if this is coming from a login form context
                    if is_login_form:
                        # For login form errors, don't suggest format requirements
                        field_errors[field] = "Please enter your password."
                    elif "value_error" in error_type:
                        field_errors[field] = "Your password must be at least 8 characters and include both letters and numbers."
                    elif "string_too_short" in error_type:
                        field_errors[field] = "Your password is too short. It must be at least 8 characters."
                    elif "missing" in error_type:
                        field_errors[field] = "Please enter your password."
                    else:
                        field_errors[field] = "Your password doesn't meet our security requirements."
                
                elif "email" in str(field).lower():
                    if "value_error" in error_type or "pattern" in error_type:
                        field_errors[field] = "Please enter a valid email address."
                    elif "missing" in error_type:
                        field_errors[field] = "Please enter your email address."
                    else:
                        field_errors[field] = "There's an issue with your email address."
                
                elif "display_name" in str(field).lower():
                    if "value_error" in error_type or "pattern" in error_type:
                        field_errors[field] = "Display name can only contain letters, numbers, spaces, and underscores."
                    elif "string_too_short" in error_type:
                        field_errors[field] = "Display name is too short. It must be at least 3 characters."
                    elif "string_too_long" in error_type:
                        field_errors[field] = "Display name is too long. It must be at most 50 characters."
                    else:
                        field_errors[field] = "There's an issue with your display name."
                
                elif "invite_code" in str(field).lower():
                    if "missing" in error_type:
                        field_errors[field] = "Please enter an invite code."
                    else:
                        field_errors[field] = "This invite code is invalid."
                
                elif "terms_accepted" in str(field).lower():
                    field_errors[field] = "You must accept the terms and conditions to continue."
                
                else:
                    # Default message for other fields
                    field_errors[field] = err.get("msg", "Invalid input")
            
            # Log the original error for debugging
            logger.debug(f"Transformed validation error into field errors: {list(field_errors.keys())}")
            
            # If we have field-specific errors, return them
            if field_errors:
                return {
                    "message": "Please check your information and try again.",
                    "fields": field_errors
                }
            
            # Fallback for empty errors (shouldn't happen)
            return {"message": "Invalid input provided. Please check your information."}
        
        # Fallback for non-ValidationError exceptions
        return {"message": str(error)}
    
    except Exception as e:
        # Fallback for any errors during formatting
        logger.error(f"Error formatting validation error: {e}")
        return {"message": "An error occurred while validating your input."} 