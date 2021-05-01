import { AiOutlineLoading } from "react-icons/ai"

const defaultTextColor = "gray-200"
const defaultColor = "gray-780"
const defaultHoverColor = "gray-850"
const defaultBorderColor = "gray-900"
const defaultHoverBorderColor = "gray-780"

export const CuteButton = ({ size = 'xs', onClick = () => {}, 
                              isDisabled = () => false, 
                              color = defaultColor, 
                              hoverColor = defaultHoverColor, 
                              textColor = defaultTextColor,
                              borderColor = defaultBorderColor,
                              hoverBorderColor = defaultHoverBorderColor,
                              width = null,
                              children }) => {
  return (
    <button
      className={`py-1 px-3 ${width != null && `w-${width}`}
                text-${size} text-${textColor} flex flex-row justify-center items-center 
                border border-${borderColor} rounded bg-${color} 
                hover:bg-${hoverColor} hover:border-${hoverBorderColor} 
                disabled:cursor-not-allowed disabled:opacity-50`}
      onClick={onClick}
      disabled={isDisabled()}>
        { children }
  </button>
  )
}