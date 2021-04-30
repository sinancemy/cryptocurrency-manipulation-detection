import { SimpleDropdown } from "./SimpleDropdown"

export const SortSelector = ({ minimal = false, sortByState, sortOrderState, 
                                showPostsState, showPostsFromState }) => {
  return (
    <div className="flex text-xs items-center">
      <div className={`flex items-center ${!minimal && 'border-r'} border-gray-780 mr-2 px-2`}>
        <span className="mr-1">sort by</span>
          <SimpleDropdown 
            options={['time', 'interaction', 'user', 'impact']} 
            selected={sortByState[0]} 
            setSelected={sortByState[1]} />
          <span className="mx-1">in</span>
          <SimpleDropdown 
            options={['ascending', 'descending']} 
            selected={sortOrderState[0]} 
            setSelected={sortOrderState[1]} />
          <span className="mx-1">order</span>
      </div>
      { !minimal &&
      <div className="flex items-center px-2">
        <span className="mx-1">show</span>
          <SimpleDropdown 
            options={['relevant', 'all']} 
            selected={showPostsState[0]} 
            setSelected={showPostsState[1]} />
        <span className="mx-1">posts from</span>
          <SimpleDropdown
            options={['all', 'selected']}
            selected={showPostsFromState[0]}
            setSelected={showPostsFromState[1]} />
          <span className="mx-1">sources</span>
      </div>
      }
  </div>
  )
}