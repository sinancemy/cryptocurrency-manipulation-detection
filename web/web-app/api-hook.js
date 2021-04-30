import axios from "axios"
import { useEffect, useState } from "react"

export const useApiData = (initialState, endpoint, params = {}, deps = [], shouldFetch = () => true, postProcessor = (x) => x) => {
    const [result, setResult] = useState(initialState)
    // Fetch depending on the given dependencies.
    useEffect(() => {
        // Wait...
        if(!shouldFetch()) return
        axios.get("http://127.0.0.1:5000/api/" + endpoint, {params: params}).then(res => {
            setResult(postProcessor(res.data))
        })
    }, deps)
    return result
}