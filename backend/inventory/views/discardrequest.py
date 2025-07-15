from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from ..models import DiscardRequest, InventoryByLocation, Item, Location, User
from ..serializers import DiscardRequestSerializer
from ..utils import log_audit_action

# User: Create discard request, list own requests
@api_view(['POST', 'GET'])
@permission_classes([permissions.AllowAny])
def user_discard_requests(request):
    # PATCH: Manually resolve user from portalID or requested_by_id
    user = None
    portal_id = None
    if request.method == 'POST':
        data = request.data.copy()
        portal_id = data.get('portalID') or data.get('requested_by_id') or data.get('requested_by')
    else:
        portal_id = request.query_params.get('portalID') or request.query_params.get('requested_by_id') or request.query_params.get('requested_by')
    if not portal_id:
        portal_id = request.headers.get('X-Portal-Id')
    if not portal_id:
        portal_id = request.COOKIES.get('portalID')
    if not portal_id:
        portal_id = 'user'  # fallback for demo
    # Try to find user by name or email (customize as needed)
    try:
        user = User.objects.filter(name__iexact=portal_id).first() or User.objects.filter(email__iexact=portal_id).first() or User.objects.first()
    except Exception:
        user = None
    if not user:
        return Response({'error': 'User not found. Please log in.'}, status=403)
    if request.method == 'POST':
        data = request.data.copy()
        data['requested_by_id'] = user.id
        if 'location_id' not in data:
            return Response({'error': 'location_id is required'}, status=400)
        serializer = DiscardRequestSerializer(data=data)
        if serializer.is_valid():
            serializer.save(status='pending')
            log_audit_action('Discard Request Created', 'DiscardRequest', f"User {user.id} requested discard of item {data.get('item_id')} at location {data.get('location_id')}")
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
    else:  # GET
        location_id = request.query_params.get('location_id')
        if not location_id:
            return Response({'error': 'location_id is required'}, status=400)
        requests = DiscardRequest.objects.filter(requested_by=user, location_id=location_id)
        serializer = DiscardRequestSerializer(requests, many=True)
        return Response(serializer.data)

# Admin: List pending requests
@api_view(['GET'])
def admin_pending_discard_requests(request):
    requests = DiscardRequest.objects.filter(status='pending').order_by('date_requested')
    serializer = DiscardRequestSerializer(requests, many=True)
    return Response(serializer.data)

# Admin: Process (approve/reject) a discard request
@api_view(['POST'])
def admin_process_discard_request(request, pk):
    try:
        discard_request = DiscardRequest.objects.get(pk=pk)
    except DiscardRequest.DoesNotExist:
        return Response({'error': 'DiscardRequest not found'}, status=404)
    if discard_request.status != 'pending':
        return Response({'error': 'Request already processed'}, status=400)
    action = request.data.get('action')
    if action not in ['approve', 'reject']:
        return Response({'error': 'Action must be approve or reject'}, status=400)
    if action == 'approve':
        # Deduct inventory at location
        try:
            inventory = InventoryByLocation.objects.get(item=discard_request.item, location=discard_request.location)
            if inventory.quantity < discard_request.quantity:
                return Response({'error': 'Not enough quantity to discard'}, status=400)
            inventory.remove_quantity(discard_request.quantity)
        except InventoryByLocation.DoesNotExist:
            return Response({'error': 'No inventory for this item at this location'}, status=400)
        discard_request.status = 'approved'
        discard_request.date_processed = timezone.now()
        discard_request.save()
        log_audit_action('Discard Request Approved', 'DiscardRequest', f"Admin approved discard request {discard_request.id}")
        return Response({'status': 'approved'})
    else:
        discard_request.status = 'rejected'
        discard_request.date_processed = timezone.now()
        discard_request.save()
        log_audit_action('Discard Request Rejected', 'DiscardRequest', f"Admin rejected discard request {discard_request.id}")
        return Response({'status': 'rejected'}) 