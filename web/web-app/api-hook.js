import axios from "axios"
import { useEffect, useMemo, useRef, useState } from "react"

// Helper function.
export const fetchFromApi = (endpoint, params, then) => {
    axios.get("http://127.0.0.1:5000/api/" + endpoint, { params: params }).then(res => {
        then(res.data)
    })
}

// Parameter values are automatically added to the dependency list.
export const useApiData = (initialState, endpoint, params = {}, deps = [], shouldFetch = () => true, postProcessor = (x) => x) => {
    const [result, setResult] = useState(initialState)
    const [isLoading, setIsLoading] = useState(false)
    const effectiveParams = useMemo(() => Object.values(params), [params])
    // Fetch depending on the given dependencies.
    useEffect(() => {
      //console.log(effectiveParams)
      // Wait...
      if(!shouldFetch(effectiveParams)) return
      setIsLoading(true)
      fetchFromApi(endpoint, params, (data) => {
        setResult(postProcessor(data))
        setIsLoading(false)
      })
    }, [...effectiveParams, ...deps])
    return { result: result, isLoading: isLoading }
}

export function useTraceUpdate(props) {
    const prev = useRef(props);
    useEffect(() => {
      const changedProps = Object.entries(props).reduce((ps, [k, v]) => {
        if (prev.current[k] !== v) {
          ps[k] = [prev.current[k], v];
        }
        return ps;
      }, {});
      if (Object.keys(changedProps).length > 0) {
        console.log('Changed props:', changedProps);
      }
      prev.current = props;
    });
  }

