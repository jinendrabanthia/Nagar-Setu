"""Request-scoped authentication, tenant context and authorization."""

from __future__ import annotations

import os
import uuid
from collections.abc import Iterator
from dataclasses import dataclass, field

from app.core.config import settings
from app.core.errors import AuthenticationError, PermissionDenied
from app.core.permissions import all_permissions_for_roles
from app.core.security import ACCESS_TOKEN_TYPE, decode_token
from app.db.session import app_session_factory, apply_tenant_context
from app.models import User
from fastapi import Depends, Request
from sqlalchemy.orm import Session

ACCESS_COOKIE = "roadguard_access"
REFRESH_COOKIE = "roadguard_refresh"
CSRF_COOKIE = "roadguard_csrf"


@dataclass(frozen=True)
class Principal:
    user_id: uuid.UUID
    organization_id: uuid.UUID
    role: str
    email: str
    full_name: str
    department_id: uuid.UUID | None
    permissions: frozenset[str] = field(default_factory=frozenset)

    def has(self, permission: str) -> bool:
        return permission in self.permissions


@dataclass
class RequestContext:
    session: Session
    principal: Principal
    request_id: str | None = None

    def require(self, permission: str) -> None:
        if permission not in self.principal.permissions:
            raise PermissionDenied(
                "Your role does not permit this action.", code="PERMISSION_DENIED"
            )

    @property
    def organization_id(self) -> uuid.UUID:
        return self.principal.organization_id

    @property
    def user_id(self) -> uuid.UUID:
        return self.principal.user_id


def _raw_token(request: Request) -> str | None:
    header = request.headers.get("authorization")
    if header and header.lower().startswith("bearer "):
        return header[7:].strip()
    return request.cookies.get(ACCESS_COOKIE)


def _dev_principal() -> Principal:
    """Create a development principal with all permissions when auth is disabled."""
    from app.core.permissions import ALL_PERMISSIONS
    return Principal(
        user_id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
        organization_id=uuid.UUID("00000000-0000-0000-0000-000000000001"),
        role="platform_admin",
        email="dev@roadguard.local",
        full_name="Development User",
        department_id=None,
        permissions=ALL_PERMISSIONS,
    )


def get_request_context(request: Request) -> Iterator[RequestContext]:
    """Authenticate, open a tenant-scoped session and yield it.

    The role and permissions always come from the database row, never from the
    request body, query string or token claims.
    """
    # DEVELOPMENT ONLY: bypass authentication when DISABLE_AUTH=true
    if settings.disable_auth:
        session = app_session_factory()()
        try:
            session.begin()
            apply_tenant_context(session, _dev_principal().organization_id)
            principal = _dev_principal()
            context = RequestContext(
                session=session,
                principal=principal,
                request_id=getattr(request.state, "request_id", None),
            )
            request.state.auth = principal
            yield context
            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()
        return

    raw = _raw_token(request)
    if not raw:
        raise AuthenticationError("Sign in to continue.")

    payload = decode_token(raw, expected_type=ACCESS_TOKEN_TYPE)
    try:
        organization_id = uuid.UUID(str(payload["org"]))
        user_id = uuid.UUID(str(payload["sub"]))
    except (KeyError, ValueError) as exc:  # pragma: no cover - defensive
        raise AuthenticationError("The supplied credential is not valid.") from exc

    session = app_session_factory()()
    try:
        session.begin()
        apply_tenant_context(session, organization_id)
        user = session.get(User, user_id)
        if user is None or user.organization_id != organization_id or not user.is_active:
            raise AuthenticationError("Your session is no longer valid. Please sign in again.")

        principal = Principal(
            user_id=user.id,
            organization_id=user.organization_id,
            role=user.role,
            email=user.email,
            full_name=user.full_name,
            department_id=user.department_id,
            permissions=all_permissions_for_roles([user.role]),
        )
        context = RequestContext(
            session=session,
            principal=principal,
            request_id=getattr(request.state, "request_id", None),
        )
        request.state.auth = principal
        yield context
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


CurrentContext = Depends(get_request_context)
