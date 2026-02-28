# 🛡️ EdgeGuardian

**A lightweight, AI-powered Reverse Proxy and Web Application Firewall (WAF) built in Node.js & TypeScript.**

EdgeGuardian is a custom-built middleware that sits between users and a web server to make requests faster, safer and highly observable.

## Overview

Modern web infrastructure requires robust routing, caching, and security at the "edge." EdgeGuardian acts as a reverse proxy that intercepts incoming HTTP requests, analyzes them for malicious intent using a multi-layered WAF (Regex + AI), serves frequent requests from an in-memory cache, and intelligently limits traffic to prevent DDoS attacks.

### Core Features (WIP)

- **Reverse Proxy:** Intercepts and forwards HTTP traffic to downstream backend servers.
- **Multi-Layered WAF:** Uses traditional Regex rules for fast, common threat detection (e.g., SQLi, XSS) and falls back to an **AI LLM (Gemini/OpenAI)** for deep semantic analysis of suspicious payloads.
- **Token Bucket Rate Limiting:** Custom implementation of the Token Bucket algorithm to manage traffic spikes and prevent abuse.
- **LRU Caching:** Custom In-Memory Least Recently Used (LRU) cache to serve repeated `GET` requests with sub-millisecond latency.
- **Observability Dashboard:** A Next.js frontend that reads locally logged SQLite telemetry to visualize traffic metrics, cache hit rates, and security events.

## Tech Stack

- **Core Proxy:** Node.js, TypeScript, HTTP/HTTPS native modules
- **Telemetry/Database:** SQLite (fast, local, file-based logging)
- **Dashboard:** Next.js, React, TailwindCSS
- **AI Engine:** Google Gemini API / OpenAI API

## System Design & Architecture

_(Note: This project is currently in active development. Architecture diagrams will be added upon completion)._

1. **Client Request** Hits Proxy (Port 3000)
2. **Rate Limiter Check** Applies Token Bucket algorithm per IP.
3. **WAF Inspection** Inspects `POST`/`PUT` bodies. Sends edge-case payloads to AI for anomaly detection.
4. **Cache Lookup** Checks LRU cache for `GET` requests. Returns instantly if hit.
5. **Backend Forwarding** Forwards safe, uncached requests to Backend (Port 8000).
6. **Response & Log** Caches the response, logs the telemetry to SQLite, and returns to Client.

## Development Roadmap (3-Week Sprint)

- [ ] **Phase 1: The Plumbing**
  - Setup TypeScript Node server.
  - Implement basic HTTP forwarding to a dummy backend.
  - Build custom `TokenBucket` class for Rate Limiting.
- [ ] **Phase 2: The Edge Logic**
  - Build custom `LRUCache` class for caching `GET` requests.
  - Integrate SQLite for asynchronous request logging (non-blocking).
- [ ] **Phase 3: The AI Shield**
  - Implement WAF middleware.
  - Integrate LLM API to analyze suspicious JSON payloads for zero-day threats.
- [ ] **Phase 4: Observability**
  - Build Next.js dashboard to query SQLite logs.
  - Visualize cache hit ratio, total requests, and AI-blocked threats.

## Getting Started

_(Instructions for cloning, installing dependencies, and running locally will be added as Phase 1 completes)._

---
