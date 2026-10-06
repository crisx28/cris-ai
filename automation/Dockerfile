FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY agentform ./agentform
COPY spec ./spec

RUN useradd --uid 10001 --no-create-home agentform
USER agentform

# Cloud Run Job args pick the phase: ["plan", "--observe"] or ["apply", "--approved"].
ENTRYPOINT ["python", "-m", "agentform"]
