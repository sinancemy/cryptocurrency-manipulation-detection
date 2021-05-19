import { dateToString, getSourceColor, getSourceIcon, getSourceParts } from "../helpers"
import { MultipurposeCard } from "./MultipurposeCard"
import { TiAt } from "react-icons/ti"
import Link from "next/link"

const mutedTextColor = "gray-500"
const bgColor = "gray-850"

export const SourceOverview = ({ source, button, singleLine = false }) => {

  const hasUsername = () => !source.startsWith('*@')
  const getUsername = () => getSourceParts(source)[0] === '*' ? null : getSourceParts(source)[0]
  const getSource = () => getSourceParts(source)[1]

  return (source &&
    <MultipurposeCard badgeColor={getSourceColor(source)} colorizer={() => bgColor}>
      <MultipurposeCard.Left>
        <div className={`text-4xl text-${getSourceColor(source)} ${singleLine ? 'p-2' : 'p-4'}`}>
          { hasUsername() ? (
            <TiAt />
          ) : getSourceIcon(source)}
        </div>
      </MultipurposeCard.Left>
      <MultipurposeCard.Middle>
        <div className={`flex flex-col`}>
          <div className={`flex flex-row items-center`}>
            <span className="hover:underline">
            { hasUsername() ? (
              <Link href={`/user-info?user=${source}`}>
                { getUsername() }
              </Link>
              ) : (
              <Link href={`/source-info?source=${source}`}>
                { getSource() }
              </Link>
            ) }
            </span>
          </div>
          { !singleLine && hasUsername() && (
            <div className={`flex flex-row items-center text-xs text-${mutedTextColor}`}>
                <span>
                  { getSourceIcon(source) }
                </span>
                <span className="ml-1 hover:underline">
                  <Link href={`/source-info?source=${source}`}>
                    { getSource() }
                  </Link>
                </span>
            </div>
          )}
        </div>
      </MultipurposeCard.Middle>
      <MultipurposeCard.Right>
        <div className="px-3">
          { button }
        </div> 
      </MultipurposeCard.Right>
    </MultipurposeCard>
    )
}