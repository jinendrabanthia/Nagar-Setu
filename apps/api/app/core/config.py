"""Typed application configuration.

Every setting is read from environment variables (or the repository ``.env``).
Nothing here may be imported by the web application: the browser never receives
database, Redis, object-storage or camera credentials.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

REPO_ROOT = Path(__file__).resolve().parents[4]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(str(REPO_ROOT / ".env"), ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # --- runtime ---
    environment: Literal["development", "test", "production"] = "development"
    api_port: int = 8000
    log_level: str = "INFO"
    api_prefix: str = "/api/v1"

    # --- security ---
    secret_key: str = ""
    access_token_ttl_minutes: int = 15
    refresh_token_ttl_days: int = 7
    cookie_secure: bool = False
    cookie_domain: str | None = None
    allowed_origins: str = "http://localhost:3000"
    login_rate_limit_per_minute: int = 10
    # DEVELOPMENT ONLY: set true to bypass authentication (never use in production!)
    disable_auth: bool = False

    # --- database ---
    database_app_url: str = ""
    database_migration_url: str = ""
    postgres_app_user: str = "roadguard_app"
    database_pool_size: int = 10
    database_echo: bool = False
    # Managed PostgreSQL (Supabase) terminates TLS. ``prefer`` keeps local
    # containers working; set ``require``/``verify-full`` for Supabase.
    database_ssl_mode: str = "prefer"
    database_connect_timeout_seconds: int = 10
    # Optional managed-database inputs read by scripts/supabase_setup.py. Keeping
    # them here lets the operator put the URL in .env instead of a shell argument.
    supabase_db_url: str = ""
    supabase_pooler_url: str = ""

    # --- queue ---
    redis_url: str = "redis://localhost:6379/0"
    job_runner: Literal["polling", "celery"] = "polling"
    job_max_attempts: int = 3
    job_lease_seconds: int = 900

    # --- storage ---
    storage_backend: Literal["local", "s3"] = "local"
    local_storage_dir: str = "./storage"
    s3_endpoint_url: str = "http://localhost:9000"
    # Browser-reachable endpoint used to sign URLs. Defaults to s3_endpoint_url.
    s3_public_endpoint_url: str | None = None
    s3_access_key_id: str = ""
    s3_secret_access_key: str = ""
    s3_bucket: str = "roadguard-private"
    s3_region: str = "us-east-1"
    signed_url_ttl_seconds: int = 900

    # --- ingestion limits ---
    max_upload_bytes: int = 200 * 1024 * 1024
    max_video_duration_seconds: int = 600
    max_video_width: int = 3840
    max_video_height: int = 2160
    video_retention_days: int = 30

    # --- AI pipeline ---
    detector_backend: Literal["synthetic_scene", "yolo"] = "synthetic_scene"
    yolo_weights: str = "yolov8n.pt"
    yolo_confidence_threshold: float = 0.35
    frame_sample_fps: float = 5.0
    tracker: str = "max_iou"
    near_miss_proximity_ratio: float = 0.55
    near_miss_convergence_window_seconds: float = 2.0
    near_miss_min_track_frames: int = 5

    # --- live cctv ---
    live_cctv_enabled: bool = False
    live_cctv_allowed_hosts: str = ""
    live_cctv_allowed_cidrs: str = ""

    # --- optional LLM assistant ---
    llm_provider: Literal["none", "openai"] = "none"
    llm_model: str = ""
    openai_api_key: str = ""
    llm_base_url: str = "https://api.openai.com/v1"
    llm_timeout_seconds: int = 30

    # --- demo ---
    demo_mode: bool = True

    @property
    def api_base(self) -> str:
        return self.api_prefix

    @field_validator("secret_key")
    @classmethod
    def _validate_secret(cls, value: str) -> str:
        return value

    @property
    def is_production(self) -> bool:
        return self.environment == "production"

    @property
    def allowed_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]

    @property
    def live_cctv_allowed_host_set(self) -> set[str]:
        return {
            host.strip().lower()
            for host in self.live_cctv_allowed_hosts.split(",")
            if host.strip()
        }

    @property
    def live_cctv_allowed_cidrs_list(self) -> list[str]:
        return [cidr.strip() for cidr in self.live_cctv_allowed_cidrs.split(",") if cidr.strip()]

    @property
    def local_storage_path(self) -> Path:
        path = Path(self.local_storage_dir)
        if not path.is_absolute():
            path = REPO_ROOT / path
        return path

    @property
    def supported_video_content_types(self) -> set[str]:
        return {"video/mp4", "video/quicktime", "video/x-matroska", "video/webm"}

    @property
    def supported_video_extensions(self) -> set[str]:
        return {".mp4", ".mov", ".mkv", ".webm"}

    @property
    def database_tls_enabled(self) -> bool:
        return self.database_ssl_mode not in {"", "disable", "allow", "prefer"}

    def require_runtime_secrets(self) -> None:
        """Fail fast when a required secret is missing or obviously unsafe."""
        problems: list[str] = []
        if not self.secret_key:
            problems.append("SECRET_KEY is not set")
        elif self.is_production and (len(self.secret_key) < 32 or "change-me" in self.secret_key):
            problems.append("SECRET_KEY must be at least 32 random characters in production")
        if not self.database_app_url:
            problems.append("DATABASE_APP_URL is not set")
        if not self.database_migration_url:
            problems.append("DATABASE_MIGRATION_URL is not set")
        if self.is_production and not self.cookie_secure:
            problems.append("COOKIE_SECURE must be true in production")
        if problems:
            raise RuntimeError("Invalid ROADGUARD AI configuration: " + "; ".join(problems))


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
