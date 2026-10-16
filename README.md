# 🎬 Filza Motion AI

### Next-Generation Free AI Text-to-Video Studio

**Turn your imagination into motion.** Filza Motion AI is a cinematic, browser-based text-to-video studio designed to let anyone generate AI-powered video clips from simple text prompts — without creating an account or supplying a personal API key.

Built with a responsive, cinematic interface and a static-site architecture, Filza Motion AI connects directly to a compatible hosted AI inference service to generate video.

<p align="center">
  <img src="assets/logo.svg" alt="Filza Motion AI logo" width="120">
</p>

<p align="center">
  <strong>Free to access · No accounts · No personal API keys · Open source</strong>
</p>

---

## ✨ Features

### 🎨 Cinematic User Interface
- Premium dark interface with violet and electric-cyan accents.
- Responsive design for desktop, tablet, and mobile.
- Interactive prompt editor with character counter and validation.
- Quick-prompt styles for Cinematic, Cyberpunk, Anime, Slow Motion, and Space Nebula.

### 🤖 AI Video Generation
- Text-to-video generation through a compatible hosted inference service.
- Checkpoint presets for different visual styles, including `epiCRealism` and `ToonYou`, when supported by the configured backend.
- Adjustable inference steps for supported generation configurations.
- Queue monitoring and generation status feedback.
- Graceful handling of failed requests, unavailable services, and rate limits.

### 🎥 Camera Motion Controls
Explore supported camera-motion presets:

- Natural
- Zoom In / Zoom Out
- Tilt Up / Tilt Down
- Pan Left / Pan Right
- Roll Clockwise / Roll Counter-Clockwise

Availability depends on the model and inference endpoint configuration.

### ▶️ Video Preview and Download
- In-browser video playback.
- Playback speed controls.
- Seek, mute, loop, and fullscreen controls.
- Download generated video when the inference service returns an accessible output.
- Video output naming using a timestamp.

### 🖼️ Prompt Gallery
- Curated example prompts.
- One-click prompt selection.
- Camera-motion presets for supported examples.
- A quick starting point for experimenting with different creative styles.

### 🔒 Privacy-Conscious Architecture
- No application-level accounts or email collection.
- No application-owned database.
- No application-owned video storage.
- No analytics or tracking scripts intentionally included.
- Direct browser-to-provider inference requests.

**Privacy note:** The inference provider and hosting platform may process technical request data, including IP addresses and generation requests. Their retention and privacy policies apply. This project does not guarantee that third-party services retain no data.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Hosting | GitHub Pages |
| AI inference | Hugging Face Spaces / compatible Gradio endpoint |
| Inference communication | Gradio queue protocol and Server-Sent Events, where supported |
| Video playback | HTML5 Video API |
| Downloads | Browser Blob and URL APIs |
| Automated tests | Node.js test scripts |

The frontend is designed as a static website and does not require a conventional application server.

---

## 🏗️ Project Architecture

```text
Filza_Generator/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── assets/
│   └── logo.svg
├── js/
│   ├── app.js
│   ├── config.js
│   ├── generator.js
│   ├── inference-client.js
│   ├── ui.js
│   └── validation.js
├── tests/
│   ├── client.test.mjs
│   ├── config.test.mjs
│   ├── run_all_tests.mjs
│   └── validation.test.mjs
├── index.html
├── styles.css
├── .nojekyll
├── LICENSE
└── README.md
```

### Module responsibilities

- **`app.js`** — Application initialization and event coordination.
- **`config.js`** — Application configuration, inference endpoints, model presets, and supported options.
- **`generator.js`** — Generation state management, timing, and job lifecycle.
- **`inference-client.js`** — Communication with the configured inference service.
- **`ui.js`** — Interface updates, gallery interactions, video player controls, and notifications.
- **`validation.js`** — Prompt validation, input normalization, and safe rendering support.

---

## 🚀 Getting Started

### Prerequisites

