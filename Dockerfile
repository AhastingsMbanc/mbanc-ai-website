# Lightweight Flask dashboard for mbanc.ai
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 5070

CMD ["gunicorn", "--bind", "0.0.0.0:5070", "--workers", "2", "--timeout", "60", "app:app"]
