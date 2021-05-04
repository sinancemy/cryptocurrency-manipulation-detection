import { useEffect, useState } from "react"

export const SimpleMenu = ({ options, onChange = () => {} }) => {

  const [selectedPage, setSelectedPage] = useState(0)

  useEffect(() => {
    onChange(selectedPage)
  }, [selectedPage])

  return (
      <div className="flex flex-col space-y-2">
          { options.map((opt, i) => (
            <button onClick={() => setSelectedPage(i)}
              className={`py-2 px-4 ${selectedPage === i ? 'bg-gray-800' : 'opacity-70'} 
                          hover:opacity-100 rounded text-left`}>
              { opt }
            </button>
          )) }
      </div>
  )
}