# State Of Conquest Code

Deferred audit request to complete after the current Phase 5G cleanup/polish pass is accepted.

## Requested Deliverable

Produce a deep source-code assessment for the current Conquest codebase.

## Required Scope

1. Collect full analysis on each file undr src.
   - Is the file correct?
   - Does it only contain contents relevant to what its name claims it owns?
   - Can comments be improved?
   - Should the file be merged with another file?
   - Should the file be split into smaller ownership-based files?
   - Should it be renamed to be clearer?
   - What dead layers, duplicated ownership, or legacy paths should be removed?
   - What code paths are dead or clunky and can be fixed without much risk?

2. Collect full architecture mapping.
   - Is the architecture correct?
   - Does it need improvement?
   - Should files be reorganized?
   - Are ownership boundaries clear and consistent with the design doc?

3. Collect full recommendations on weak points in the code.
   - What is a big problem?
   - What should be fixed?
   - What are the top 3 riskiest issues that could cause:
     - a performance issue / low FPS
     - a crash
     - unstable UI or bad lifecycle behavior

4. Collect full analysis on how the codebase could be truncated.
   - If and only if requested, could the codebase be made smaller?
   - How would that be done without sacrificing quality or functionality?

5. Make a full feature functionality list
   - Exactly what features exist, and how they work
   - What a comprehensive test plan would involve, with one human in check list form, focusing just on the things you can test with a single person.
   - What a comprehensive test plan would involve, with two humans in check list form, focusing just on the MP specific functionality.
   - This should be exhaustive so that we can regression tests after file changes and major architectural changes.

## Expected Output Structure

1. Executive summary
2. Architecture map
3. File-by-file review
4. Top risks
5. Cleanup / reorganization recommendations
6. Code-size reduction opportunities
7. Prioritized follow-up plan
8. Test Plan for Humans

## Current Timing

Do not execute this full audit yet.

Return to this document after the active Phase 5G cleanup/polish work is complete or intentionally paused.
