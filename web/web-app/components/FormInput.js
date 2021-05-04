import { useEffect, useState } from "react"

export const FormInput = ({ label, placeholder, type, errorMsg, isDisabled = false, 
                            checker = () => [true, null], setCorrectValue }) => {

  const [value, setValue] = useState("")
  const [firstUpdate, setFirstUpdate] = useState(false)
  const [outsideError, setOutsideError] = useState(true)
  const [innerErrorMsg, setInnerErrorMsg] = useState("")

  useEffect(() => {
    if(!firstUpdate || outsideError) return
    const [res, err] = checker(value)
    if(res) {
      setInnerErrorMsg("")
      setCorrectValue(value)
    } else {
      setInnerErrorMsg(err)
      setCorrectValue(null)
    }
  })

  useEffect(() => {
    setOutsideError(true)
    setInnerErrorMsg(errorMsg)
  }, [errorMsg])

  useEffect(() => {
    setOutsideError(false)
  }, [value])

  return (
    <div class="flex flex-col space-y-2">
    <label className="block text-gray-700 text-md font-bold mb-2">
      { label }
      <input
        type={type}
        placeholder={placeholder}
        onFocus={() => setFirstUpdate(true)}
        disabled={isDisabled}
        value={value}
        onChange={(e) => setValue(e.currentTarget.value)}
        className={`mt-1 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight
            ${(innerErrorMsg !== "") ? "border-red-500" : null}`} />
    </label>
    <p class="text-red-500 text-xs italic mt-2 ml-1">
      {innerErrorMsg}
    </p>
  </div>
  )
}