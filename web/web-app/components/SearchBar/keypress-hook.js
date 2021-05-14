import {useEffect, useState} from "react"

export const useKeyUp = (targetKeyCode, onKeyUp) => {
  // If pressed key is our target key then set to true
  const upHandler = (e) => {
    console.log(e.key)
    if (e.keyCode === targetKeyCode) {
      e.preventDefault()
      onKeyUp()
    }
  }
  // Add event listeners
  useEffect(() => {
    window.addEventListener("keyup", upHandler);
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener("keyup", upHandler);
    };
  }, []); // Empty array ensures that effect is only run on mount and unmount
}