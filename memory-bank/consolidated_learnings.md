## React Hooks - Best Practices

**Pattern: Preventing Infinite Loops in `useEffect` with Data Fetching**
- When a `useEffect` hook fetches data and then updates a state variable with that data, it is critical to include that state variable in the hook's dependency array.
- **Rationale:** Failure to include the state variable will cause an infinite loop. The component will re-render after the state is updated, which causes the `useEffect` hook to run again, repeating the fetch and update cycle indefinitely. This can lead to errors like `net::ERR_INSUFFICIENT_RESOURCES` in the browser.
- *Example:*
    ```javascript
    const [data, setData] = useState(null);

    useEffect(() => {
      fetchData().then(setData);
    }, [data]); // <-- Including 'data' in the dependency array prevents the loop.
