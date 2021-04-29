const Left = () => null
const Middle = () => null
const Right = () => null

const defaultColor = "gray-900"
const borderColor = "gray-800"
const textColor = "gray-100"

export const MultipurposeCard = ({ children, badgeColor, colorizer = () => defaultColor, hoverColorizer = () => colorizer(), disperse = false }) => {

  const left = children.find(c => c.type === Left)
  const middle = children.find(c => c.type === Middle)
  const right = children.find(c => c.type === Right)

  return (
    <div className="flex flex-row mb-2">
      <div className={`w-1.5 flex-none bg-${badgeColor} rounded-l`}></div>
      <div className={`flex flex-row items-center justify-between ${disperse && 'justify-between'} py-2 px-4 
                        w-full text-${textColor} bg-${colorizer()} hover:bg-${hoverColorizer()} border border-${borderColor} rounded-r`}>
        <div class="flex-none">
            { left && left.props.children }
        </div>
        <div className="pl-2 flex-grow">
            { middle && middle.props.children }
        </div>
        <div className="pl-2 flex-none">
            { right && right.props.children }
        </div> 
      </div>
    </div>
    )
  }

  MultipurposeCard.Left = Left
  MultipurposeCard.Middle = Middle
  MultipurposeCard.Right = Right