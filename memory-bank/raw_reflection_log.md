---
Date: 2025-07-01
TaskRef: "Fix net::ERR_INSUFFICIENT_RESOURCES error in Supabase query"

Learnings:
- The `net::ERR_INSUFFICIENT_RESOURCES` error can be caused by an infinite loop of network requests.
- In React, a `useEffect` hook that fetches data and updates state can cause an infinite loop if the state variable it updates is not included in the dependency array.
- The component re-renders when the state is updated, which re-runs the `useEffect` hook, creating the loop.

Difficulties:
- None.

Successes:
- Correctly identified the root cause of the error by analyzing the code and the error message.
- Applied the correct fix by adding the missing dependency to the `useEffect` hook's dependency array.

Improvements_Identified_For_Consolidation:
- General pattern: When a `useEffect` hook fetches data and updates state, ensure the state variable is included in the dependency array to prevent infinite loops.
