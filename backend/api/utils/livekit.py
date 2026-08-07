from livekit.api import AccessToken, VideoGrants
from django.conf import settings


def generate_livekit_token(room_name, identity, name=None, is_admin=False, can_publish=True):
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
    return token.to_jwt()