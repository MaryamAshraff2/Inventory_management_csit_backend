from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
from ..models import Transit, User, InventoryByLocation
from ..serializers import TransitSerializer, TransitSendSerializer
from ..utils import log_audit_action


class TransitViewSet(viewsets.ModelViewSet):
    queryset = Transit.objects.all()
    serializer_class = TransitSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        user_type = self.request.query_params.get('userType')
        user_location = self.request.query_params.get('userLocation')
        
        # Apply role-based filtering
        if user_type == 'chairman':
            # Chairman can see all transits
            pass
        elif user_type == 'main_inventory_manager':
            # Main inventory manager can only see transits involving main inventory
            queryset = queryset.filter(
                from_location__name__icontains='main'
            ) | queryset.filter(
                to_location__name__icontains='main'
            )
        elif user_type == 'inventory_manager':
            # Inventory manager can only see transits involving their assigned location
            if user_location:
                queryset = queryset.filter(
                    from_location__name__icontains=user_location
                ) | queryset.filter(
                    to_location__name__icontains=user_location
                )
        
        return queryset.order_by('-sent_date')

    @action(detail=True, methods=['post'])
    def send(self, request, pk=None):
        """Mark transit as delivered"""
        try:
            transit = self.get_object()
            
            # Validate request data
            serializer = TransitSendSerializer(data=request.data)
            if not serializer.is_valid():
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
            received_by_user_id = serializer.validated_data['received_by_user_id']
            notes = serializer.validated_data.get('notes', '')
            
            # Get the receiving user
            try:
                received_by_user = User.objects.get(id=received_by_user_id)
            except User.DoesNotExist:
                return Response(
                    {'error': 'Receiving user not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Check if transit is already delivered
            if transit.status == 'delivered':
                return Response(
                    {'error': 'Transit is already delivered'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Mark transit as delivered and create stock movement
            stock_movement = transit.mark_as_delivered(received_by_user, notes)
            
            # Log the action
            log_audit_action(
                'Transit Delivered', 
                'Transit', 
                f"Transit {transit.id} marked as delivered by {received_by_user.username}"
            )
            
            # Return the updated transit data
            transit_serializer = TransitSerializer(transit)
            return Response({
                'message': 'Transit successfully marked as delivered.',
                'transit': transit_serializer.data
            })
            
        except Transit.DoesNotExist:
            return Response(
                {'error': 'Transit not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def in_transit(self, request):
        """Get all transits that are currently in transit"""
        queryset = self.get_queryset().filter(status='in_transit')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def delivered(self, request):
        """Get all delivered transits"""
        queryset = self.get_queryset().filter(status='delivered')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


@csrf_exempt
def transit_send_api(request):
    """API endpoint for marking transit as delivered"""
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            # Validate required fields
            if 'received_by_user_id' not in data:
                return JsonResponse({'error': 'received_by_user_id is required'}, status=400)
            
            transit_id = data.get('transit_id')
            if not transit_id:
                return JsonResponse({'error': 'transit_id is required'}, status=400)
            
            # Get the transit
            try:
                transit = Transit.objects.get(id=transit_id)
            except Transit.DoesNotExist:
                return JsonResponse({'error': 'Transit not found'}, status=404)
            
            # Check if transit is already delivered
            if transit.status == 'delivered':
                return JsonResponse({'error': 'Transit is already delivered'}, status=400)
            
            # Get the receiving user
            try:
                received_by_user = User.objects.get(id=data['received_by_user_id'])
            except User.DoesNotExist:
                return JsonResponse({'error': 'Receiving user not found'}, status=404)
            
            notes = data.get('notes', '')
            
            # Mark transit as delivered and create stock movement
            stock_movement = transit.mark_as_delivered(received_by_user, notes)
            
            # Log the action
            log_audit_action(
                'Transit Delivered', 
                'Transit', 
                f"Transit {transit.id} marked as delivered by {received_by_user.username}"
            )
            
            # Return the response in the specified format
            return JsonResponse({
                'message': 'Transit successfully marked as delivered.',
                'transit': {
                    'id': transit.id,
                    'item': {
                        'id': transit.item.id,
                        'name': transit.item.name
                    },
                    'quantity': transit.quantity,
                    'from_location': {
                        'id': transit.from_location.id,
                        'name': transit.from_location.name
                    },
                    'to_location': {
                        'id': transit.to_location.id,
                        'name': transit.to_location.name
                    },
                    'sent_by': {
                        'id': transit.sent_by.id,
                        'name': transit.sent_by.name
                    },
                    'received_by': {
                        'id': transit.received_by.id,
                        'name': transit.received_by.name
                    },
                    'status': transit.status,
                    'sent_date': transit.sent_date.isoformat(),
                    'received_date': transit.received_date.isoformat() if transit.received_date else None,
                }
            })
            
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Method not allowed'}, status=405) 