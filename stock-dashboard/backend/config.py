from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    moomoo_host: str = "127.0.0.1"
    moomoo_port: int = 11111
    db_path: str = "/data/db.sqlite3"
    tz: str = "Asia/Tokyo"
    ws_refresh_interval: int = 1000
    default_market: str = "JP"
    initial_simulation_money: int = 10_000_000
    max_chart_windows: int = 8
    max_history_years: int = 3

    class Config:
        env_file = ".env"


settings = Settings()
