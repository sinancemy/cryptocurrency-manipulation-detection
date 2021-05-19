import { useMemo, useState } from "react"
import { HiChevronDown, HiChevronUp } from "react-icons/hi"

const Header = () => null
const Body = () => null
const Footer = () => null

const headerColor = "gray-900"
const borderColor = "transparent"
const footerColor = "gray-900"
const bodyColor = "gray-900"
const textColor = "gray-100"
const headerTextColor = "gray-100"

export const DashboardPanel = ({ children, collapsable = true, restrictedHeight = true, headerDivisior = false, width = "full" }) => {

  const header = children.find(c => c.type === Header)
  const body = children.find(c => c.type === Body)
  const footer = children.find(c => c.type === Footer)
  const [shown, setShown] = useState(true)

  return useMemo(() => (
        <div 
          className={`text-${textColor} text-sm mb-2 w-${width}`}>
          <div 
            className={`text-${headerTextColor} bg-${headerColor} ${headerDivisior && `drop-shadow-md`} ${collapsable && 'cursor-pointer'} flex flex-justify-between ${shown ? 'rounded-t-md' : 'rounded-md'} py-4 px-5`}
            onClick={() => setShown(!collapsable || !shown)}>
              <div className={`font-bold text-md w-full`}>
                { header && header.props.children }
              </div>
              { collapsable && (
                <>
                <span className="flex-grow"></span>
                  { shown ? (
                    <HiChevronUp />
                  ) : (
                    <HiChevronDown />
                  )}
                </>
              )}
            </div>
            { shown && (
              <>
              <div className={`${!footer ? 'rounded-b border-b' : ''} ${restrictedHeight ? 'max-h-80' : ''} overflow-y-auto bg-${bodyColor} border-r border-l border-b border-${borderColor} pb-4 px-5`}>
                { body && body.props.children }
              </div>
              { footer && (
              <div className={`overflow-y-auto bg-${footerColor} rounded-b-md text-md border-b border-r border-l border-${borderColor} py-2 px-5`}>
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