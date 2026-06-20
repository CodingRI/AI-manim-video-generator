# Manim Studio

Welcome to **Manim studio**. A full-stack, distributed application that automatically transforms natural language prompts into programmatic, high-quality educational animations.

By chaining Large Language Models (LLMs) with the Manim mathematical animation engine, this system automates the traditionally labor-intensive process of scripting, animating, and rendering technical concepts into seamless video presentations.


## Tech Stack

**Frontend & API:**
- Next.js 16 (App Router)
- React 19, Tailwind CSS v4, Lucide React, Three.js

**Infrastructure & Data:**
- PostgreSQL via Prisma ORM
- Redis via ioredis
- BullMQ for Job Queues
- AWS S3 for Blob Storage
- Railway (Docker Containerization)

**Media Processing:**
- Python 3.11
- Manim v0.20.0
- FFmpeg

## System Architecture & Pipeline



The platform is designed around a microservices-inspired architecture, decoupling the fast, user-facing Next.js application from the heavy, asynchronous video rendering workloads. Here is the rough architecture of the main workflow ->

<img width="1217" height="539" alt="Screenshot 2026-05-30 at 9 10 34 PM" src="https://github.com/user-attachments/assets/41270ef8-3f0f-44df-8035-d23c9f830eb8" />



### 1. API & Authentication Layer
When a client submits a generation request via the Next.js API (`/api/generate`), the system first validates the user's session using **NextAuth.js**. I have strictly enforced authentication before allocating any compute resources. Once verified, a new `VideoJob` is initialized in our PostgreSQL database (managed via **Prisma**) with a `pending` state.

### 2. The Message Queue (Redis & BullMQ)
Instead of processing the video synchronously—which would lead to HTTP timeouts and blocked threads—the API immediately offloads the task to a **Redis-backed BullMQ queue**. 

Redis is the backbone of this asynchronous pipeline. It provides a durable, high-throughput message broker that ensures job persistence, allows for automatic retries, and enables the system to scale its worker nodes independently from the frontend API.

### 3. The Worker Node Pipeline
A dedicated Node.js worker (deployed via a Docker container) continuously polls the Redis queue. When a job is dequeued, it undergoes a multi-stage pipeline:
- **Semantic Structuring:** The raw prompt is passed to an LLM to generate a structured JSON blueprint mapping out distinct visual scenes.
- **Code Generation:** The worker orchestrates parallel LLM calls to translate each scene from the blueprint into executable Python code using the Manim library.
- **Local Rendering:** The worker spawns child processes (`execSync`) to run Manim against the generated Python scripts, rendering out individual `.mp4` chunks at 480p/15fps.
- **Asset Concatenation:** Once all chunks are successfully rendered, FFmpeg concatenates the segments into a single, seamless video file.

### 4. Cloud Delivery
Relying on the container's ephemeral filesystem is dangerous for long-term storage. Therefore, the worker immediately uploads the final merged `.mp4` to **AWS S3**. The PostgreSQL record is updated with the persistent S3 URL, and the client (which has been polling `/api/job-status`) receives the final payload to display the video.


## Engineering Optimizations

The biggest complexity while building this pipeline to work robustly was to handle the queue jobs simultaneously and the worker's state being persistent avoiding crashing or timing out, so here are some optimization measures taken for MVP: 

- **Defensive Execution (240s Timeout):** LLMs can hallucinate Manim syntax that causes the renderer to hang indefinitely. The BullMQ worker wraps the entire generation pipeline in a `Promise.race` with a strict 4-minute timeout. If the threshold is breached, the worker gracefully kills the job, updates the database, and prevents the queue from stalling.
- **Fault-Tolerant Rendering:** If a specific scene throws a syntax error during the Manim compilation step, the pipeline catches the error, skips the corrupted chunk, and continues rendering the remaining scenes. Partial success is prioritized over complete failure.
- **Caching Layer:** Before queuing a new heavy workload, the API checks the database for an exact `(userId, prompt, status: "completed")` match. If a cached video exists, it is served instantly, bypassing the queue entirely.
- **Resource Limiting:** Video generation is compute-heavy. We currently enforce a strict quota (maximum 3 videos per user) to control cloud costs and prevent abuse.

## Demo



## Roadmap

- **Enhanced Cognitive Pipeline:** Upgrading the prompt engineering and LLM orchestration to support multi-step reasoning. This will allow the system to generate significantly longer, more mathematically complex, and better-timed educational content.
- **Tiered Architecture (Stripe Integration):** Segmenting the user base into Free (capped limits, standard processing) and Pro (unlimited generation, priority queueing, 1080p60 rendering).
- **Latency Optimization:** Swapping the current client-side HTTP polling mechanism for WebSockets or Server-Sent Events (SSE) to reduce database load and provide real-time status updates.

## Contributing

You are welcome to contribute to this project! Whether you're fixing bugs, improving the Manim prompt engineering, or optimizing the FFmpeg pipeline, your help is appreciated.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure to write test cases for new features and I will highly appreciare any suggestions to reduce the latency of the videos and increase the quality of the videos.
