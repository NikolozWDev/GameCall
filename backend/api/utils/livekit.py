from livekit.api import AccessToken, VideoGrants
from django.conf import settings


def generate_livekit_token(room_name, identity, name=None, is_admin=False, can_publish=True):
    print(f"DEBUG: LIVEKIT_API_KEY = {settings.LIVEKIT_API_KEY[:10]}...")
    print(f"DEBUG: room_name = {room_name}, identity = {identity}")
    
    if not room_name or not identity:
        raise ValueError(f"room_name and identity are required. room_name={room_name}, identity={identity}")
    
    token = (
        AccessToken(
            settings.LIVEKIT_API_KEY,
            settings.LIVEKIT_API_SECRET,
        )
        .with_identity(identity)
    )
    if name:
        token = token.with_name(name)
    token = token.with_grants(
        VideoGrants(
            room_join=True,
            room=room_name,
            can_publish=can_publish,
            can_subscribe=True,
            can_publish_data=True,
        )
    )
    jwt_token = token.to_jwt()
    print(f"DEBUG: Token first 80 chars: {jwt_token[:80]}...")
    return jwt_token