from .models import AuditLog, User

def log_audit_action(action, entity_type, details):
    admin_user = User.objects.filter(role='admin').first()
    AuditLog.objects.create(
        action=action,
        entity_type=entity_type,
        performed_by=admin_user,
        details=details
    ) 