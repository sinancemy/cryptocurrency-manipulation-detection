export const MenuPages = ({ children, index }) => {
    return children.map((child, i) => (
        <div className={`${i !== index && 'hidden'}`}>
            {child}
        </div>
    ))
}