import { NavLink } from 'react-router-dom'

const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Games', to: '/games' },
]

export function MainNav() {
  return (
    <nav aria-label="Primary" className="main-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            isActive ? 'main-nav__link main-nav__link--active' : 'main-nav__link'
          }
          end={item.to === '/'}
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}
