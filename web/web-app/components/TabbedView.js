import { useState } from "react"

export const TabbedView = ({ children, options, width = "full" }) => {

  const [selectedTab, setSelectedTab] = useState(0)

  return (
    <div className={`flex flex-col space-y-2 w-${width}`}>
      <div className="flex flex-row space-x-2">
          { options.map((opt, i) => (
            <button onClick={() => setSelectedTab(i)}
              className={`py-2 px-4 ${selectedTab === i ? 'bg-gray-800' : 'opacity-70'} 
                          hover:opacity-100 rounded`}>
              { opt }
            </button>
          )) }
      </div>
      <div>
        { children.map((child, i) => (
          <div className={`${i !== selectedTab && 'hidden'}`}>
            { child }
          </div>
        )) }
      </div>
    </div>
  )
}