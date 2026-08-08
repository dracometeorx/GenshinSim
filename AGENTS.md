# Project deployment policy

- Treat all implementation requests in this repository as local-only by default.
- Local builds, tests, linting, and local preview servers are allowed.
- Do not push source to the Sites repository, save a Sites version, or start a
  Sites production deployment unless the user explicitly requests deployment
  in the current task.
- Keep `.openai/hosting.json` intact so the user can deploy manually or request
  a deployment later.
