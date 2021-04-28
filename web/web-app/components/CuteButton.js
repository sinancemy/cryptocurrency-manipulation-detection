const textColor = "gray-200"
const colorTo = "gray-780"
const colorFrom = "gray-800"
const hoverColor = "yellow-500"
const borderColor = "gray-900"
const hoverBorderColor = "gray-900"

export const CuteButton = ({ size = 'xs', onClick = () => {}, disabled = () => false, children }) => {
  return (
    <button
      className={`py-1 px-3 text-${size} text-${textColor} border border-${borderColor} rounded from-${colorFrom} to-${colorTo} bg-gradient-to-r hover:bg-${hoverColor} hover:border-${hoverBorderColor} disabled:cursor-not-allowed disabled:opacity-50`}
      onClick={onClick}
      disabled={disabled()}>
    { children }
  </button>
  )
}