import axios from "axios"
import { useEffect, useMemo, useRef, useState } from "react"
import { HOST } from "./helpers"

// Helper function.
export const fetchFromApi = (endpoint, params, then) => {
    axios.get(HOST + "/api/" + endpoint, { params: params }).then(res => {
        then(res.data)
    })
}

// Parameter values are automatically added to the dependency list.
export const useApiData = (initialState, endpoint, params = {}, deps = [],
                           shouldFetch = (params) => true,
                           postProcessor = (x) => x) => {
    const [result, setResult] = useState(initialState)
    const [isLoading, setIsLoading] = useState(false)
    const effectiveParams = useMemo(() => Object.values(params), [params])
    // Fetch depending on the given dependencies.
    useEffect(() => {
      // Wait...
      if(!shouldFetch(effectiveParams)) return
      setIsLoading(true)
      fetchFromApi(endpoint, params, (data) => {
        setResult(postProcessor(data))
      })
    }, [...effectiveParams, ...deps])

    useEffect(() => {
      setIsLoading(false)
    }, [result])
    return { result: result, isLoading: isLoading }
}

