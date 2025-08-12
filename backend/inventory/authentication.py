from rest_framework import authentication
from rest_framework import exceptions
from django.contrib.auth.models import AnonymousUser
from .models import User
from .views.login import TOKEN_STORE
from datetime import datetime

class TokenAuthentication(authentication.BaseAuthentication):
    """
    Custom authentication class that works with token-based authentication
    """
    
    def authenticate(self, request):
        print(f"DEBUG: TokenAuthentication.authenticate called")
        
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            print("DEBUG: No Bearer token in Authorization header")
            return None
        
        token = auth_header[7:]  # Remove 'Bearer ' prefix
        print(f"DEBUG: Token from header: {token}")
        
        # Check if token exists and is valid
        if token not in TOKEN_STORE:
            print("DEBUG: Token not found in store")
            return None
        
        token_data = TOKEN_STORE[token]
        
        # Check if token is expired
        if datetime.now() > token_data['expires_at']:
            print("DEBUG: Token expired")
            del TOKEN_STORE[token]
            return None
        
        try:
            # Get the user from our custom User model
            user = User.objects.get(id=token_data['user_id'])
            print(f"DEBUG: Found user: {user.username} with role: {user.role}")
            return (user, None)
        except User.DoesNotExist:
            print(f"DEBUG: User with ID {token_data['user_id']} not found")
            # Clear invalid token
            del TOKEN_STORE[token]
            return None
    
    def authenticate_header(self, request):
        return 'Bearer'
