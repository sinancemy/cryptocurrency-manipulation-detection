import { useMemo, useState } from "react"

const Header = () => null
const Body = () => null
const Footer = () => null

export const DashboardPanel = ({ children, collapsable = true }) => {

  const header = children.find(c => c.type === Header)
  const body = children.find(c => c.type === Body)
  const footer = children.find(c => c.type === Footer)
  const [globalHover, setGlobalHover] = useState(false)
  const [shown, setShown] = useState(true)

  return useMemo(() => (
        <div 
          className={`${false ? 'opacity-100' : 'opacity-90'} text-gray-600 text-sm mb-5 text-gray-200 w-full`}
          onMouseMove={() => setGlobalHover(true)}
          onMouseLeave={() => setGlobalHover(false)}
        >
          {collapsable ? (
            <div 
              className={`cursor-pointer flex flex-justify-between ${shown ? 'rounded-t-lg' : 'rounded-lg'} bg-white py-2 px-5 shadow-lg`}
              onClick={() => setShown(!collapsable || !shown)}
            >
              <div className="font-bold text-md">
                { header && header.props.children }
              </div>
              <span className="flex-grow">
              </span>
              { collapsable && (
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-4 w-4 opacity-60" 
                  viewBox="0 0 20 20" 
                  fill="currentColor"
                >
                  { shown ? (
                    <path fillRule="evenodd" d="M4.293 15.707a1 1 0 010-1.414l5-5a1 1 0 011.414 0l5 5a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414 0zm0-6a1 1 0 010-1.414l5-5a1 1 0 011.414 0l5 5a1 1 0 01-1.414 1.414L10 5.414 5.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M15.707 4.293a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 011.414-1.414L10 8.586l4.293-4.293a1 1 0 011.414 0zm0 6a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-5-5a1 1 0 111.414-1.414L10 14.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  ) }
                  </svg>
              )}
            </div>
          ) : (
            <div
              className={`bg-white py-2 px-5 shadow-lg rounded-t-lg`}
              >
              <div className="font-bold text-md w-full">
                { header && header.props.children }
              </div>
            </div>
          )}
            { shown && (
              <>
            <div className={`${!footer ? 'rounded-b-lg' : ''} overflow-y-auto bg-gray-50 border-t border-b border-gray-200 pb-2 px-5 shadow-lg`}>
              { body && body.props.children }
            </div>
            { footer && (
            <div className={`overflow-y-auto bg-gray-50 rounded-b-lg text-md border-b border-gray-200 py-2 px-5 shadow-lg`}>
              { footer.props.children} 
            </div>
            )}
            </>
            )}
        </div>
  ))
}

DashboardPanel.Header = Header
DashboardPanel.Body = Body
DashboardPanel.Footer = Footer