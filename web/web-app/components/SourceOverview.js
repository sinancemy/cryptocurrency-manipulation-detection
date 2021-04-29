import { dateToString, getSourceColor, getSourceIcon, getSourceParts } from "../Helpers"
import { MultipurposeCard } from "./MultipurposeCard"
import { TiAt } from "react-icons/ti"
import Link from "next/link"

const mutedTextColor = "gray-500"
const bgColor = "gray-850"

export const SourceOverview = ({ source, button, singleLine = false }) => {

  const hasUsername = () => !source.startsWith('*@')
  const getUsername = () => getSourceParts(source)[0] === '*' ? null : getSourceParts(source)[0]
  const getSource = () => getSourceParts(source)[1]

  return (
    <MultipurposeCard badgeColor={getSourceColor(source)} colorizer={() => bgColor}>
      <MultipurposeCard.Left>
        <span className={`text-4xl text-${getSourceColor(source)}`}>
          { hasUsername() ? (
            <TiAt />
          ) : getSourceIcon(source)}
        </span>
      </MultipurposeCard.Left>
      <MultipurposeCard.Middle>
        <div className={`flex flex-col ml-2`}>
          <div className={`py-1 flex flex-row items-center`}>
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
        <div>
          { button }
        </div> 
      </MultipurposeCard.Right>
    </MultipurposeCard>
    )
}