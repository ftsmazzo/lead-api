from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    api_key: str
    statement_timeout_ms: int = 15000
    db_pool_min: int = 1
    db_pool_max: int = 8


settings = Settings()
