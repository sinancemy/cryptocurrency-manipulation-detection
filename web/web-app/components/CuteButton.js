const defaultTextColor = "gray-200"
const defaultColor = "gray-780"
const defaultHoverColor = "gray-850"
const borderColor = "gray-900"
const hoverBorderColor = "gray-780"

export const CuteButton = ({ size = 'xs', onClick = () => {}, disabled = () => false, 
                              color = defaultColor, 
                              hoverColor = defaultHoverColor, 
                              textColor = defaultTextColor,
                              fullWidth = false,
                              children }) => {
  return (
    <button
      className={`py-1 px-3 text-${size} text-${textColor} ${fullWidth && 'w-full'} border border-${borderColor} rounded bg-${color} hover:bg-${hoverColor} hover:border-${hoverBorderColor} disabled:cursor-not-allowed disabled:opacity-50`}
      onClick={onClick}
      disabled={disabled()}>
    { children }
  </button>
  )
}