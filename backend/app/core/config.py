from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database
    DATABASE_URL: str = "mysql+pymysql://worldcup:worldcuppass@localhost:3306/worldcup"

    # Security
    SECRET_KEY: str = "change-this-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_DAYS: int = 7

    # Admin seed
    ADMIN_NICKNAME: str = "admin"
    ADMIN_PASSWORD: str = "admin123"
    ADMIN_REAL_NAME: str = "Administrator"

    # App
    DEBUG: bool = False
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:80"

    # TheSportsDB integration (https://www.thesportsdb.com)
    # Free-tier key is "3"; get a Patreon key for higher rate limits
    SPORTSDB_API_KEY: str = "3"
    SPORTSDB_BASE_URL: str = "https://www.thesportsdb.com/api/v1/json"
    SPORTSDB_LEAGUE_ID: int = 4429  # FIFA World Cup
    SPORTSDB_SEASON: int = 2026

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


settings = Settings()
