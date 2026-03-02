# Backend

## Database

### Migrations

#### Generate

```bash
uv run alembic revision --autogenerate -m "<MESSAGE>"
```

#### Run

```bash
uv run alembic upgrade head
```

### Seed

```bash
uv run python -m app.seed
```