- A modern web browser.
- [Git](https://git-scm.com/).
- [Node.js](https://nodejs.org/) for running the automated test scripts.
- Access to a compatible AI inference endpoint for actual video generation.

### 1. Clone the repository

```bash
git clone https://github.com/Peshimam-Ashar-Mohammed/Filza_Generator.git
cd Filza_Generator
```

### 2. Run the website locally

Because this is a static website, you can open `index.html` directly in your browser for basic interface testing.

For a local HTTP preview, use Python if it is installed:

```bash
python -m http.server 8000
```

Open:

```text
http://localhost:8000
```

Some browser features and cross-origin inference requests may behave differently when opened directly from a file versus an HTTP server.

### 3. Configure inference

Inspect `js/config.js` and `js/inference-client.js` to understand the configured endpoint and supported request protocol.

Before using an endpoint, verify:

- It is currently available.
- Its model and license permit your intended use.
- Anonymous inference is supported, if required.
- Browser cross-origin requests are permitted.
- Its queue, rate limits, and free-tier policies are suitable.
- The endpoint returns a video format the frontend can play and download.

**Never put private access tokens or API keys in public frontend code.** Any credentials embedded in a GitHub Pages application are visible to visitors.

### 4. Run the tests

```bash
node tests/run_all_tests.mjs
```

The project includes configuration, input-validation, and inference-client tests.

Live inference tests depend on external service availability, quotas, and network conditions. A passing test from an earlier run does not guarantee that the service is still available.

---

## 🌐 Deployment on GitHub Pages

1. Push the project to your public GitHub repository.
2. Open **Settings → Pages**.
3. Set the deployment source to **GitHub Actions**.
4. Ensure `.github/workflows/deploy.yml` contains a valid Pages deployment workflow.
5. Check the **Actions** tab for a successful deployment.
6. Open the published URL.

Expected URL:

**https://peshimam-ashar-mohammed.github.io/Filza_Generator/**

The URL becomes usable after the repository exists, Pages is configured, and deployment succeeds.

GitHub Pages hosts the static frontend; it does not provide the GPU computation for video generation.

---

## ⚙️ How Video Generation Works

1. The user enters a text prompt.
2. The frontend validates and normalizes the input.
3. The inference client submits a request to the configured provider.
4. The provider queues the job and executes the model.
5. The frontend tracks the job status when supported by the endpoint.
6. The completed video is made available to the browser.
7. The user previews and downloads the output.

Generation time, supported model settings, resolution, output format, queue position, and progress reporting depend on the inference service.

The frontend does not independently run the video-generation model on the user's device.

---

## 💸 Free-Tier Limitations

Filza Motion AI is designed to be accessible without requiring users to pay for an application subscription.

However, **free access is not a guarantee of unlimited AI inference**.

- Shared GPU availability may change.
- Requests may be queued or rate-limited.
- The provider may change its policies or disable a public Space.
- Cold starts and model initialization may increase latency.
- Anonymous inference and cross-origin access may stop working.
- Video generation may temporarily fail during provider outages.

If the configured service becomes unavailable, the website may remain accessible while generation is temporarily unavailable.

---

## 🔐 Privacy and Security

Filza Motion AI does not require users to register or submit an email address.

The static frontend is designed not to maintain its own user database or store generated videos on an application-owned server.

Nevertheless:

- Prompts must be sent to the inference provider for generation.
- Hosting and inference services may process technical metadata.
- Browser downloads are controlled by the user's device.
- Third-party privacy and retention policies may change.
- Public client-side source code must never contain private credentials.

Avoid submitting sensitive, confidential, or personally identifiable information in prompts.

---

## 🧪 Testing

The test suite is organized into three main areas:

| Test suite | Purpose |
|---|---|
| Configuration | Application settings, endpoint configuration, and model presets |
| Validation | Empty prompts, length limits, normalization, and safe rendering |
| Inference client | Request handling, queue communication, and output processing |

Run the complete suite using:

```bash
node tests/run_all_tests.mjs
```

Live inference checks require a reachable provider and available quota.

Test counts and results should be reported from an actual test run rather than treated as permanent guarantees.

---

## 📜 License

The frontend source code is distributed under the MIT License, subject to the terms of the included `LICENSE` file.

The project may integrate third-party models, libraries, or hosted services that have separate licenses and usage policies. Their terms apply independently.

Review the exact model checkpoint and any additional weights before redistributing them or using them commercially. Do not assume every model preset has the same license.

---

## 🗺️ Roadmap

Potential future improvements:

- [ ] Additional compatible text-to-video models.
- [ ] Improved handling of provider outages and quota exhaustion.
- [ ] More aspect ratios and output settings where supported.
- [ ] Better progress reporting when exposed by the backend.
- [ ] Enhanced prompt presets and camera-motion combinations.
- [ ] Improved accessibility and keyboard navigation.
- [ ] Automated browser-based end-to-end testing.
- [ ] Optional alternative inference providers.

---

## 🤝 Contributing

Contributions, bug reports, and feature suggestions are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Run the automated tests.
5. Submit a pull request with a clear explanation of the changes.

Please do not commit API keys, access tokens, or other secrets.

---

## 👨‍💻 Author

**Ashar Mohammed**

- GitHub: [@Peshimam-Ashar-Mohammed](https://github.com/Peshimam-Ashar-Mohammed)
- Portfolio: [Visit my portfolio](https://peshimam-ashar-mohammed.github.io/Portfolio/)

---

<p align="center">
  <strong>Filza Motion AI</strong><br>
  Turn your imagination into motion.
</p>
