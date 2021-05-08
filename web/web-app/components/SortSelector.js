import { SimpleCycler } from "./SimpleCycler"
import { SimpleDropdown } from "./SimpleDropdown"

export const SortSelector = ({ minimal = false, sortByState, sortOrderState, showPostsState, 
                              sortByOptions=['time', 'interaction', 'user', 'impact'],
                              sortOrderOptions=['ascending', 'descending'],
                              showPostsOptions=['relevant', 'all'] }) => {
  return (
    <div className="flex text-xs items-center">
      <div className={`flex items-center ${!minimal && 'border-r'} border-gray-780 mr-2 px-2`}>
        <span className="mr-1">sort by</span>
          <SimpleDropdown 
            options={sortByOptions} 
            selected={sortByState[0]} 
            setSelected={sortByState[1]} />
          <span className="mx-1">in</span>
          <SimpleCycler 
            options={sortOrderOptions} 
            selected={sortOrderState[0]} 
            setSelected={sortOrderState[1]} />
          <span className="mx-1">order</span>
      </div>
      { !minimal &&
      <div className="flex items-center px-2">
        <span className="mx-1">show</span>
          <SimpleCycler 
            options={showPostsOptions} 
            selected={showPostsState[0]} 
            setSelected={showPostsState[1]} />
        <span className="mx-1">posts</span>
      </div>
      }
  </div>
  )
}