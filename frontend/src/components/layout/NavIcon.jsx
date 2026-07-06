export default function NavIcon({ item }) {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      {item.iconPaths ? (
        item.iconPaths.map((d, i) => (
          <path key={i} strokeLinecap="round" strokeLinejoin="round" d={d} />
        ))
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d={item.iconPath} />
      )}
    </svg>
  )
}
