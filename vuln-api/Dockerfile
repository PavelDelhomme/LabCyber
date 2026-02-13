FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
ENV FLASK_APP=app.py
EXPOSE 5000
# Données dans volume pour persistance
RUN mkdir -p /data
CMD ["python", "app.py"]
