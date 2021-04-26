export const CuteButton = ({ size = 'xs', onClick = () => {}, disabled = () => false, children }) => {
  return (
    <button
      className={`py-1 px-3 text-${size} border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50`}
      onClick={onClick}
      disabled={disabled()}
    >
    { children }
  </button>
  )
}