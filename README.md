# Campus Buzz

A hybrid event-submission system built with container services and serverless functions.

## Features

- Accepts campus event submissions through a web form
- Stores each submission before background processing starts
- Validates required fields, date format, and description length
- Classifies events into `OPPORTUNITY`, `ACADEMIC`, `SOCIAL`, or `GENERAL`
- Assigns `HIGH`, `MEDIUM`, or `NORMAL` priority from the category
- Updates the stored record with the final result and displays it to the user

## Architecture

- `presentation-service` (container): serves the web UI and result pages
- `workflow-service` (container): accepts submissions, stores records, triggers processing
- `data-service` (container): stores and returns submission records, designed for `ApsaraDB RDS MySQL` in Alibaba Cloud
- `submission-event-function` (serverless): turns a new submission into a processing request
- `processing-function` (serverless): applies validation, category, and priority rules
- `result-update-function` (serverless): writes the computed result back to storage

## Result rules

- Missing required field -> `INCOMPLETE`
- Invalid `YYYY-MM-DD` date -> `NEEDS REVISION`
- Description shorter than 40 characters -> `NEEDS REVISION`
- Category precedence:
  - `OPPORTUNITY`: `career`, `internship`, `recruitment`
  - `ACADEMIC`: `workshop`, `seminar`, `lecture`
  - `SOCIAL`: `club`, `society`, `social`
  - otherwise `GENERAL`
- Priority:
  - `HIGH` for `OPPORTUNITY`
  - `MEDIUM` for `ACADEMIC`
  - `NORMAL` for `SOCIAL` and `GENERAL`

## Local Run

1. `pnpm install`
2. Start the local simulation services:
   - `pnpm dev:data`
   - `pnpm dev:workflow`
   - `pnpm dev:presentation`
   - `pnpm dev:submission-fn`
   - `pnpm dev:processing-fn`
   - `pnpm dev:result-update-fn`
3. Open `http://localhost:3000`

## Local endpoints

- Presentation service: `http://localhost:3000`
- Workflow service: `http://localhost:3001`
- Data service: `http://localhost:3002`
- Submission event function: `http://localhost:7001/invoke`
- Processing function: `http://localhost:7002/invoke`
- Result update function: `http://localhost:7003/invoke`

## Deployment

- Local development can use file storage.
- Alibaba Cloud deployment should switch `STORAGE_DRIVER=mysql`.
