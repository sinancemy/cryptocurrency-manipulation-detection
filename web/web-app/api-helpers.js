import axios from "axios"
import { useCallback, useEffect, useState } from "react"

export const useApiData = (initialState, endpoint, params = {}, deps = [], wait = [], postProcessor = (x) => x) => {
    const [result, setResult] = useState(initialState)
    // Fetch depending on the given dependencies.
    useEffect(() => {
        // If any of the waiters are null, do NOT send the request.
        if(wait.some(d => d == null)) return
        axios.get("http://127.0.0.1:5000/api/" + endpoint, {params: params}).then(res => {
            setResult(postProcessor(res.data))
        })
    }, deps)
    return result
}