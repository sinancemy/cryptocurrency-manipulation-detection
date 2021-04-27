const textColor = "gray-800"
const colorTo = "yellow-400"
const colorFrom = "yellow-400"
const hoverColor = "yellow-500"
const borderColor = "transparent"
const hoverBorderColor = "transparent"

export const CuteButton = ({ size = 'xs', onClick = () => {}, disabled = () => false, children }) => {
  return (
    <button
      className={`py-1 px-3 text-${size} text-${textColor} border border-${borderColor} rounded from-${colorFrom} to-${colorTo} bg-gradient-to-r hover:bg-${hoverColor} hover:border-${hoverBorderColor} disabled:opacity-50`}
      onClick={onClick}
      disabled={disabled()}>
    { children }
  </button>
  )
}