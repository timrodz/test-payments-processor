FROM python:3.12

ENV PYTHONUNBUFFERED=1

# Install uv
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#installing-uv
COPY --from=ghcr.io/astral-sh/uv:0.9.26 /uv /uvx /bin/

# Compile bytecode
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#compiling-bytecode
ENV UV_COMPILE_BYTECODE=1

# uv Cache
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#caching
ENV UV_LINK_MODE=copy

WORKDIR /app/

# Place executables in the environment at the front of the path
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#using-the-environment
ENV PATH="/app/.venv/bin:$PATH"

# Install dependencies
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#intermediate-layers
COPY uv.lock pyproject.toml /app/
COPY ./backend/pyproject.toml /app/backend/pyproject.toml
RUN uv sync --frozen --no-install-workspace --package backend

COPY ./backend/scripts /app/backend/scripts

COPY ./backend/alembic.ini /app/backend/

COPY ./backend/app /app/backend/app

# Sync the project
RUN uv sync --frozen

COPY ./backend/scripts/prestart.sh /app/backend/scripts/prestart.sh

RUN chmod +x /app/backend/scripts/prestart.sh

WORKDIR /app/backend/
ENTRYPOINT ["/app/backend/scripts/prestart.sh"]

CMD ["fastapi", "run", "--workers", "4", "app/main.py"]
