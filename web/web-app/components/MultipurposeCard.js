const Left = () => null
const Middle = () => null
const Right = () => null

const defaultColor = "gray-900"
const borderColor = "gray-800"
const textColor = "gray-100"

export const MultipurposeCard = ({ children, badgeColor, colorizer = () => defaultColor, hoverColorizer = () => colorizer(), aligned = true }) => {

  const left = children.find(c => c.type === Left)
  const middle = children.find(c => c.type === Middle)
  const right = children.find(c => c.type === Right)

  return (
    <div className={`flex flex-row relative border border-${borderColor} rounded
                    items-center w-full text-${textColor} z-0
                    bg-${colorizer()} hover:bg-${hoverColorizer()}`}>
      <div className={`w-1.5 absolute left-0 top-0 bottom-0 bg-${badgeColor} rounded-l`}></div>
      <div className={`flex-grow ml-1.5 flex flex-row ${aligned && 'items-center'} overflow-hidden`}>
        <div className="flex-none">
            { left && left.props.children }
        </div>
        <div className="flex-grow flex-shrink overflow-hidden">
            { middle && middle.props.children }
        </div>
        <div className="flex-none">
            { right && right.props.children }
        </div> 
      </div>
    </div>
    )
  }

  MultipurposeCard.Left = Left
  MultipurposeCard.Middle = Middle
  MultipurposeCard.Right = Right