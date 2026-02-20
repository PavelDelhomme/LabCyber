# Backend terminal maison Lab Cyber (PTY + WebSocket, protocole binaire)
FROM golang:1.21-alpine AS builder
WORKDIR /app
RUN apk add --no-cache gcc musl-dev
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=1 go build -o /lab-terminal .

FROM alpine:3.19
RUN apk add --no-cache ca-certificates
COPY --from=builder /lab-terminal /lab-terminal
EXPOSE 7682
ENV PORT=7682
ENTRYPOINT ["/lab-terminal"]
