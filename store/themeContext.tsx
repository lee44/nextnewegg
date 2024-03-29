import { createContext, ReactElement, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext({
  isDarkTheme: true,
  toggleThemeHandler: () => {},
})

export const useThemeContext = () => {
  return useContext(ThemeContext)
}

interface ThemePropsInterface {
  children?: JSX.Element | Array<JSX.Element>
}

export const ThemeContextProvider = (props: ThemePropsInterface) => {
  const [isDarkTheme, setIsDarkTheme] = useState(true)
  useEffect(() => initialThemeHandler())

  function isLocalStorageEmpty(): boolean {
    return !localStorage.getItem('isDarkTheme')
  }

  function initialThemeHandler(): void {
    if (isLocalStorageEmpty()) {
      localStorage.setItem('isDarkTheme', `true`)
      document.documentElement.classList.add('dark')
      setIsDarkTheme(true)
    } else {
      const isDarkTheme: boolean = JSON.parse(localStorage.getItem('isDarkTheme')!)
      isDarkTheme && document.documentElement.classList.add('dark')
      setIsDarkTheme(() => {
        return isDarkTheme
      })
    }
  }

  function toggleThemeHandler(): void {
    const isDarkTheme: boolean = JSON.parse(localStorage.getItem('isDarkTheme')!)
    setIsDarkTheme(!isDarkTheme)
    toggleDarkClassToBody()
    setValueToLocalStorage()
  }

  function toggleDarkClassToBody(): void {
    document.documentElement.classList.toggle('dark')
  }

  function setValueToLocalStorage(): void {
    localStorage.setItem('isDarkTheme', `${!isDarkTheme}`)
  }

  return <ThemeContext.Provider value={{ isDarkTheme: isDarkTheme, toggleThemeHandler }}>{props.children}</ThemeContext.Provider>
}

export default ThemeContext
