# THINKING.md

## Assumptions
**Why calculations were done this way:**
*   **Revenue Definition**: I assumed "Revenue" strictly means deals with `stage: 'Closed Won'`. Active deals (Prospecting/Negotiation) are "Pipeline", not revenue and deals with `stage: 'Closed Lost'` are deals that ended without a sale for some reason. Hence they are not considered in the calculation.
*   **Time Reference (Simulation)**: The dataset contains deals throughout 2025. To show meaningful "Current Quarter" data, I hardcoded the simulation date to **Dec 31, 2025**. 
*   **Currency**: Assumed all monetary values are USD.
*   **Drivers (Pipeline/Win Rate)**:
    *   *Win Rate*: Calculated as `(Closed Won) / (Closed Won + Closed Lost)`. Deals still in progress are excluded from the denominator to reflect true historical performance.
    *   *Pipeline*: Sum of amounts for all deals in `Prospecting` or `Negotiation` stages.
*   **Risk Factors**:
    *   *Stale Deals*: Defined as any deal in `Negotiation` stage for >90 days, or `Prospecting` for >60 days.
    *   *Underperforming Reps*: Reps whose Win Rate is below the company average.
*   **Recommendations**: Generated rule-based suggestions. For example, if pipeline coverage (Pipeline / Target) is low (< 3x), recommend "Focus on top-of-funnel activity".

## Data Issues Found
*   **Inconsistent Amounts**: Several deals of type `Closed Won` or `Prospecting` or `Negotiating` have `NULL` amount which is confusing, though it has been handled carefully.
*   **Inconsistent Dates**: Some `closed_at` timestamps are `NULL` for deals which are `Closed Won`. As per the deals data there are `45` such deals.

## Tradeoffs Chosen
This section answers: "What was the 'easy' way vs. the 'right' way, and why did I choose one over the other?"

*   **In-Memory Aggregation vs. Database Aggregation**:
    *   **The Problem**: We need to sum up revenue by month.
    *   **Option A (Database Way - "The Right Way")**: Write a complex SQL query (`SELECT SUM(amount) ... GROUP BY MONTH(closed_at)`). This is fast for the database but harder to write/debug quickly if we are setting up a new project or using a mock database.
    *   **Option B (In-Memory Way - "The Easy Way")**: Fetch *all* data to the backend (JavaScript) and use a `for` loop or `.reduce()` to sum it up.
    *   **Our Choice**: We chose **Option B**.
    *   **Why?**: For a small dataset (5000 deals), JavaScript is blazing fast and the code is very readable. It allowed us to move faster. The "tradeoff" is that we sacrificed **scalability** (it won't work for 1 million deals) for **development speed**.

## What would break at 10× scale?
This section answers: "If this company suddenly got huge, what parts of our code would crash first?"

1.  **Backend Memory (The "OOM" Crash)**:
    *   **Current State**: In `trend.controller.ts`, we do `prisma.deal.findMany()`. This loads **every single closed deal** into the server's RAM.
    *   **At 10x/100x Scale**: If we have 1,000,000 deals, loading them all into a JavaScript array might take 2GB+ of RAM. Node.js typically crashes around 1.5GB-2GB.
    *   **The Fix**: Use **Pagination** (load 50 at a time) or **Database Aggregation** (let the database do the math and only send back the final 12 numbers for the months).

2.  **Frontend Performance (The "Sluggish UI")**:
    *   **Current State**: We use SVG (Scalable Vector Graphics) for the charts. Each bar and dot is a separate DOM element.
    *   **At 10x Scale**: If we tried to show a daily trend for 10 years (3650 data points), the browser has to manage 3650 `<rect>` tags. This makes the page slow to scroll and interact with.
    *   **The Fix**: Use **Canvas** (one single image, no DOM elements) or **Downsampling** (group days into weeks/months to reduce data points).

## AI Usage vs. Human Decisions
*   **AI Helped With**: Project setup, generating the initial project boilerplate (Express setup, D3 chart skeleton), debugging some errors in React, and writing repetitive Swagger JSDoc comments, helping with formulating logic for controllers after proper research on the topics, UI development, business logic suggestions and documentations.
*   **Human Decisions**: 
    *   Deciding to split the API into controllers.
    *   Finalising the business logic.
    *   Identifying the need for a "Simulation Date" to make the dataset relevant.
    *   Verifying the correctness of the data flow end-to-end.
    *   Verfiying the correctness of the UI against the expectation
    *   Deciding the need to document API for the ease of development
