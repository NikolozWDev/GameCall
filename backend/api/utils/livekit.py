from livekit.api import AccessToken, VideoGrants
from django.conf import settings


def generate_livekit_token(room_name, identity, name="", is_admin=False):
    return (
        AccessToken(
            settings.LIVEKIT_API_KEY,
            settings.LIVEKIT_API_SECRET,
        )
        .with_identity(identity)
        .with_name(name)
        .with_grants(
            VideoGrants(
                room_join=True,
                room=room_name,
                can_publish=is_admin,
                can_subscribe=True,
                can_publish_data=True,
            )
        )
        .to_jwt()
    )