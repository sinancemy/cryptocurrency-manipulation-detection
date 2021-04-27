import { FaRedditAlien, FaTwitter } from "react-icons/fa"

const colorMap =  [["twitter", "blue-400"], ["reddit", "red-500"]]
const iconMap = [["twitter", <FaTwitter />], ["reddit", <FaRedditAlien />]]

export const getSourceParts = (source) => {
  const [username, src] = source.split("@")
  return [username, src]
}

export const dateToString = (date, withWeekDay) => {
  const parts = ('' + date).split(' ')
  return [withWeekDay ? parts[0] : '', 
          parts[2][0] == '0' ? parts[2].slice(1) : parts[2], 
          parts[1], 
          "'" + parts[3].slice(2),
          parts[4].slice(0, 5)].join(' ')
}

export const getSourceColor = (source) => {
  for(const e of colorMap) {
      if(getSourceParts(source)[1].includes(e[0])) return e[1]
    }
    return "gray"
}

export const getSourceIcon = (source) => {
  for(const e of iconMap) {
    if(getSourceParts(source)[1].includes(e[0])) return e[1]
  }
  return () => {}
}
